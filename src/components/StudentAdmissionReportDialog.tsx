import { useEffect, useState } from "react";
import { Download, FileSearch, Loader2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import { downloadBlobFile } from "../lib/pdf-download";
import { type StudentAdmissionDetailReport } from "../lib/student-report";
import { admissionResultsAPI } from "../services/api";
import { StudentAdmissionReportContent } from "./StudentAdmissionReportContent";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

interface StudentAdmissionReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: number | null;
  studentId: number | null;
  studentName?: string;
}

export function StudentAdmissionReportDialog({
  open,
  onOpenChange,
  examId,
  studentId,
  studentName,
}: StudentAdmissionReportDialogProps) {
  const [report, setReport] = useState<StudentAdmissionDetailReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !examId || !studentId) {
      return;
    }

    let isMounted = true;

    const loadReport = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await admissionResultsAPI.getStudentDetailReport(examId, studentId);
        if (!isMounted) {
          return;
        }

        setReport(response?.data || null);
      } catch (reportError: any) {
        if (!isMounted) {
          return;
        }

        console.error("Error loading student admission report:", reportError);
        setReport(null);
        setError(reportError?.message || "Failed to load student report");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [open, examId, studentId]);

  const handleDownload = async () => {
    if (!report || !examId || !studentId) {
      return;
    }

    setIsDownloading(true);
    try {
      const response = await admissionResultsAPI.downloadStudentDetailReportPdf(examId, studentId);
      if (!response?.blob) {
        throw new Error("Student report PDF is not available yet.");
      }

      downloadBlobFile(response.blob, response.filename);
      toast.success("Student report downloaded successfully");
    } catch (downloadError: any) {
      console.error("Error downloading student report:", downloadError);
      toast.error(downloadError?.message || "Failed to download student report");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-[96vw] max-h-[94vh] overflow-hidden p-0 sm:max-w-[96vw]">
        <DialogHeader className="border-b bg-gradient-to-r from-[#2E3094] via-[#3940b2] to-[#4C51BF] px-6 py-5 text-white">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileSearch className="h-5 w-5" />
            Student Admission Report
          </DialogTitle>
          <DialogDescription className="text-blue-100">
            {studentName
              ? `Detailed report for ${studentName}`
              : "Detailed written and viva assessment report"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(94vh-145px)]">
          <div className="space-y-6 px-6 py-6">
            {isLoading ? (
              <div className="flex min-h-[380px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#2E3094]" />
                  <p className="text-sm text-slate-600">Loading detailed student report...</p>
                </div>
              </div>
            ) : error ? (
              <Card className="border-rose-200 bg-rose-50">
                <CardContent className="flex items-center gap-3 p-4 text-rose-700">
                  <XCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Could not load this report</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </CardContent>
              </Card>
            ) : !report ? (
              <Card className="border-slate-200 bg-slate-50">
                <CardContent className="p-6 text-center text-sm text-slate-600">
                  No report data is available for this student yet.
                </CardContent>
              </Card>
            ) : (
              <StudentAdmissionReportContent report={report} />
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleDownload} disabled={!report || isDownloading || isLoading}>
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
