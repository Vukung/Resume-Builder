import { describe, it, expect } from "vitest";
import { toSaveable, isValidHttpUrl } from "../editor/utils/sanitizer";
import { ResumeContent } from "../api/types";

describe("Sanitizer toSaveable and URL validation", () => {
  const baseContent: ResumeContent = {
    schemaVersion: 1,
    basics: {
      fullName: "Alex",
      email: "alex@example.com",
      phone: "",
      location: "",
      links: [
        { label: "Valid GitHub", url: "https://github.com/alex" },
        { label: "Valid HTTP", url: "http://alex.dev" },
        { label: "Invalid Protocol", url: "ftp://files.example.com" },
        { label: "Not a URL", url: "just text" },
        { label: "Empty URL", url: "" },
      ],
    },
    summary: "Hello world",
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    skills: [],
  };

  it("validates http and https URLs correctly with isValidHttpUrl", () => {
    expect(isValidHttpUrl("https://example.com")).toBe(true);
    expect(isValidHttpUrl("http://localhost:3000")).toBe(true);
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("not-a-url")).toBe(false);
    expect(isValidHttpUrl("")).toBe(false);
  });

  it("toSaveable sends invalid link URLs as empty strings while preserving valid URLs and other fields", () => {
    const sanitized = toSaveable(baseContent);

    // In memory original remains unchanged
    expect(baseContent.basics.links[2].url).toBe("ftp://files.example.com");
    expect(baseContent.basics.links[3].url).toBe("just text");

    // Sanitized output
    expect(sanitized.basics.links[0].url).toBe("https://github.com/alex");
    expect(sanitized.basics.links[1].url).toBe("http://alex.dev");
    expect(sanitized.basics.links[2].url).toBe("");
    expect(sanitized.basics.links[3].url).toBe("");
    expect(sanitized.basics.links[4].url).toBe("");

    // Labels are preserved
    expect(sanitized.basics.links[2].label).toBe("Invalid Protocol");
    expect(sanitized.basics.links[3].label).toBe("Not a URL");

    // Non-link fields are completely untouched
    expect(sanitized.summary).toBe("Hello world");
    expect(sanitized.basics.fullName).toBe("Alex");
  });
});
