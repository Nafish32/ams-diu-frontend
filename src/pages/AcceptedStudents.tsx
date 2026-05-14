import { startTransition, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import { SemesterCombobox } from "../components/SemesterCombobox";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { usePermissions } from "../hooks/usePermissions";
import { useEffectiveDepartment } from "../hooks/useEffectiveDepartment";
import {
  formatSemesterLabel,
  PRETTY_STATUS_LABELS,
  type AdmissionResult,
} from "../lib/admission";
import {
  buildResultSheetRows,
  getResultStatusBadgeClass,
  resolveFacultyName,
  type ExamLookupRecord,
} from "../lib/result-sheet";
import {
  drawDiuPdfChrome,
  formatReportDate,
  loadDiuLogoDataUrl,
} from "../lib/diu-report-pdf";
import { downloadBlobFile } from "../lib/pdf-download";
import { admissionResultsAPI, examAPI } from "../services/api";
import { StudentAdmissionReportDialog } from "../components/StudentAdmissionReportDialog";

interface AcceptedStudentsProps {
  gradientClass?: string;
}

const TAB_TO_STATUS = {
  selected: "SELECTED",
  rejected: "REJECTED",
  waiting: "WAITING",
  absent: "ABSENT",
} as const;

const DEFAULT_SUMMARY = {
  SELECTED: 0,
  WAITING: 0,
  REJECTED: 0,
  ABSENT: 0,
};

export function AcceptedStudents({ gradientClass = "" }: AcceptedStudentsProps) {
  const { canRead, canWrite } = usePermissions();
  const { department, isFallback, isLoading: isDepartmentLoading, error: departmentError } =
    useEffectiveDepartment();
  const hasReadAccess = canRead();
  const hasWriteAccess = canWrite();

  const [semesterOptions, setSemesterOptions] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [activeTab, setActiveTab] = useState<keyof typeof TAB_TO_STATUS>("selected");
  const [results, setResults] = useState<AdmissionResult[]>([]);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [configurationMissing, setConfigurationMissing] = useState(false);
  const [examRecords, setExamRecords] = useState<ExamLookupRecord[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [topCandidateCount, setTopCandidateCount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [selectedReportExamId, setSelectedReportExamId] = useState<number | null>(null);
  const [selectedReportStudentId, setSelectedReportStudentId] = useState<number | null>(null);
  const [selectedReportStudentName, setSelectedReportStudentName] = useState("");
  const [downloadingReportId, setDownloadingReportId] = useState<number | null>(null);

  useEffect(() => {
    if (!hasReadAccess) {
      return;
    }

    let isMounted = true;

    const loadSemesterOptions = async () => {
      if (!department?.id) {
        setSemesterOptions([]);
        setSelectedSemester("");
        setResults([]);
        setSummary(DEFAULT_SUMMARY);
        setConfigurationMissing(false);
        return;
      }

      try {
        const response = await admissionResultsAPI.getSemesterOptions({
          department_id: department.id,
        });
        const semesters = response?.semesters || [];

        if (!isMounted) {
          return;
        }

        setSemesterOptions(semesters);
        setSelectedSemester((currentSemester) => {
          if (currentSemester && semesters.includes(currentSemester)) {
            return currentSemester;
          }

          return semesters[0] || "";
        });
      } catch (semesterError: any) {
        if (isMounted) {
          toast.error(semesterError?.message || "Failed to load semester options");
          setSemesterOptions([]);
          setSelectedSemester("");
          setResults([]);
          setSummary(DEFAULT_SUMMARY);
          setConfigurationMissing(false);
        }
      }
    };

    const loadExamRecords = async () => {
      try {
        const response = await examAPI.getAllExams();
        const nextExams = response?.results || response?.data || response || [];

        if (isMounted) {
          setExamRecords(Array.isArray(nextExams) ? nextExams : []);
        }
      } catch (examError) {
        if (isMounted) {
          console.error("Error loading exam records for result sheet:", examError);
        }
      }
    };

    loadSemesterOptions();
    loadExamRecords();

    return () => {
      isMounted = false;
    };
  }, [hasReadAccess, department?.id]);

  useEffect(() => {
    setResults([]);
    setSummary(DEFAULT_SUMMARY);
    setConfigurationMissing(false);
    setSelectedStudentIds([]);
  }, [department?.id, selectedSemester]);

  useEffect(() => {
    if (!hasReadAccess || !department?.id || !selectedSemester) {
      setResults([]);
      setSummary(DEFAULT_SUMMARY);
      setConfigurationMissing(false);
      return;
    }

    let isMounted = true;

    const loadResults = async () => {
      try {
        setIsLoading(true);
        const response = await admissionResultsAPI.getResults({
          department_id: department.id,
          semester: selectedSemester,
        });

        if (!isMounted) {
          return;
        }

        const isConfigMissing = Boolean(response?.configuration_missing);
        startTransition(() => {
          setConfigurationMissing(isConfigMissing);
          setResults(isConfigMissing ? [] : response?.results || []);
          setSummary(isConfigMissing ? DEFAULT_SUMMARY : {
            ...DEFAULT_SUMMARY,
            ...(response?.summary || {}),
          });
          setSelectedStudentIds([]);
        });
      } catch (resultError: any) {
        if (!isMounted) {
          return;
        }

        console.error("Error loading accepted students:", resultError);
        toast.error(resultError?.message || "Failed to load accepted students");
        setResults([]);
        setSummary(DEFAULT_SUMMARY);
        setConfigurationMissing(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadResults();

    return () => {
      isMounted = false;
    };
  }, [hasReadAccess, department?.id, selectedSemester]);

  const visibleResults = results.filter(
    (result) => result.result_status === TAB_TO_STATUS[activeTab],
  );
  const visibleRows = buildResultSheetRows(visibleResults);
  const selectedTabResults = visibleResults.filter((result) =>
    selectedStudentIds.includes(result.student),
  );
  const canRevertCurrentTab =
    !configurationMissing && hasWriteAccess && (activeTab === "selected" || activeTab === "rejected");
  const parsedTopCandidateCount = useMemo(() => {
    if (topCandidateCount.trim() === "") {
      return null;
    }

    const countValue = Number(topCandidateCount);
    if (!Number.isInteger(countValue) || countValue < 0) {
      return null;
    }

    return countValue;
  }, [topCandidateCount]);
  const allSelectedVisible =
    canRevertCurrentTab &&
    visibleResults.length > 0 &&
    visibleResults.every((result) => selectedStudentIds.includes(result.student));
  const facultyName = resolveFacultyName({
    exams: examRecords,
    department,
    semester: selectedSemester,
    resultExamIds: results.map((result) => result.exam),
  });

  const exportPdf = async () => {
    if (configurationMissing || !department || !selectedSemester || visibleRows.length === 0) {
      return;
    }

    setIsExporting(true);
    try {
      const logoDataUrl = await loadDiuLogoDataUrl();
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const marginX = 26;
      const tableTop = 190;
      const reportDate = formatReportDate();
      const titleSemester = formatSemesterLabel(selectedSemester);
      const activeStatusLabel = PRETTY_STATUS_LABELS[TAB_TO_STATUS[activeTab]];

      const drawHeader = () => {
        drawDiuPdfChrome(doc, {
          logoDataUrl,
          semester: selectedSemester,
          facultyName,
          departmentName: department.department_name,
          dateLabel: reportDate,
          rightLabel: activeStatusLabel,
        });
      };

      autoTable(doc, {
        startY: tableTop,
        margin: {
          top: tableTop,
          left: marginX,
          right: marginX,
          bottom: 28,
        },
        head: [[
          "SL",
          "Application Serial",
          "Student Name",
          "SSC",
          "HSC / Diploma",
          "Written",
          "Viva",
          "Written + Viva",
          "Total",
          "Remarks",
        ]],
        body: visibleRows.map((row) => [
          row.serial,
          row.applicationSerial,
          row.studentName,
          row.ssc,
          row.academic,
          row.written,
          row.viva,
          row.writtenViva,
          row.total,
          row.remarks,
        ]),
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 4,
          textColor: [15, 23, 42],
          lineColor: [203, 213, 225],
          lineWidth: 0.6,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: {
          fillColor: [46, 48, 148],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        bodyStyles: {
          minCellHeight: 18,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 24, halign: "center" },
          1: { cellWidth: 62 },
          2: { cellWidth: 92 },
          3: { cellWidth: 42, halign: "center" },
          4: { cellWidth: 72 },
          5: { cellWidth: 38, halign: "center" },
          6: { cellWidth: 34, halign: "center" },
          7: { cellWidth: 50, halign: "center" },
          8: { cellWidth: 40, halign: "center" },
          9: { cellWidth: 62, halign: "center" },
        },
        didDrawPage: () => {
          drawHeader();
        },
      });

      doc.save(
        `admission-test-result-${titleSemester.toLowerCase().replace(/\s+/g, "-")}-${activeTab}.pdf`,
      );
      toast.success("Result sheet exported successfully");
    } catch (exportError: any) {
      console.error("Error exporting result sheet PDF:", exportError);
      toast.error(exportError?.message || "Failed to export result sheet");
    } finally {
      setIsExporting(false);
    }
  };

  const refreshResults = async () => {
    if (!department?.id || !selectedSemester) {
      setResults([]);
      setSummary(DEFAULT_SUMMARY);
      setConfigurationMissing(false);
      setSelectedStudentIds([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await admissionResultsAPI.getResults({
        department_id: department.id,
        semester: selectedSemester,
      });

      const isConfigMissing = Boolean(response?.configuration_missing);
      setConfigurationMissing(isConfigMissing);
      setResults(isConfigMissing ? [] : response?.results || []);
      setSummary(isConfigMissing ? DEFAULT_SUMMARY : {
        ...DEFAULT_SUMMARY,
        ...(response?.summary || {}),
      });
      setSelectedStudentIds([]);
    } catch (refreshError: any) {
      console.error("Error refreshing accepted students:", refreshError);
      toast.error(refreshError?.message || "Failed to refresh accepted students");
      setResults([]);
      setSummary(DEFAULT_SUMMARY);
      setConfigurationMissing(false);
      setSelectedStudentIds([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedStudentIds([]);
  }, [activeTab, selectedSemester]);

  const handleOpenReport = (result: AdmissionResult) => {
    setSelectedReportExamId(result.exam);
    setSelectedReportStudentId(result.student);
    setSelectedReportStudentName(result.student_full_name || result.student_username || "Student");
    setIsReportDialogOpen(true);
  };

  const handleDownloadReport = async (result: AdmissionResult) => {
    setDownloadingReportId(result.id);
    try {
      const response = await admissionResultsAPI.downloadStudentDetailReportPdf(
        result.exam,
        result.student,
      );

      if (!response?.blob) {
        throw new Error("Student report PDF is not available yet.");
      }

      downloadBlobFile(response.blob, response.filename);
      toast.success(`Downloaded report for ${result.student_full_name || result.student_username}`);
    } catch (reportError: any) {
      console.error("Error downloading student report:", reportError);
      toast.error(reportError?.message || "Failed to download student report");
    } finally {
      setDownloadingReportId((currentId) => (currentId === result.id ? null : currentId));
    }
  };

  useEffect(() => {
    if (parsedTopCandidateCount === null || !canRevertCurrentTab) {
      return;
    }

    const nextSelectedIds = visibleResults
      .slice(0, parsedTopCandidateCount)
      .map((result) => result.student);

    setSelectedStudentIds((currentIds) => {
      const hasSameSelection =
        currentIds.length === nextSelectedIds.length &&
        currentIds.every((id, index) => id === nextSelectedIds[index]);

      return hasSameSelection ? currentIds : nextSelectedIds;
    });
  }, [parsedTopCandidateCount, visibleResults, canRevertCurrentTab]);

  const handleToggleStudent = (studentId: number, checked: boolean) => {
    setSelectedStudentIds((currentIds) => {
      if (checked) {
        return [...new Set([...currentIds, studentId])];
      }

      return currentIds.filter((id) => id !== studentId);
    });
  };

  const handleToggleAllSelected = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(visibleResults.map((result) => result.student));
      return;
    }

    setSelectedStudentIds([]);
  };

  const handleRevert = async () => {
    if (!canRevertCurrentTab) {
      return;
    }

    if (selectedStudentIds.length === 0) {
      toast.error("Select at least one candidate to revert.");
      return;
    }

    const configurationIds = new Set(
      selectedTabResults
        .map((result) => result.configuration)
        .filter((value): value is number => typeof value === "number"),
    );

    if (configurationIds.size !== 1) {
      toast.error("Selected candidates must belong to the same semester board.");
      return;
    }

    setIsReverting(true);
    try {
      await admissionResultsAPI.bulkUpdateStatus({
        action: "REVERT_TO_STORED_STATUS",
        configuration_id: Array.from(configurationIds)[0],
        student_ids: selectedStudentIds,
      });

      toast.success("Selected candidates were reverted successfully.");
      await refreshResults();
    } catch (revertError: any) {
      console.error("Error reverting candidates:", revertError);
      toast.error(revertError?.message || "Failed to revert candidates");
    } finally {
      setIsReverting(false);
    }
  };

  if (!hasReadAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold text-gray-800">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className={`rounded-lg p-6 text-white bg-gradient-to-r from-[#2E3094] to-[#4C51BF] ${gradientClass}`}
      >
        <h1 className="flex items-center gap-3 mb-2 text-2xl font-bold sm:text-3xl">
          <FileText className="w-8 h-8" />
          Results
        </h1>
        <p className="text-sm leading-relaxed text-white/90 sm:text-base">
          Semester-wise admission result sheet with DIU export formatting for selected,
          waiting, rejected, and absent candidates.
        </p>
      </div>

      {isFallback && department && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            This user has no department assigned. Using the CSE fallback board for now.
          </AlertDescription>
        </Alert>
      )}

      {departmentError && !department && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{departmentError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Result Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_auto_auto] gap-4 items-end">
            <div className="space-y-2">
              <Label>Department</Label>
              <div className="flex items-center justify-between h-10 px-3 border rounded-md bg-gray-50">
                <span className="text-sm font-medium text-gray-800">
                  {isDepartmentLoading ? "Resolving department..." : department?.department_name || "Unavailable"}
                </span>
                {department && <Badge variant="outline">{department.department_shortname}</Badge>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Semester</Label>
              <SemesterCombobox
                value={selectedSemester}
                options={semesterOptions}
                onChange={setSelectedSemester}
                disabled={isDepartmentLoading || semesterOptions.length === 0}
              />
            </div>

            <Button
              variant="outline"
              onClick={refreshResults}
              disabled={isDepartmentLoading || isLoading || !department || !selectedSemester}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>

            <Button
              onClick={exportPdf}
              disabled={configurationMissing || !selectedSemester || visibleRows.length === 0 || isExporting}
              className="bg-gradient-to-r from-[#2E3094] to-[#4C51BF] hover:from-[#23257a] hover:to-[#4046a8]"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export PDF
            </Button>
          </div>
          {canRevertCurrentTab ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleRevert}
                disabled={selectedStudentIds.length === 0 || isReverting}
              >
                {isReverting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                Revert Status
              </Button>
              <span className="text-sm text-muted-foreground">
                Revert sends candidates back to their stored status.
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {configurationMissing ? (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="flex flex-wrap items-center gap-3 text-amber-900">
            <span>Threshold or seat limit is not set for this semester. Please enter these values to proceed.</span>
            <Button asChild size="sm" variant="outline" className="border-amber-200 text-amber-900">
              <Link to="/student-acceptance-criteria">Set admission criteria</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-600">Selected</p>
                <p className="text-2xl font-bold text-green-600">{summary.SELECTED}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-600">Waiting</p>
                <p className="text-2xl font-bold text-amber-600">{summary.WAITING}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-rose-600">{summary.REJECTED}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-slate-600">{summary.ABSENT}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <span>Semester Result Sheet</span>
                  {canRevertCurrentTab ? (
                    <div className="flex items-center gap-2">
                      <Input
                        id="top-candidate-count"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={topCandidateCount}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (/^\d*$/.test(value)) {
                            setTopCandidateCount(value);
                          }
                        }}
                        placeholder="e.g. 20"
                        className="w-24 h-8"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {department && (
                    <Badge variant="outline">
                      {department.department_shortname}
                    </Badge>
                  )}
                  {selectedSemester && (
                    <Badge variant="secondary">{formatSemesterLabel(selectedSemester)}</Badge>
                  )}
                  <Badge variant="outline">Faculty of {facultyName}</Badge>
                  <Badge variant="outline">{PRETTY_STATUS_LABELS[TAB_TO_STATUS[activeTab]]}</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as keyof typeof TAB_TO_STATUS)}>
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                  <TabsTrigger value="selected">Selected ({summary.SELECTED})</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected ({summary.REJECTED})</TabsTrigger>
                  <TabsTrigger value="waiting">Waiting ({summary.WAITING})</TabsTrigger>
                  <TabsTrigger value="absent">Absent ({summary.ABSENT})</TabsTrigger>
                </TabsList>

                {Object.entries(TAB_TO_STATUS).map(([tabKey]) => (
                  <TabsContent key={tabKey} value={tabKey} className="mt-4">
                    {isDepartmentLoading || isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-600 animate-spin" />
                          <p className="text-gray-600">Loading student results...</p>
                        </div>
                      </div>
                    ) : !selectedSemester ? (
                      <div className="py-12 text-center text-gray-500">
                        Select a semester to load results.
                      </div>
                    ) : visibleRows.length === 0 ? (
                      <div className="py-12 text-center text-gray-500">
                        No {tabKey} students found for this semester.
                      </div>
                    ) : (
                      <div className="overflow-hidden border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {canRevertCurrentTab ? (
                                <TableHead className="w-12">
                                  <Checkbox
                                    checked={allSelectedVisible}
                                    onCheckedChange={(checked) =>
                                      handleToggleAllSelected(Boolean(checked))
                                    }
                                    disabled={visibleResults.length === 0}
                                    aria-label="Select all visible candidates"
                                  />
                                </TableHead>
                              ) : null}
                              <TableHead>SL</TableHead>
                              <TableHead>Application Serial</TableHead>
                              <TableHead>Student Name</TableHead>
                              <TableHead>SSC</TableHead>
                              <TableHead>HSC / Diploma</TableHead>
                              <TableHead>Written</TableHead>
                              <TableHead>Viva</TableHead>
                              <TableHead>Written + Viva</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Remarks</TableHead>
                              <TableHead className="text-center">View</TableHead>
                              <TableHead className="text-center">Download</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {visibleResults.map((result, index) => {
                              const row = visibleRows[index];
                              const isChecked = selectedStudentIds.includes(result.student);

                              return (
                                <TableRow key={row.id}>
                                  {canRevertCurrentTab ? (
                                    <TableCell>
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) =>
                                          handleToggleStudent(result.student, Boolean(checked))
                                        }
                                        aria-label={`Select ${row.studentName}`}
                                      />
                                    </TableCell>
                                  ) : null}
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell className="font-medium">{row.applicationSerial}</TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-gray-900">{row.studentName}</p>
                                      {row.username ? (
                                        <p className="text-sm text-gray-500">@{row.username}</p>
                                      ) : null}
                                    </div>
                                  </TableCell>
                                  <TableCell>{row.ssc}</TableCell>
                                  <TableCell>{row.academic}</TableCell>
                                  <TableCell>{row.written}</TableCell>
                                  <TableCell>{row.viva}</TableCell>
                                  <TableCell>{row.writtenViva}</TableCell>
                                  <TableCell className="font-semibold">{row.total}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={getResultStatusBadgeClass(TAB_TO_STATUS[tabKey as keyof typeof TAB_TO_STATUS])}
                                    >
                                      {row.remarks}
                                    </Badge>
                                    {result.result_status === "SELECTED" && !result.attended_exam ? (
                                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Manual override for absent candidate
                                      </div>
                                    ) : null}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleOpenReport(result)}
                                      aria-label={`View report for ${row.studentName}`}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDownloadReport(result)}
                                      disabled={downloadingReportId === result.id}
                                      aria-label={`Download report for ${row.studentName}`}
                                    >
                                      {downloadingReportId === result.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Download className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      <StudentAdmissionReportDialog
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        examId={selectedReportExamId}
        studentId={selectedReportStudentId}
        studentName={selectedReportStudentName}
      />
    </div>
  );
}

export default AcceptedStudents;
