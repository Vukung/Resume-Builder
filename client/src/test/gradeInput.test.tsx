import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GradeInput } from "../editor/components/GradeInput";
import { toSaveable } from "../editor/utils/sanitizer";
import { ResumeContent } from "../api/types";

const GradeWrapper = () => {
  const [type, setType] = useState<"percentage" | "cgpa">("percentage");
  const [val, setVal] = useState<number | null>(null);

  return (
    <div>
      <GradeInput
        gradeType={type}
        gradeValue={val}
        onGradeTypeChange={setType}
        onGradeValueChange={setVal}
      />
      <span data-testid="emitted-grade">{val === null ? "null" : String(val)}</span>
    </div>
  );
};

describe("GradeInput", () => {
  it("allows typing '8.', shows error for out of range, revalidates on grade type change, and toSaveable sends null for invalid", async () => {
    const user = userEvent.setup();
    render(<GradeWrapper />);

    const typeSelect = screen.getByLabelText("Grade type");
    const valueInput = screen.getByLabelText("Grade value");

    // 1. Switch to CGPA
    await user.selectOptions(typeSelect, "cgpa");

    // 2. Type "8." -> can be typed without error
    await user.type(valueInput, "8.");
    expect(valueInput).toHaveValue("8.");
    expect(screen.queryByText(/enter a number between/i)).not.toBeInTheDocument();

    // Type "5" -> "8.5"
    await user.type(valueInput, "5");
    expect(valueInput).toHaveValue("8.5");
    expect(screen.getByTestId("emitted-grade")).toHaveTextContent("8.5");

    // 3. Out of range CGPA (e.g. 15)
    await user.clear(valueInput);
    await user.type(valueInput, "15");
    expect(screen.getByText("Enter a number between 0 and 10")).toBeInTheDocument();
    expect(screen.getByText("Not saved until valid")).toBeInTheDocument();
    expect(screen.getByTestId("emitted-grade")).toHaveTextContent("null");

    // Verify toSaveable with out of range gradeValue
    const testContent: ResumeContent = {
      schemaVersion: 1,
      basics: { fullName: "", email: "", phone: "", location: "", links: [] },
      summary: "",
      education: [
        {
          id: "1",
          institution: "College",
          degree: "B.Tech",
          startDate: "",
          endDate: "",
          gradeType: "cgpa",
          gradeValue: 15,
        },
      ],
      experience: [],
      projects: [],
      certifications: [],
      skills: [],
    };
    const sanitized = toSaveable(testContent);
    expect(sanitized.education[0].gradeValue).toBeNull();
    // In-memory retains 15
    expect(testContent.education[0].gradeValue).toBe(15);

    // 4. Changing grade type revalidates:
    // Switch to percentage with current value "15" -> 15 is valid percentage (0-100)
    await user.selectOptions(typeSelect, "percentage");
    expect(screen.queryByText(/enter a number between/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("emitted-grade")).toHaveTextContent("15");

    // Now type 150 -> out of range percentage
    await user.clear(valueInput);
    await user.type(valueInput, "150");
    expect(screen.getByText("Enter a number between 0 and 100")).toBeInTheDocument();
    expect(screen.getByText("Not saved until valid")).toBeInTheDocument();
  });
});
