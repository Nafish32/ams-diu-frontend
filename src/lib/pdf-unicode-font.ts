import jsPDF from "jspdf";

import hindSiliguriFontUrl from "../assets/fonts/HindSiliguri-Regular.ttf?url";

const FONT_FILE_NAME = "HindSiliguri-Regular.ttf";
const FONT_FAMILY_NAME = "HindSiliguri";

let fontBase64Promise: Promise<string> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function loadFontBase64() {
  if (fontBase64Promise) {
    return fontBase64Promise;
  }

  fontBase64Promise = fetch(hindSiliguriFontUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load Hind Siliguri font");
      }

      return response.arrayBuffer();
    })
    .then((buffer) => arrayBufferToBase64(buffer));

  return fontBase64Promise;
}

export async function ensureUnicodePdfFont(doc: jsPDF) {
  const docWithFontState = doc as jsPDF & {
    __hindSiliguriRegistered?: boolean;
  };

  if (!docWithFontState.__hindSiliguriRegistered) {
    const fontBase64 = await loadFontBase64();
    doc.addFileToVFS(FONT_FILE_NAME, fontBase64);
    doc.addFont(FONT_FILE_NAME, FONT_FAMILY_NAME, "normal");
    doc.addFont(FONT_FILE_NAME, FONT_FAMILY_NAME, "bold");
    docWithFontState.__hindSiliguriRegistered = true;
  }

  doc.setFont(FONT_FAMILY_NAME, "normal");
  return FONT_FAMILY_NAME;
}

export const UNICODE_PDF_FONT_FAMILY = FONT_FAMILY_NAME;
