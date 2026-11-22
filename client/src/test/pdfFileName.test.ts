import { describe, it, expect } from "vitest";
import { buildPdfFileName } from "../editor/utils/pdfFileName";

describe("buildPdfFileName", () => {
  it("formats valid full name as '<Full Name> - Resume.pdf'", () => {
    expect(buildPdfFileName("Aarav Sharma")).toBe("Aarav Sharma - Resume.pdf");
    expect(buildPdfFileName("John Doe", "My Master Resume")).toBe("John Doe - Resume.pdf");
  });

  it("removes illegal characters: \\ / : * ? \" < > |", () => {
    expect(buildPdfFileName("Jane/Doe:The*Best?")).toBe("JaneDoeTheBest - Resume.pdf");
    expect(buildPdfFileName('Name\\With"Quotes<And>Pipes|')).toBe("NameWithQuotesAndPipes - Resume.pdf");
  });

  it("collapses multiple whitespace characters and trims", () => {
    expect(buildPdfFileName("  Alex    Smith   ")).toBe("Alex Smith - Resume.pdf");
    expect(buildPdfFileName("\tDev\nEngineer\r")).toBe("Dev Engineer - Resume.pdf");
  });

  it("falls back to resume title when full name is empty or only illegal characters", () => {
    expect(buildPdfFileName("", "Frontend Resume")).toBe("Frontend Resume - Resume.pdf");
    expect(buildPdfFileName("   ", "Backend Resume")).toBe("Backend Resume - Resume.pdf");
    expect(buildPdfFileName("/*?:", "Product Manager")).toBe("Product Manager - Resume.pdf");
  });

  it("falls back to 'Resume.pdf' when both name and resume title are empty or invalid", () => {
    expect(buildPdfFileName("", "")).toBe("Resume.pdf");
    expect(buildPdfFileName(undefined, undefined)).toBe("Resume.pdf");
    expect(buildPdfFileName("   ", "   ")).toBe("Resume.pdf");
    expect(buildPdfFileName("/*?:", "*?<>")).toBe("Resume.pdf");
  });
});
