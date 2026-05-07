import { useEffect, useState } from "react";

import { departmentAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { EffectiveDepartment } from "../lib/admission";

const CSE_FALLBACK_SHORTNAME = "CSE";
const CANONICAL_CSE_NAMES = [
  "DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING",
  "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING",
  "COMPUTER SCIENCE & ENGINEERING",
  "COMPUTER SCIENCE AND ENGINEERING",
];

const normalizeDepartmentName = (name?: string | null) =>
  (name || "").trim().toUpperCase();

const hasSuspiciousSuffix = (name: string) =>
  /\b[A-F0-9]{8}\b/.test(name) || /^[A-Z]{2,6}\s+[A-F0-9]{8}$/.test(name);

const scoreCseFallbackDepartment = (department: EffectiveDepartment) => {
  const shortname = department.department_shortname?.trim().toUpperCase() || "";
  const name = normalizeDepartmentName(department.department_name);

  if (!name && shortname !== CSE_FALLBACK_SHORTNAME) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;

  if (shortname === CSE_FALLBACK_SHORTNAME) {
    score += 100;
  }

  if (CANONICAL_CSE_NAMES.includes(name)) {
    score += 400;
  }

  if (name.startsWith("DEPARTMENT OF COMPUTER SCIENCE")) {
    score += 250;
  } else if (name.includes("COMPUTER SCIENCE")) {
    score += 150;
  }

  if (name.includes("ENGINEERING")) {
    score += 50;
  }

  if (hasSuspiciousSuffix(name)) {
    score -= 500;
  }

  return score;
};

const resolveFallbackDepartment = (departments: EffectiveDepartment[]) =>
  [...departments]
    .map((department) => ({
      department,
      score: scoreCseFallbackDepartment(department),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.department.id - right.department.id;
    })[0]?.department || null;

export function useEffectiveDepartment() {
  const { user } = useAuth();
  const [department, setDepartment] = useState<EffectiveDepartment | null>(
    user?.department_details ?? null,
  );
  const [isFallback, setIsFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(!user?.department_details);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.department_details) {
      setDepartment(user.department_details);
      setIsFallback(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const loadFallbackDepartment = async () => {
      setIsLoading(true);
      try {
        const response = await departmentAPI.getAllDepartments();
        const departments = response?.data || [];
        const cseDepartment = resolveFallbackDepartment(departments);

        if (!isMounted) {
          return;
        }

        setDepartment(cseDepartment);
        setIsFallback(Boolean(cseDepartment));
        setError(cseDepartment ? null : "CSE department could not be resolved.");
      } catch (departmentError: any) {
        if (!isMounted) {
          return;
        }

        setError(departmentError?.message || "Failed to load fallback department.");
        setDepartment(null);
        setIsFallback(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFallbackDepartment();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return {
    department,
    isFallback,
    isLoading,
    error,
  };
}
