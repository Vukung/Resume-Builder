import { formatMonth } from "../utils/formatMonth";

export function formatDates(startDate?: string, endDate?: string, isCurrent?: boolean): string {
  const start = formatMonth(startDate);
  const end = isCurrent ? "Present" : formatMonth(endDate);
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;
  return "";
}

export function cleanUrlDisplay(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}
