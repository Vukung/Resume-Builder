/**
 * Sanitizes and generates a clean PDF file name.
 * - Format: "<Full Name> - Resume.pdf"
 * - Characters \ / : * ? " < > | removed
 * - Whitespace collapsed and trimmed
 * - Empty name falls back to the resume title, then to "Resume.pdf"
 */
function sanitizePart(input?: string): string {
  if (!input) return "";
  return input.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim();
}

export function buildPdfFileName(fullName?: string, resumeTitle?: string): string {
  const cleanName = sanitizePart(fullName);
  const cleanTitle = sanitizePart(resumeTitle);
  const chosen = cleanName || cleanTitle;

  if (!chosen) {
    return "Resume.pdf";
  }

  const base = `${chosen} - Resume`;
  const sanitized = base.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim();

  if (!sanitized || sanitized === "-") {
    return "Resume.pdf";
  }

  return `${sanitized}.pdf`;
}
