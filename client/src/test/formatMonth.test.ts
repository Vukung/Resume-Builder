import { describe, it, expect } from "vitest";
import { formatMonth } from "../editor/utils/formatMonth";

describe("formatMonth", () => {
  it("formats valid YYYY-MM strings correctly", () => {
    expect(formatMonth("2020-08")).toBe("Aug 2020");
    expect(formatMonth("2024-01")).toBe("Jan 2024");
    expect(formatMonth("2019-12")).toBe("Dec 2019");
  });

  it("handles whitespace around valid dates", () => {
    expect(formatMonth("  2023-05  ")).toBe("May 2023");
  });

  it("returns empty string for empty input", () => {
    expect(formatMonth("")).toBe("");
    expect(formatMonth("   ")).toBe("");
    expect(formatMonth(null)).toBe("");
    expect(formatMonth(undefined)).toBe("");
  });

  it("returns empty string for malformed or out-of-range dates", () => {
    expect(formatMonth("2020-13")).toBe("");
    expect(formatMonth("2020-00")).toBe("");
    expect(formatMonth("20-05")).toBe("");
    expect(formatMonth("not-a-date")).toBe("");
    expect(formatMonth("2020/05")).toBe("");
    expect(formatMonth("2020-5")).toBe("");
  });
});
