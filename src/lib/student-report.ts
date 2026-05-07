export interface StudentReportAnswerDisplay {
  key?: string | null;
  text?: string | null;
}

export interface StudentReportQuestionReview {
  question_id: number;
  subject: string;
  question_text: string;
  question_type: string;
  marks: number;
  options?: Record<string, string>;
  student_answer: StudentReportAnswerDisplay | null;
  correct_answers: StudentReportAnswerDisplay[];
  status: "CORRECT" | "WRONG" | "SKIPPED";
  is_correct: boolean;
}

export interface StudentReportSubjectSummary {
  sl: number;
  subject_name: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  skipped_answers: number;
  obtained_marks: number;
  total_marks: number;
}

export interface StudentReportVivaRubricRow {
  sl: number;
  source_rubric_id?: number | null;
  criteria: string;
  max_marks: number;
  awarded_marks: number;
}

export interface StudentReportEquationLine {
  label: string;
  equation: string;
}

export interface StudentAdmissionDetailReport {
  student: {
    id: number;
    username: string;
    full_name: string;
    application_serial: string;
    email?: string;
    department_shortname: string;
    registration_semester: string;
    ssc: number;
    hsc: number;
    diploma: number;
  };
  written_exam: {
    exam_id: number;
    department: string;
    semester: string;
    language?: string | null;
    faculty?: string | null;
    duration_minutes: number;
    duration_display: string;
    schedule_start_time?: string | null;
    schedule_end_time?: string | null;
    exam_date?: string | null;
    assigned_teacher?: string | null;
  };
  written_summary: {
    total_questions: number;
    attempted_questions: number;
    correct_answers: number;
    wrong_answers: number;
    skipped_answers: number;
    obtained_marks: number;
    total_marks: number;
    score_percentage: number;
    grade: string;
  };
  subject_summary: StudentReportSubjectSummary[];
  question_reviews: StudentReportQuestionReview[];
  viva: {
    teacher?: string | null;
    room?: string | null;
    scheduled_at?: string | null;
    time?: string | null;
    total_marks: number;
    remarks?: string | null;
    rubric_rows: StudentReportVivaRubricRow[];
  };
  final_result: {
    written_marks: number;
    viva_marks: number;
    written_viva_total: number;
    weighted_total: number;
    threshold?: number | null;
    result_status: "SELECTED" | "WAITING" | "REJECTED" | "ABSENT";
    ssc_score: number;
    academic_score: number;
    academic_source: "HSC" | "DIPLOMA" | "NONE";
    ssc_contribution: number;
    academic_contribution: number;
    written_contribution: number;
    viva_contribution: number;
    distribution_percentages?: {
      ssc: number;
      hsc: number;
      diploma: number;
      written: number;
      viva: number;
    } | null;
  };
}

export function formatReportNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return numericValue.toFixed(2).replace(/\.00$/, "");
}

export function getStudentAcademicText(report: StudentAdmissionDetailReport) {
  if (report.student.diploma && report.student.diploma > 0) {
    return `${formatReportNumber(report.student.diploma)} (Diploma)`;
  }

  return `${formatReportNumber(report.student.hsc)} (HSC)`;
}

export function getFinalAcademicSourceLabel(report: StudentAdmissionDetailReport) {
  if (report.final_result.academic_source === "DIPLOMA") {
    return "Diploma";
  }
  if (report.final_result.academic_source === "HSC") {
    return "HSC";
  }
  return "Academic";
}

export function formatReportDate(value = new Date()) {
  return value.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getAcademicDivisor(report: StudentAdmissionDetailReport) {
  if (report.final_result.academic_source === "DIPLOMA") {
    return 4;
  }
  if (report.final_result.academic_source === "HSC") {
    return 5;
  }
  return 0;
}

function getWrittenTotalMarks(report: StudentAdmissionDetailReport) {
  return Number(report.written_summary.total_marks || 0);
}

function getVivaTotalMarks(report: StudentAdmissionDetailReport) {
  return report.viva.rubric_rows.reduce(
    (total, row) => total + Number(row.max_marks || 0),
    0,
  );
}

function buildWeightedComponentEquation({
  label,
  numeratorLabel,
  numeratorValue,
  denominatorLabel,
  denominatorValue,
  weightLabel,
  weightValue,
  contributionValue,
}: {
  label: string;
  numeratorLabel: string;
  numeratorValue: number | string | null | undefined;
  denominatorLabel: string;
  denominatorValue: number;
  weightLabel: string;
  weightValue: number | string | null | undefined;
  contributionValue: number | string | null | undefined;
}) {
  if (denominatorValue <= 0) {
    return `${label} = ${weightLabel} could not be applied because ${denominatorLabel} is 0, so contribution = ${formatReportNumber(contributionValue)}`;
  }

  return `${label} = (${numeratorLabel} / ${denominatorLabel}) × ${weightLabel} = (${formatReportNumber(numeratorValue)} / ${formatReportNumber(denominatorValue)}) × ${formatReportNumber(weightValue)} = ${formatReportNumber(contributionValue)}`;
}

export function buildCalculationEquationLines(report: StudentAdmissionDetailReport): {
  lines: StudentReportEquationLine[];
  note: string | null;
} {
  const distribution = report.final_result.distribution_percentages;
  if (!distribution) {
    return {
      lines: [],
      note: "Calculation formula unavailable because marks distribution percentages were not found for this report.",
    };
  }

  const academicLabel = getFinalAcademicSourceLabel(report);
  const academicWeight =
    report.final_result.academic_source === "DIPLOMA"
      ? distribution.diploma
      : report.final_result.academic_source === "HSC"
        ? distribution.hsc
        : 0;
  const academicDivisor = getAcademicDivisor(report);
  const writtenTotalMarks = getWrittenTotalMarks(report);
  const vivaTotalMarks = getVivaTotalMarks(report);

  const lines: StudentReportEquationLine[] = [
    {
      label: "SSC Contribution",
      equation: buildWeightedComponentEquation({
        label: "SSC Contribution",
        numeratorLabel: "SSC Score",
        numeratorValue: report.final_result.ssc_score,
        denominatorLabel: "SSC Total",
        denominatorValue: 5,
        weightLabel: "SSC Weight",
        weightValue: distribution.ssc,
        contributionValue: report.final_result.ssc_contribution,
      }),
    },
    {
      label: `${academicLabel} Contribution`,
      equation: buildWeightedComponentEquation({
        label: `${academicLabel} Contribution`,
        numeratorLabel: `${academicLabel} Score`,
        numeratorValue: report.final_result.academic_score,
        denominatorLabel: `${academicLabel} Total`,
        denominatorValue: academicDivisor,
        weightLabel: `${academicLabel} Weight`,
        weightValue: academicWeight,
        contributionValue: report.final_result.academic_contribution,
      }),
    },
    {
      label: "Written Contribution",
      equation: buildWeightedComponentEquation({
        label: "Written Contribution",
        numeratorLabel: "Written Marks",
        numeratorValue: report.final_result.written_marks,
        denominatorLabel: "Total Written Marks",
        denominatorValue: writtenTotalMarks,
        weightLabel: "Written Weight",
        weightValue: distribution.written,
        contributionValue: report.final_result.written_contribution,
      }),
    },
    {
      label: "Viva Contribution",
      equation: buildWeightedComponentEquation({
        label: "Viva Contribution",
        numeratorLabel: "Viva Marks",
        numeratorValue: report.final_result.viva_marks,
        denominatorLabel: "Total Viva Marks",
        denominatorValue: vivaTotalMarks,
        weightLabel: "Viva Weight",
        weightValue: distribution.viva,
        contributionValue: report.final_result.viva_contribution,
      }),
    },
    {
      label: "Final Weighted Total",
      equation: `Final Weighted Total = SSC Contribution + ${academicLabel} Contribution + Written Contribution + Viva Contribution = ${formatReportNumber(report.final_result.ssc_contribution)} + ${formatReportNumber(report.final_result.academic_contribution)} + ${formatReportNumber(report.final_result.written_contribution)} + ${formatReportNumber(report.final_result.viva_contribution)} = ${formatReportNumber(report.final_result.weighted_total)}`,
    },
  ];

  return {
    lines,
    note: null,
  };
}

export function formatScheduledDateTime(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAnswerDisplay(answer: StudentReportAnswerDisplay | null | undefined) {
  if (!answer || (!answer.key && !answer.text)) {
    return "Not answered";
  }

  if (answer.key && answer.text) {
    return `${answer.key}. ${answer.text}`;
  }

  return answer.text || answer.key || "Not answered";
}

export function formatCorrectAnswersDisplay(answers: StudentReportAnswerDisplay[]) {
  if (!answers || answers.length === 0) {
    return "Not available";
  }

  return answers.map(formatAnswerDisplay).join(", ");
}

export function getQuestionStatusBadgeClass(status: StudentReportQuestionReview["status"]) {
  if (status === "CORRECT") {
    return "border-green-200 bg-green-50 text-green-700";
  }
  if (status === "WRONG") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}
