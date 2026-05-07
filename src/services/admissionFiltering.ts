/**
 * Admission Result Filtering Service
 * Implements tiered filtering logic for student acceptance based on thresholds and seat limits
 */

export interface StudentResult {
  id: number;
  student_id: number;
  student_name: string;
  total_score: number;
  is_absent: boolean;
  current_status?: 'accepted' | 'rejected' | 'waiting' | 'absent';
  is_overridden?: boolean;
}

export interface FilteredResults {
  accepted: StudentResult[];
  waiting: StudentResult[];
  rejected: StudentResult[];
  absent: StudentResult[];
}

/**
 * Apply tiered filtering logic to students based on threshold and seat limit
 * 
 * Tier 1: Rejection (Threshold Check)
 * - Students with score < threshold are marked as rejected
 * - Absent students are exempt and kept as absent
 * 
 * Tier 2: Accepted vs Waiting (Seat Limit Check)
 * - Qualifying students (score >= threshold) are sorted by score descending
 * - Top N students (where N = seat_limit) are marked as accepted
 * - Remaining qualified students are marked as waiting
 * 
 * @param students - Array of student results to filter
 * @param threshold - Minimum marks threshold
 * @param seatLimit - Maximum number of students to accept
 * @returns Filtered results grouped by status
 */
export function applyTieredFiltering(
  students: StudentResult[],
  threshold: number,
  seatLimit: number
): FilteredResults {
  const absent: StudentResult[] = [];
  const qualified: StudentResult[] = [];
  const unqualified: StudentResult[] = [];

  // Tier 1: Separate by threshold and absent status
  students.forEach((student) => {
    if (student.is_absent) {
      absent.push({ ...student, current_status: 'absent' });
    } else if (student.total_score >= threshold) {
      qualified.push(student);
    } else {
      unqualified.push({ ...student, current_status: 'rejected' });
    }
  });

  // Tier 2: Sort qualified by score (descending) and split by seat limit
  qualified.sort((a, b) => b.total_score - a.total_score);
  
  const accepted = qualified.slice(0, seatLimit).map((s) => ({
    ...s,
    current_status: 'accepted' as const
  }));

  const waiting = qualified.slice(seatLimit).map((s) => ({
    ...s,
    current_status: 'waiting' as const
  }));

  return {
    accepted,
    waiting,
    rejected: unqualified,
    absent
  };
}

/**
 * Apply tiered filtering with overrides
 * Overridden students have priority and are locked in their override status
 * Non-overridden students are recalculated with overridden-accepted students
 * counting toward the seat limit
 * 
 * @param students - Array of student results
 * @param threshold - Minimum marks threshold
 * @param seatLimit - Maximum number of students to accept
 * @param overrides - Map of student_id -> override_status
 * @returns Filtered results with overrides applied and cascading recalculation
 */
export function applyTieredFilteringWithOverrides(
  students: StudentResult[],
  threshold: number,
  seatLimit: number,
  overrides: Record<number, 'accepted' | 'rejected' | 'waiting' | 'absent'>
): FilteredResults {
  // Separate overridden and non-overridden students
  const overriddenStudents = students.filter((s) => overrides[s.student_id]);
  const nonOverriddenStudents = students.filter((s) => !overrides[s.student_id]);

  // Build overridden results
  const overriddenAccepted = overriddenStudents
    .filter((s) => overrides[s.student_id] === 'accepted')
    .map((s) => ({ ...s, current_status: 'accepted' as const, is_overridden: true }));

  const overriddenWaiting = overriddenStudents
    .filter((s) => overrides[s.student_id] === 'waiting')
    .map((s) => ({ ...s, current_status: 'waiting' as const, is_overridden: true }));

  const overriddenRejected = overriddenStudents
    .filter((s) => overrides[s.student_id] === 'rejected')
    .map((s) => ({ ...s, current_status: 'rejected' as const, is_overridden: true }));

  const overriddenAbsent = overriddenStudents
    .filter((s) => overrides[s.student_id] === 'absent')
    .map((s) => ({ ...s, current_status: 'absent' as const, is_overridden: true }));

  // Calculate remaining seats after overridden accepts
  const remainingSeats = seatLimit - overriddenAccepted.length;

  // Apply tiered filtering to non-overridden students
  const nonOverriddenFiltered = applyTieredFiltering(
    nonOverriddenStudents,
    threshold,
    Math.max(0, remainingSeats) // Can be negative if overrides exceed seats
  );

  // If overrides exceed seat limit, move the lowest-ranked naturally-accepted to waiting
  if (remainingSeats < 0) {
    const excess = overriddenAccepted.length - seatLimit;
    // Move excess from non-overridden accepted to waiting
    const toMove = nonOverriddenFiltered.accepted.splice(-excess);
    nonOverriddenFiltered.waiting.unshift(...toMove);
  }

  return {
    accepted: [...overriddenAccepted, ...nonOverriddenFiltered.accepted],
    waiting: [...overriddenWaiting, ...nonOverriddenFiltered.waiting],
    rejected: [...overriddenRejected, ...nonOverriddenFiltered.rejected],
    absent: [...overriddenAbsent, ...nonOverriddenFiltered.absent]
  };
}
