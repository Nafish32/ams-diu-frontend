import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileSearch,
  GraduationCap,
  School2,
  UserRound,
} from "lucide-react";

import diuLogo from "../assets/diu-logo.png";
import { PRETTY_STATUS_LABELS, formatSemesterLabel } from "../lib/admission";
import {
  buildCalculationEquationLines,
  formatAnswerDisplay,
  formatCorrectAnswersDisplay,
  formatReportDate,
  formatReportNumber,
  formatScheduledDateTime,
  getFinalAcademicSourceLabel,
  getQuestionStatusBadgeClass,
  getStudentAcademicText,
  type StudentAdmissionDetailReport,
} from "../lib/student-report";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface StudentAdmissionReportContentProps {
  report: StudentAdmissionDetailReport;
  exportMode?: boolean;
}

export function StudentAdmissionReportContent({
  report,
  exportMode = false,
}: StudentAdmissionReportContentProps) {
  const questionStatusCounts = report.question_reviews.reduce(
    (totals, question) => {
      if (question.status === "CORRECT") {
        totals.correct += 1;
      } else if (question.status === "WRONG") {
        totals.wrong += 1;
      } else {
        totals.skipped += 1;
      }
      return totals;
    },
    { correct: 0, wrong: 0, skipped: 0 },
  );

  const calculationEquations = buildCalculationEquationLines(report);
  const facultyName = report.written_exam.faculty || "Not available";
  const exportCompactBadgeClass = exportMode
    ? "inline-flex min-h-6 items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-[1.25] whitespace-nowrap !overflow-visible"
    : "";
  const exportMetaBadgeClass = exportMode
    ? "inline-flex min-h-6 items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-[1.25] whitespace-nowrap !overflow-visible"
    : "";

  return (
    <div
      className={exportMode ? "w-[1040px] space-y-6 bg-white p-8 text-slate-900" : "space-y-6"}
      data-student-report-export-root={exportMode ? "true" : undefined}
    >
      {exportMode ? (
        <div className="border-b border-slate-200 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="w-20 shrink-0">
              <img src={diuLogo} alt="Daffodil International University" className="w-full" />
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold text-slate-900">Daffodil International University</h1>
              <p className="mt-2 text-lg font-semibold text-slate-800">
                Admission Test Result, {formatSemesterLabel(report.written_exam.semester)}
              </p>
              <p className="mt-1 text-base text-slate-700">Faculty of {facultyName}</p>
              <p className="text-base text-slate-700">Department of {report.written_exam.department}</p>
              <p className="mt-1 text-sm text-slate-600">Date: {formatReportDate()}</p>
            </div>
            <div className="min-w-24 shrink-0 text-right">
              <Badge
                variant="outline"
                className={`${exportCompactBadgeClass} border-emerald-300 text-emerald-700`}
              >
                {PRETTY_STATUS_LABELS[report.final_result.result_status]}
              </Badge>
            </div>
          </div>
        </div>
      ) : null}

      <Card className="overflow-hidden border-slate-200">
        <div className="grid gap-0 border-b border-slate-200 bg-slate-50 md:grid-cols-3">
          <div className="border-b border-slate-200 p-4 md:border-b-0 md:border-r">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 p-2 text-blue-700">
                <UserRound className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Candidate</p>
                <p className="font-semibold text-slate-900">
                  {report.student.full_name || report.student.username}
                </p>
                <p className="text-sm text-slate-600">
                  Application Serial: {report.student.application_serial}
                </p>
              </div>
            </div>
          </div>
          <div className="border-b border-slate-200 p-4 md:border-b-0 md:border-r">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-indigo-100 p-2 text-indigo-700">
                <School2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Written Exam</p>
                <p className="font-semibold text-slate-900">Exam #{report.written_exam.exam_id}</p>
                <p className="text-sm text-slate-600">
                  {formatSemesterLabel(report.written_exam.semester)} | {report.written_exam.department}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Final Status</p>
                <Badge variant="outline" className={`mt-1 ${exportCompactBadgeClass}`}>
                  {PRETTY_STATUS_LABELS[report.final_result.result_status]}
                </Badge>
                <p className="mt-2 text-sm text-slate-600">
                  Weighted Total: {formatReportNumber(report.final_result.weighted_total)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Department</p>
            <p className="font-medium text-slate-900">{report.written_exam.department}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Registration Semester</p>
            <p className="font-medium text-slate-900">
              {formatSemesterLabel(report.student.registration_semester)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">SSC</p>
            <p className="font-medium text-slate-900">{formatReportNumber(report.student.ssc)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">HSC / Diploma</p>
            <p className="font-medium text-slate-900">{getStudentAcademicText(report)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-[#2E3094]" />
              Written Exam
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Faculty</p>
              <p className="font-medium text-slate-900">
                {report.written_exam.faculty || "Not available"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Language</p>
              <p className="font-medium text-slate-900">
                {report.written_exam.language || "Not available"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Written Teacher</p>
              <p className="font-medium text-slate-900">
                {report.written_exam.assigned_teacher || "Not assigned"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Duration</p>
              <p className="font-medium text-slate-900">{report.written_exam.duration_display}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Start Time</p>
              <p className="font-medium text-slate-900">
                {formatScheduledDateTime(report.written_exam.schedule_start_time)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">End Time</p>
              <p className="font-medium text-slate-900">
                {formatScheduledDateTime(report.written_exam.schedule_end_time)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-[#2E3094]" />
              Written Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Questions</p>
              <p className="font-medium text-slate-900">
                {report.written_summary.attempted_questions} attempted /{" "}
                {report.written_summary.total_questions} total
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Marks</p>
              <p className="font-medium text-slate-900">
                {formatReportNumber(report.written_summary.obtained_marks)} /{" "}
                {formatReportNumber(report.written_summary.total_marks)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Correct / Wrong / Skipped
              </p>
              <p className="font-medium text-slate-900">
                {report.written_summary.correct_answers} / {report.written_summary.wrong_answers} /{" "}
                {report.written_summary.skipped_answers}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Percentage / Grade</p>
              <p className="font-medium text-slate-900">
                {formatReportNumber(report.written_summary.score_percentage)}% |{" "}
                {report.written_summary.grade}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4 text-[#2E3094]" />
            Subject Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.subject_summary.length === 0 ? (
            <p className="text-sm text-slate-500">No subject summary available.</p>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Correct</TableHead>
                    <TableHead>Wrong</TableHead>
                    <TableHead>Skipped</TableHead>
                    <TableHead>Obtained</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.subject_summary.map((row) => (
                    <TableRow key={`${row.subject_name}-${row.sl}`}>
                      <TableCell>{row.sl}</TableCell>
                      <TableCell className="font-medium">{row.subject_name}</TableCell>
                      <TableCell>{row.total_questions}</TableCell>
                      <TableCell>{row.correct_answers}</TableCell>
                      <TableCell>{row.wrong_answers}</TableCell>
                      <TableCell>{row.skipped_answers}</TableCell>
                      <TableCell>
                        {formatReportNumber(row.obtained_marks)} /{" "}
                        {formatReportNumber(row.total_marks)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-[#2E3094]" />
              Viva Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Teacher</p>
                <p className="font-medium text-slate-900">{report.viva.teacher || "Not assigned"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Room</p>
                <p className="font-medium text-slate-900">{report.viva.room || "Not available"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Scheduled At</p>
                <p className="font-medium text-slate-900">
                  {formatScheduledDateTime(report.viva.scheduled_at)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Total Viva Marks</p>
                <p className="font-medium text-slate-900">
                  {formatReportNumber(report.viva.total_marks)}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Remarks</p>
              <p className="mt-1 text-sm text-slate-700">
                {report.viva.remarks || "No viva remarks recorded."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-[#2E3094]" />
              Final Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Written</p>
                <p className="font-medium text-slate-900">
                  {formatReportNumber(report.final_result.written_marks)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Viva</p>
                <p className="font-medium text-slate-900">
                  {formatReportNumber(report.final_result.viva_marks)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Written + Viva</p>
                <p className="font-medium text-slate-900">
                  {formatReportNumber(report.final_result.written_viva_total)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Threshold</p>
                <p className="font-medium text-slate-900">
                  {report.final_result.threshold === null || report.final_result.threshold === undefined
                    ? "Not set"
                    : formatReportNumber(report.final_result.threshold)}
                </p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">SSC Contribution</p>
                <p className="font-medium text-slate-900">
                  {formatReportNumber(report.final_result.ssc_contribution)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {getFinalAcademicSourceLabel(report)} Contribution
                </p>
                <p className="font-medium text-slate-900">
                  {formatReportNumber(report.final_result.academic_contribution)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Written Contribution</p>
                <p className="font-medium text-slate-900">
                  {formatReportNumber(report.final_result.written_contribution)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Viva Contribution</p>
                <p className="font-medium text-slate-900">
                  {formatReportNumber(report.final_result.viva_contribution)}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">
                Weighted Final Total
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">
                {formatReportNumber(report.final_result.weighted_total)}
              </p>
              <Badge
                variant="outline"
                className={`mt-2 ${exportCompactBadgeClass} border-emerald-300 text-emerald-700`}
              >
                {PRETTY_STATUS_LABELS[report.final_result.result_status]}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Weighted Total Equation
              </p>
              {calculationEquations.lines.length > 0 ? (
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {calculationEquations.lines.map((line) => (
                    <div key={line.label} className="rounded-md bg-white px-3 py-2 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {line.label}
                      </p>
                      <p className="mt-1 break-words font-mono text-sm leading-6 text-slate-800">
                        {line.equation}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {calculationEquations.note}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4 text-[#2E3094]" />
            Viva Rubric Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.viva.rubric_rows.length === 0 ? (
            <p className="text-sm text-slate-500">No viva rubric data recorded for this student.</p>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL</TableHead>
                    <TableHead>Criteria</TableHead>
                    <TableHead>Max Marks</TableHead>
                    <TableHead>Awarded Marks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.viva.rubric_rows.map((row) => (
                    <TableRow key={`${row.criteria}-${row.sl}`}>
                      <TableCell>{row.sl}</TableCell>
                      <TableCell className="font-medium">{row.criteria}</TableCell>
                      <TableCell>{formatReportNumber(row.max_marks)}</TableCell>
                      <TableCell>{formatReportNumber(row.awarded_marks)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSearch className="h-4 w-4 text-[#2E3094]" />
            Question Review
          </CardTitle>
          <p className="text-left text-sm text-slate-500">
            {questionStatusCounts.correct} correct, {questionStatusCounts.wrong} wrong,{" "}
            {questionStatusCounts.skipped} skipped across {report.question_reviews.length} questions.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.question_reviews.length === 0 ? (
            <p className="text-sm text-slate-500">No question review data is available.</p>
          ) : (
            report.question_reviews.map((question, index) => (
              <div
                key={question.question_id}
                className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${
                  exportMode ? "break-inside-avoid" : ""
                }`}
                data-report-question-card={exportMode ? "true" : undefined}
              >
                <div
                  className={`flex flex-col gap-3 md:flex-row md:justify-between ${
                    exportMode ? "md:items-center" : "md:items-start"
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`${exportMetaBadgeClass} border-slate-300 bg-white text-slate-700`}
                      >
                        Q{index + 1}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`${exportMetaBadgeClass} border-indigo-200 bg-indigo-50 text-indigo-700`}
                      >
                        {question.subject || "General"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`${exportMetaBadgeClass} ${getQuestionStatusBadgeClass(question.status)}`}
                      >
                        {question.status}
                      </Badge>
                    </div>
                    <p className="break-words whitespace-pre-wrap pr-1 font-medium leading-6 text-slate-900">
                      {question.question_text}
                    </p>
                  </div>
                  <div className="w-full shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 md:w-auto md:min-w-[120px]">
                    <p>Type: {question.question_type}</p>
                    <p>Marks: {formatReportNumber(question.marks)}</p>
                  </div>
                </div>

                {question.options && Object.keys(question.options).length > 0 ? (
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {Object.entries(question.options).map(([key, value]) => (
                      <div
                        key={key}
                        className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                      >
                        <span className="font-semibold">{key}.</span>{" "}
                        <span className="break-words whitespace-pre-wrap">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Student Answer</p>
                    <p className="mt-1 break-words whitespace-pre-wrap font-medium text-slate-900">
                      {formatAnswerDisplay(question.student_answer)}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-emerald-700">Correct Answer</p>
                    <p className="mt-1 break-words whitespace-pre-wrap font-medium text-emerald-900">
                      {formatCorrectAnswersDisplay(question.correct_answers)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
