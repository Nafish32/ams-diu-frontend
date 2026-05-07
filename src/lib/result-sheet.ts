import {
  getAcademicDisplayLabel,
  getAcademicDisplayValue,
  PRETTY_STATUS_LABELS,
  type AdmissionResult,
  type EffectiveDepartment,
} from "./admission";
import { normalizeSemesterValue } from "./semester";

export interface ExamLookupRecord {
  id?: number;
  semester?: string | null;
  faculty?: string | null;
  department?: string | null;
  department_shortnames?: string[] | string | null;
}

export interface ResultSheetRow {
  id: number;
  serial: number;
  applicationSerial: string;
  studentName: string;
  username: string;
  ssc: string;
  academic: string;
  written: string;
  viva: string;
  writtenViva: string;
  total: string;
  remarks: string;
}

const FACULTY_BY_DEPARTMENT_SHORTNAME: Record<string, string> = {
  CSE: "Science and Information Technology",
  SWE: "Science and Information Technology",
  CIS: "Science and Information Technology",
  EEE: "Engineering",
  TE: "Engineering",
  CE: "Engineering",
  ME: "Engineering",
  BBA: "Business and Entrepreneurship",
  MBA: "Business and Entrepreneurship",
  THM: "Business and Entrepreneurship",
  ENG: "Humanities and Social Sciences",
  JMC: "Humanities and Social Sciences",
  LAW: "Humanities and Social Sciences",
  NFE: "Health and Life Sciences",
  PH: "Health and Life Sciences",
  ARCH: "Health and Life Sciences",
};

const FACULTY_NAME_NORMALIZERS: Record<string, string> = {
  FSIT: "Science and Information Technology",
  "SCIENCE AND INFORMATION TECHNOLOGY": "Science and Information Technology",
  "FACULTY OF SCIENCE AND INFORMATION TECHNOLOGY": "Science and Information Technology",
  FE: "Engineering",
  ENGINEERING: "Engineering",
  "FACULTY OF ENGINEERING": "Engineering",
  FEB: "Business and Entrepreneurship",
  "BUSINESS AND ENTREPRENEURSHIP": "Business and Entrepreneurship",
  "FACULTY OF BUSINESS AND ENTREPRENEURSHIP": "Business and Entrepreneurship",
  FHS: "Humanities and Social Sciences",
  HSS: "Humanities and Social Sciences",
  "HUMANITIES AND SOCIAL SCIENCES": "Humanities and Social Sciences",
  "FACULTY OF HUMANITIES AND SOCIAL SCIENCES": "Humanities and Social Sciences",
  FHLS: "Health and Life Sciences",
  "HEALTH AND LIFE SCIENCES": "Health and Life Sciences",
  "FACULTY OF HEALTH AND LIFE SCIENCES": "Health and Life Sciences",
};

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "0";
  }

  return Number(value).toFixed(2).replace(/\.00$/, "");
}

function normalizeFacultyLabel(value: string | null | undefined) {
  const text = (value || "").trim();
  if (!text) {
    return "";
  }

  const normalized = FACULTY_NAME_NORMALIZERS[text.toUpperCase()];
  if (normalized) {
    return normalized;
  }

  return text
    .replace(/^Faculty of\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getDepartmentShortnames(record: ExamLookupRecord) {
  if (Array.isArray(record.department_shortnames)) {
    return record.department_shortnames.map((value) => value.trim().toUpperCase());
  }

  if (typeof record.department_shortnames === "string" && record.department_shortnames.trim()) {
    return record.department_shortnames
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);
  }

  return [];
}

function examMatchesDepartment(record: ExamLookupRecord, department: EffectiveDepartment) {
  const shortnames = getDepartmentShortnames(record);
  if (shortnames.includes(department.department_shortname.toUpperCase())) {
    return true;
  }

  const departmentText = (record.department || "").trim().toLowerCase();
  return (
    departmentText === department.department_name.toLowerCase() ||
    departmentText === department.department_shortname.toLowerCase()
  );
}

export function resolveFacultyName({
  exams,
  department,
  semester,
  resultExamIds = [],
}: {
  exams: ExamLookupRecord[];
  department: EffectiveDepartment | null;
  semester: string;
  resultExamIds?: number[];
}) {
  const normalizedSemester = normalizeSemesterValue(semester);
  const resultExamIdSet = new Set(resultExamIds);

  const examFaculty = exams
    .filter((exam) => normalizeSemesterValue(exam.semester) === normalizedSemester)
    .filter((exam) => (department ? examMatchesDepartment(exam, department) : true))
    .filter((exam) => (resultExamIdSet.size > 0 ? resultExamIdSet.has(Number(exam.id)) : true))
    .map((exam) => normalizeFacultyLabel(exam.faculty))
    .find(Boolean);

  if (examFaculty) {
    return examFaculty;
  }

  if (department?.department_shortname) {
    const fallback = FACULTY_BY_DEPARTMENT_SHORTNAME[department.department_shortname.toUpperCase()];
    if (fallback) {
      return fallback;
    }
  }

  return "Science and Information Technology";
}

export function formatReportDate(value = new Date()) {
  return value.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function buildResultSheetRows(results: AdmissionResult[]): ResultSheetRow[] {
  return results.map((result, index) => ({
    id: result.id,
    serial: index + 1,
    applicationSerial: result.student_f_id || "N/A",
    studentName: result.student_full_name || "N/A",
    username: result.student_username || "",
    ssc: formatNumber(result.student_ssc),
    academic: `${formatNumber(getAcademicDisplayValue(result))} (${getAcademicDisplayLabel(result)})`,
    written: formatNumber(result.mcq_marks),
    viva: formatNumber(result.viva_marks),
    writtenViva: formatNumber(result.written_viva_total),
    total: formatNumber(result.weighted_total_marks),
    remarks: PRETTY_STATUS_LABELS[result.result_status],
  }));
}

export function getResultStatusBadgeClass(status: AdmissionResult["result_status"]) {
  if (status === "SELECTED") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "WAITING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "REJECTED") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function isThresholdEligible(result: AdmissionResult, thresholdValue: number | null) {
  if (thresholdValue === null) {
    return result.result_status !== "SELECTED";
  }

  return Number(result.weighted_total_marks) >= thresholdValue;
}
