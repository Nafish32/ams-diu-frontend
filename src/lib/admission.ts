export interface EffectiveDepartment {
  id: number;
  department_name: string;
  department_shortname: string;
}

export interface AdmissionConfiguration {
  id: number;
  department: number;
  department_name: string;
  department_shortname: string;
  semester: string;
  exam: number | null;
  exam_department?: string;
  seat_limit: number;
  threshold: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AdmissionExamDetails {
  id: number;
  department: string;
  semester: string;
  total_marks: number;
}

export interface AdmissionResult {
  id: number;
  exam: number;
  student: number;
  student_username: string;
  student_full_name: string;
  student_f_id: string;
  student_registration_semester: string;
  student_ssc: number;
  student_hsc: number;
  student_diploma: number;
  configuration: number | null;
  configuration_details?: AdmissionConfiguration | null;
  department: number | null;
  department_name: string;
  department_shortname: string;
  mcq_marks: number;
  viva_marks: number;
  written_viva_total: number;
  total_marks: number;
  weighted_total_marks: number;
  attended_exam: boolean;
  subject_wise_marks: Record<string, unknown>;
  is_selected: boolean;
  result_status: "SELECTED" | "WAITING" | "REJECTED" | "ABSENT";
  status: "PENDING" | "PUBLISHED" | "CANCELLED";
  threshold_applied: number | null;
  remarks?: string | null;
  ssc_score: number;
  academic_score: number;
  academic_source: "HSC" | "DIPLOMA" | "NONE";
  ssc_contribution: number;
  academic_contribution: number;
  written_contribution: number;
  viva_contribution: number;
  exam_details: AdmissionExamDetails;
  created_at: string;
  updated_at: string;
}

export const RESULT_STATUS_LABELS: Record<AdmissionResult["result_status"], string> = {
  SELECTED: "Selected",
  WAITING: "Waiting",
  REJECTED: "Rejected",
  ABSENT: "Absent",
};

export const PRETTY_STATUS_LABELS = RESULT_STATUS_LABELS;

export { formatSemesterLabel } from "./semester";

export function getAcademicDisplayValue(result: AdmissionResult) {
  if (result.student_diploma && result.student_diploma > 0) {
    return result.student_diploma;
  }

  return result.student_hsc;
}

export function getAcademicDisplayLabel(result: AdmissionResult) {
  if (result.student_diploma && result.student_diploma > 0) {
    return "Diploma";
  }

  return "HSC";
}

export function matchesAdmissionSearch(result: AdmissionResult, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) {
    return true;
  }

  return [
    result.student_full_name,
    result.student_username,
    result.student_f_id,
  ]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalizedSearch));
}

export function isWaitingCandidate(result: AdmissionResult) {
  return result.result_status === "WAITING";
}

export function compareAdmissionResults(
  left: AdmissionResult,
  right: AdmissionResult,
  sortBy: "name" | "score",
  sortOrder: "asc" | "desc",
) {
  const direction = sortOrder === "asc" ? 1 : -1;

  if (sortBy === "name") {
    return left.student_full_name.localeCompare(right.student_full_name) * direction;
  }

  return (left.weighted_total_marks - right.weighted_total_marks) * direction;
}
