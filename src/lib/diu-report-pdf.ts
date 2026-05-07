import jsPDF from "jspdf";

import diuLogo from "../assets/diu-logo.png";
import { formatSemesterLabel } from "./semester";

let logoDataUrlPromise: Promise<string> | null = null;

export function formatReportDate(value = new Date()) {
  return value.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function loadDiuLogoDataUrl() {
  if (logoDataUrlPromise) {
    return logoDataUrlPromise;
  }

  logoDataUrlPromise = fetch(diuLogo)
    .then((response) => response.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("Failed to load logo"));
          reader.readAsDataURL(blob);
        }),
    );

  return logoDataUrlPromise;
}

export function drawDiuPdfChrome(
  doc: jsPDF,
  {
    logoDataUrl,
    semester,
    facultyName,
    departmentName,
    dateLabel = formatReportDate(),
    rightLabel,
  }: {
    logoDataUrl: string;
    semester: string;
    facultyName: string;
    departmentName: string;
    dateLabel?: string;
    rightLabel?: string;
  },
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  const marginX = 26;
  const logoWidth = 62;
  const logoX = centerX - logoWidth / 2;

  doc.addImage(logoDataUrl, "PNG", logoX, 22, logoWidth, 62);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Daffodil International University", centerX, 102, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Admission Test Result, ${formatSemesterLabel(semester)}`, centerX, 122, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Faculty of ${facultyName}`, centerX, 140, { align: "center" });
  doc.text(`Department of ${departmentName}`, centerX, 156, {
    align: "center",
  });
  doc.text(`Date: ${dateLabel}`, centerX, 172, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  if (rightLabel) {
    doc.text(rightLabel, pageWidth - marginX, 18, { align: "right" });
  }
  doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - marginX, pageHeight - 12, {
    align: "right",
  });
}
