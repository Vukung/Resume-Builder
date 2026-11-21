const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Formats a YYYY-MM string into "Aug 2020" style.
 * Returns an empty string for empty or malformed inputs.
 */
export function formatMonth(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== "string") {
    return "";
  }

  const trimmed = dateStr.trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(trimmed)) {
    return "";
  }

  const [yearStr, monthStr] = trimmed.split("-");
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthName = MONTH_NAMES[monthIndex];

  if (!monthName) {
    return "";
  }

  return `${monthName} ${yearStr}`;
}
