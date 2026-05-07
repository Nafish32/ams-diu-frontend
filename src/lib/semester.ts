const TERM_ORDER: Record<string, number> = {
  Spring: 1,
  Summer: 2,
  Fall: 3,
};

const SEMESTER_PATTERN = /^(spring|summer|fall)[\s-]+(\d{4})$/i;

export function normalizeSemesterValue(value: string | null | undefined) {
  const text = (value || "").trim();
  if (!text) {
    return "";
  }

  const compact = text.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  const match = compact.match(SEMESTER_PATTERN);
  if (!match) {
    return compact;
  }

  const term = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
  return `${term} ${match[2]}`;
}

export function formatSemesterLabel(value: string | null | undefined) {
  return normalizeSemesterValue(value);
}

export function sortSemesterValues(values: string[]) {
  return [...new Set(values.map((value) => normalizeSemesterValue(value)).filter(Boolean))].sort(
    (left, right) => {
      const [leftTerm, leftYear] = left.split(" ");
      const [rightTerm, rightYear] = right.split(" ");

      const yearDelta = Number(leftYear) - Number(rightYear);
      if (yearDelta !== 0) {
        return yearDelta;
      }

      return (TERM_ORDER[leftTerm] || 999) - (TERM_ORDER[rightTerm] || 999);
    },
  );
}

export function buildAcademicSemesterOptions({
  previousYears = 1,
  nextYears = 1,
  baseYear = new Date().getFullYear(),
}: {
  previousYears?: number;
  nextYears?: number;
  baseYear?: number;
} = {}) {
  const years = Array.from(
    { length: previousYears + nextYears + 1 },
    (_, index) => baseYear - previousYears + index,
  );

  return years.flatMap((year) =>
    ["Spring", "Summer", "Fall"].map((term) => `${term} ${year}`),
  );
}
