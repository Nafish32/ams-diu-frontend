import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { SemesterCombobox } from "../components/SemesterCombobox";
import { StudentAdmissionReportDialog } from "../components/StudentAdmissionReportDialog";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { usePermissions } from "../hooks/usePermissions";
import { useEffectiveDepartment } from "../hooks/useEffectiveDepartment";
import {
  compareAdmissionResults,
  formatSemesterLabel,
  matchesAdmissionSearch,
  type AdmissionConfiguration,
  type AdmissionResult,
} from "../lib/admission";
import {
  buildResultSheetRows,
  getResultStatusBadgeClass,
  isThresholdEligible,
} from "../lib/result-sheet";
import { downloadBlobFile } from "../lib/pdf-download";
import { admissionResultsAPI } from "../services/api";

interface ExamineeResultProps {
  gradientClass?: string;
}

const DEFAULT_SUMMARY = {
  SELECTED: 0,
  WAITING: 0,
  REJECTED: 0,
  ABSENT: 0,
};

export function ExamineeResult({ gradientClass = "" }: ExamineeResultProps) {
  const { canRead, canWrite } = usePermissions();
  const { department, isFallback, isLoading: isDepartmentLoading, error: departmentError } =
    useEffectiveDepartment();
  const hasReadAccess = canRead();
  const hasWriteAccess = canWrite();

  const [semesterOptions, setSemesterOptions] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [results, setResults] = useState<AdmissionResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<AdmissionResult[]>([]);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [configuration, setConfiguration] = useState<AdmissionConfiguration | null>(null);
  const [seatLimit, setSeatLimit] = useState("");
  const [threshold, setThreshold] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "score">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [selectedReportExamId, setSelectedReportExamId] = useState<number | null>(null);
  const [selectedReportStudentId, setSelectedReportStudentId] = useState<number | null>(null);
  const [selectedReportStudentName, setSelectedReportStudentName] = useState("");
  const [activeSingleDownloadResultId, setActiveSingleDownloadResultId] = useState<number | null>(null);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [topCandidateCount, setTopCandidateCount] = useState("");

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const parsedThresholdValue = useMemo(() => {
    const thresholdValue = threshold.trim() === "" ? null : Number(threshold);
    return thresholdValue !== null && !Number.isNaN(thresholdValue) ? thresholdValue : null;
  }, [threshold]);

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

  useEffect(() => {
    if (!hasReadAccess || !department?.id) {
      return;
    }

    let isMounted = true;

    const loadSemesterOptions = async () => {
      try {
        const response = await admissionResultsAPI.getSemesterOptions({
          department_id: department.id,
        });
        const semesters = response?.semesters || [];

        if (!isMounted) {
          return;
        }

        setSemesterOptions(semesters);
        if (!selectedSemester && semesters.length > 0) {
          setSelectedSemester(semesters[0]);
        } else if (selectedSemester && !semesters.includes(selectedSemester)) {
          setSelectedSemester(semesters[0] || "");
        }
      } catch (semesterError: any) {
        if (isMounted) {
          toast.error(semesterError?.message || "Failed to load semester options");
        }
      }
    };

    loadSemesterOptions();

    return () => {
      isMounted = false;
    };
  }, [hasReadAccess, department?.id, selectedSemester]);

  useEffect(() => {
    if (!hasReadAccess || !department?.id || !selectedSemester) {
      setResults([]);
      setConfiguration(null);
      setSelectedStudentIds([]);
      return;
    }

    let isMounted = true;

    const loadBoardData = async () => {
      try {
        setIsLoading(true);
        const [configResponse, resultResponse] = await Promise.all([
          admissionResultsAPI.getConfigurations({
            department_id: department.id,
            semester: selectedSemester,
          }),
          admissionResultsAPI.getResults({
            department_id: department.id,
            semester: selectedSemester,
          }),
        ]);

        if (!isMounted) {
          return;
        }

        const resolvedConfiguration =
          configResponse?.configurations?.[0] ||
          resultResponse?.configuration ||
          null;

        const boardResults = resultResponse?.results || [];

        setConfiguration(resolvedConfiguration);
        setSeatLimit(
          resolvedConfiguration?.seat_limit !== undefined
            ? String(resolvedConfiguration.seat_limit)
            : "",
        );
        setThreshold(
          resolvedConfiguration?.threshold !== undefined
            ? String(resolvedConfiguration.threshold)
            : "",
        );
        setSummary({
          ...DEFAULT_SUMMARY,
          ...(resultResponse?.summary || {}),
        });
        setResults(boardResults);
        setSelectedStudentIds([]);
      } catch (boardError: any) {
        if (!isMounted) {
          return;
        }

        console.error("Error loading examinee board:", boardError);
        toast.error(boardError?.message || "Failed to load examinee board");
        setResults([]);
        setConfiguration(null);
        setSummary(DEFAULT_SUMMARY);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadBoardData();

    return () => {
      isMounted = false;
    };
  }, [hasReadAccess, department?.id, selectedSemester]);

  useEffect(() => {
    const normalizedSearch = deferredSearchTerm.trim();

    const searchedResults = [...results]
      .filter((result) => matchesAdmissionSearch(result, normalizedSearch))
      .sort((left, right) => compareAdmissionResults(left, right, sortBy, sortOrder));

    const nextFilteredResults = searchedResults.filter(
      (result) =>
        result.result_status !== "SELECTED" &&
        isThresholdEligible(result, parsedThresholdValue),
    );

    startTransition(() => {
      setFilteredResults(nextFilteredResults);
    });
  }, [results, deferredSearchTerm, sortBy, sortOrder, parsedThresholdValue]);

  const visibleRows = buildResultSheetRows(filteredResults);
  const selectableResults = filteredResults.filter(
    (result) => result.result_status !== "SELECTED",
  );

  const allVisibleWaitingSelected =
    selectableResults.length > 0 &&
    selectableResults.every((result) => selectedStudentIds.includes(result.student));

  useEffect(() => {
    if (parsedTopCandidateCount === null) {
      return;
    }

    const nextSelectedIds = selectableResults
      .slice(0, parsedTopCandidateCount)
      .map((result) => result.student);

    setSelectedStudentIds((currentIds) => {
      const hasSameSelection =
        currentIds.length === nextSelectedIds.length &&
        currentIds.every((id, index) => id === nextSelectedIds[index]);

      return hasSameSelection ? currentIds : nextSelectedIds;
    });
  }, [parsedTopCandidateCount, selectableResults]);

  const hasConfigurationChanges =
    configuration === null ||
    String(configuration.seat_limit) !== seatLimit ||
    String(configuration.threshold) !== threshold;

  const refreshBoard = async () => {
    if (!department?.id || !selectedSemester) {
      return;
    }

    setSelectedStudentIds([]);
    setIsLoading(true);
    try {
      const [configResponse, resultResponse] = await Promise.all([
        admissionResultsAPI.getConfigurations({
          department_id: department.id,
          semester: selectedSemester,
        }),
        admissionResultsAPI.getResults({
          department_id: department.id,
          semester: selectedSemester,
        }),
      ]);

      setConfiguration(configResponse?.configurations?.[0] || null);
      setSeatLimit(
        configResponse?.configurations?.[0]?.seat_limit !== undefined
          ? String(configResponse.configurations[0].seat_limit)
          : "",
      );
      setThreshold(
        configResponse?.configurations?.[0]?.threshold !== undefined
          ? String(configResponse.configurations[0].threshold)
          : "",
      );
      setResults(resultResponse?.results || []);
      setSummary({
        ...DEFAULT_SUMMARY,
        ...(resultResponse?.summary || {}),
      });
    } catch (refreshError: any) {
      console.error("Error refreshing examinee board:", refreshError);
      toast.error(refreshError?.message || "Failed to refresh examinee board");
    } finally {
      setIsLoading(false);
    }
  };

  const persistConfiguration = async () => {
    if (!department?.id || !selectedSemester) {
      throw new Error("Department and semester are required.");
    }

    const seatLimitValue = Number(seatLimit);
    const thresholdValue = Number(threshold);

    if (Number.isNaN(seatLimitValue) || seatLimitValue < 0) {
      throw new Error("Seat limit must be 0 or greater.");
    }

    if (Number.isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 100) {
      throw new Error("Threshold must be between 0 and 100.");
    }

    const payload = {
      department_id: department.id,
      semester: selectedSemester,
      seat_limit: seatLimitValue,
      threshold: thresholdValue,
    };

    const response = configuration?.id
      ? await admissionResultsAPI.updateConfiguration(configuration.id, payload)
      : await admissionResultsAPI.createOrUpdateConfiguration(payload);

    const nextConfiguration = response?.data || response;
    setConfiguration(nextConfiguration);
    setSeatLimit(String(nextConfiguration.seat_limit));
    setThreshold(String(nextConfiguration.threshold));
    return nextConfiguration;
  };

  const handleSaveConfiguration = async () => {
    setIsSavingConfig(true);
    try {
      await persistConfiguration();
      toast.success("Admission setup saved successfully");
      await refreshBoard();
    } catch (configError: any) {
      console.error("Error saving admission setup:", configError);
      toast.error(configError?.message || "Failed to save admission setup");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleToggleStudent = (studentId: number, checked: boolean) => {
    setSelectedStudentIds((currentIds) => {
      if (checked) {
        return [...new Set([...currentIds, studentId])];
      }

      return currentIds.filter((id) => id !== studentId);
    });
  };

  const handleToggleAllWaiting = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(selectableResults.map((result) => result.student));
      return;
    }

    setSelectedStudentIds([]);
  };

  const handleAccept = async () => {
    if (!department?.id || !selectedSemester) {
      toast.error("Select a semester first.");
      return;
    }

    if (selectedStudentIds.length === 0) {
      toast.error("Select at least one eligible candidate.");
      return;
    }

    setIsAccepting(true);
    try {
      const activeConfiguration = hasConfigurationChanges
        ? await persistConfiguration()
        : configuration;

      if (!activeConfiguration?.id) {
        throw new Error("Admission configuration is required before accepting candidates.");
      }

      await admissionResultsAPI.bulkUpdateStatus({
        configuration_id: activeConfiguration.id,
        student_ids: selectedStudentIds,
        result_status: "SELECTED",
      });

      toast.success("Selected candidates moved to the next phase.");
      await refreshBoard();
    } catch (acceptError: any) {
      console.error("Error accepting candidates:", acceptError);
      toast.error(acceptError?.message || "Failed to accept candidates");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!department?.id || !selectedSemester) {
      toast.error("Select a semester first.");
      return;
    }

    if (selectedStudentIds.length === 0) {
      toast.error("Select at least one eligible candidate.");
      return;
    }

    setIsRejecting(true);
    try {
      const activeConfiguration = hasConfigurationChanges
        ? await persistConfiguration()
        : configuration;

      if (!activeConfiguration?.id) {
        throw new Error("Admission configuration is required before rejecting candidates.");
      }

      await admissionResultsAPI.bulkUpdateStatus({
        configuration_id: activeConfiguration.id,
        student_ids: selectedStudentIds,
        result_status: "REJECTED",
      });

      toast.success("Selected candidates have been rejected.");
      await refreshBoard();
    } catch (rejectError: any) {
      console.error("Error rejecting candidates:", rejectError);
      toast.error(rejectError?.message || "Failed to reject candidates");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleOpenReport = (result: AdmissionResult) => {
    setSelectedReportExamId(result.exam);
    setSelectedReportStudentId(result.student);
    setSelectedReportStudentName(result.student_full_name || result.student_username || "Student");
    setIsReportDialogOpen(true);
  };

  const handleDownloadReport = async (result: AdmissionResult) => {
    setActiveSingleDownloadResultId(result.id);
    try {
      const response = await admissionResultsAPI.downloadStudentDetailReportPdf(
        result.exam,
        result.student,
      );

      if (!response?.blob) {
        throw new Error("Student report PDF is not available yet.");
      }

      downloadBlobFile(response.blob, response.filename);
      toast.success(
        `Downloaded report for ${result.student_full_name || result.student_username || "Student"}`,
      );
    } catch (reportError: any) {
      console.error("Error downloading student report:", reportError);
      toast.error(reportError?.message || "Failed to download student report");
    } finally {
      setActiveSingleDownloadResultId(null);
    }
  };

  const handleDownloadSelectedReports = async () => {
    const selectedResults = filteredResults.filter((result) =>
      selectedStudentIds.includes(result.student),
    );

    if (selectedResults.length === 0) {
      toast.error("Select at least one candidate to download reports.");
      return;
    }

    if (selectedResults.length === 1) {
      await handleDownloadReport(selectedResults[0]);
      return;
    }

    setIsBulkDownloading(true);
    try {
      const reports = selectedResults.map((result) => ({
        exam_id: result.exam,
        student_id: result.student,
      }));

      const response = await admissionResultsAPI.downloadStudentDetailReportsZip(reports);
      if (!response?.blob) {
        throw new Error("Student report ZIP is not available yet.");
      }

      downloadBlobFile(response.blob, response.filename);
      toast.success(`Downloaded ${selectedResults.length} reports as ZIP.`);
    } catch (reportError: any) {
      console.error("Error downloading student report ZIP:", reportError);
      toast.error(reportError?.message || "Failed to download student reports ZIP");
    } finally {
      setIsBulkDownloading(false);
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
          <FileCheck className="w-8 h-8" />
          Examinee Result
        </h1>
        <p className="text-sm leading-relaxed text-white/90 sm:text-base">
          Review candidates for the selected semester with optional threshold filtering.
          If threshold is empty, all non-selected candidates are shown.
          If threshold has any value, only totals at or above it are shown and nothing below it is included.
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

      <Card className="border-2 border-gray-200">
        <CardHeader className="pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Users className="w-5 h-5 text-blue-600" />
            Board Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="space-y-2">
              <Label>Department</Label>
              <div className="flex items-center justify-between h-10 px-3 border rounded-md bg-gray-50">
                <span className="text-sm font-medium text-gray-800 max-w-[180px] truncate block" title={department?.department_name}>
                  {isDepartmentLoading ? "Resolving department..." : department?.department_name || "Unavailable"}
                </span>
                {department && (
                  <Badge variant="outline">{department.department_shortname}</Badge>
                )}
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

            <div className="space-y-2">
              <Label htmlFor="search-candidates">Search</Label>
              <div className="relative">
                <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                <Input
                  id="search-candidates"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, username, or form ID"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={sortBy} onValueChange={(value: "name" | "score") => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="score">Score</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={refreshBoard}
                disabled={isLoading || !department || !selectedSemester}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="seat-limit">Seat Limit</Label>
              <Input
                id="seat-limit"
                type="number"
                min="0"
                value={seatLimit}
                onChange={(event) => setSeatLimit(event.target.value)}
                placeholder="Enter available seats"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Threshold</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={threshold}
                onChange={(event) => setThreshold(event.target.value)}
                placeholder="Enter threshold"
              />
            </div>

            {hasWriteAccess && (
              <Button
                onClick={handleSaveConfiguration}
                disabled={!department || !selectedSemester || isSavingConfig}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                {isSavingConfig ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">Total Candidates</p>
            <p className="text-2xl font-bold text-blue-600">{results.length}</p>
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
            <p className="text-sm font-medium text-gray-600">Selected</p>
            <p className="text-2xl font-bold text-green-600">{summary.SELECTED}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">Rejected / Absent</p>
            <p className="text-2xl font-bold text-rose-600">
              {summary.REJECTED + summary.ABSENT}
            </p>
          </CardContent>
        </Card>
      </div>

      {!configuration && selectedSemester && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-900">
            No saved admission setup exists for {formatSemesterLabel(selectedSemester)} yet.
            Enter the seat limit and threshold, then click <strong>Save Setup</strong>.
          </AlertDescription>
        </Alert>
      )}

      <Alert className="border-slate-200 bg-slate-50">
        <AlertDescription className="text-slate-700">
          Threshold behavior: empty threshold shows all non-selected candidates.
          Any numeric threshold applies a strict marks filter, so only candidates with totals
          greater than or equal to that threshold are shown.
        </AlertDescription>
      </Alert>

      {isBulkDownloading && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="flex flex-wrap items-center gap-2 text-blue-900">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating selected reports and building ZIP file...</span>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span>Candidate Board</span>
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
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedSemester ? (
                <Badge variant="outline">{formatSemesterLabel(selectedSemester)}</Badge>
              ) : null}
              {hasWriteAccess && (
                <Button
                  onClick={handleAccept}
                  disabled={
                    !department ||
                    !selectedSemester ||
                    selectedStudentIds.length === 0 ||
                    isAccepting ||
                    isRejecting
                  }
                  className="bg-gradient-to-r from-[#2E3094] to-[#4C51BF] hover:from-[#23257a] hover:to-[#4046a8]"
                >
                  {isAccepting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Accept
                </Button>
              )}
              {hasWriteAccess && (
                <Button
                  onClick={handleReject}
                  disabled={
                    !department ||
                    !selectedSemester ||
                    selectedStudentIds.length === 0 ||
                    isRejecting ||
                    isAccepting
                  }
                  className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"
                >
                  {isRejecting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
              )}
              <Button
                onClick={handleDownloadSelectedReports}
                disabled={selectedStudentIds.length === 0 || isBulkDownloading || activeSingleDownloadResultId !== null}
                variant="outline"
              >
                {isBulkDownloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download Selected
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isDepartmentLoading || isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-600 animate-spin" />
                <p className="text-gray-600">Loading examinee results...</p>
              </div>
            </div>
          ) : !selectedSemester ? (
            <div className="py-12 text-center text-gray-500">
              Select a semester to load examinee results.
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              {results.length === 0
                ? "No examinee results are available for this semester yet."
                : "No candidates match the current filter and search."}
            </div>
          ) : (
            <div className="overflow-hidden border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allVisibleWaitingSelected}
                          onCheckedChange={(checked) => handleToggleAllWaiting(Boolean(checked))}
                          disabled={selectableResults.length === 0}
                          aria-label="Select all eligible candidates"
                        />
                      </TableHead>
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
                    <TableHead className="w-20 text-center">View</TableHead>
                    <TableHead className="w-24 text-center">Download</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result, index) => {
                    const row = visibleRows[index];
                    const isSelectable = result.result_status !== "SELECTED";
                    const isChecked = selectedStudentIds.includes(result.student);
                    const isAbsentCandidate = result.result_status === "ABSENT";
                    const isRejectedCandidate = result.result_status === "REJECTED";
                    const isDownloadingThisReport = activeSingleDownloadResultId === result.id;

                    return (
                      <TableRow
                        key={result.id}
                        className={isAbsentCandidate ? "bg-slate-50/70" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handleToggleStudent(result.student, Boolean(checked))
                            }
                            disabled={!isSelectable}
                            aria-label={`Select ${result.student_full_name}`}
                          />
                        </TableCell>
                        <TableCell>{row.serial}</TableCell>
                        <TableCell className="font-medium">{row.applicationSerial}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">
                              {row.studentName}
                            </p>
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
                        <TableCell className="font-semibold text-gray-900">
                          {row.total}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className={getResultStatusBadgeClass(result.result_status)}
                            >
                              {row.remarks}
                            </Badge>
                            {isAbsentCandidate || isRejectedCandidate ? (
                              <p className="text-xs text-slate-500">
                                Manual acceptance or rejection allowed
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenReport(result)}
                            aria-label={`View report for ${result.student_full_name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              void handleDownloadReport(result);
                            }}
                            disabled={isDownloadingThisReport || isBulkDownloading}
                            aria-label={`Download report for ${result.student_full_name}`}
                            title={isDownloadingThisReport ? "Downloading" : "Download report"}
                          >
                            {isDownloadingThisReport ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
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
        </CardContent>
      </Card>

      <StudentAdmissionReportDialog
        open={isReportDialogOpen}
        onOpenChange={(open) => {
          setIsReportDialogOpen(open);
          if (!open) {
            setSelectedReportExamId(null);
            setSelectedReportStudentId(null);
            setSelectedReportStudentName("");
          }
        }}
        examId={selectedReportExamId}
        studentId={selectedReportStudentId}
        studentName={selectedReportStudentName}
      />
    </div>
  );
}
