import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExperienceForm } from "../editor/forms/ExperienceForm";
import { ResumeDocument } from "../editor/preview/ResumeDocument";
import { ResumeContent } from "../api/types";

const ExperienceWrapper = () => {
  const [content, setContent] = useState<ResumeContent>({
    schemaVersion: 1,
    basics: { fullName: "Alex", email: "alex@example.com", phone: "", location: "", links: [] },
    summary: "",
    education: [],
    experience: [
      {
        id: "exp-1",
        jobTitle: "Software Engineer",
        company: "Acme",
        startDate: "2021-05",
        endDate: "2023-08",
        isCurrent: false,
        bullets: ["Developed software"],
      },
    ],
    projects: [],
    certifications: [],
    skills: [],
  });

  return (
    <div>
      <ExperienceForm
        experience={content.experience}
        updateContent={(updater) => setContent(updater)}
      />
      <div data-testid="preview-pane">
        <ResumeDocument content={content} />
      </div>
    </div>
  );
};

describe("ExperienceForm", () => {
  it("ticking 'I currently work here' clears end date, disables end date control, and preview shows 'Present'", async () => {
    const user = userEvent.setup();
    render(<ExperienceWrapper />);

    // Expand Experience card (it starts collapsed)
    const expandBtn = screen.getByRole("button", { name: /expand/i });
    await user.click(expandBtn);

    const endDateMonth = screen.getByLabelText("End date month");
    const endDateYear = screen.getByLabelText("End date year");
    const checkbox = screen.getByLabelText("I currently work here");

    // Initially endDate has values and preview shows "May 2021 - Aug 2023"
    expect(endDateMonth).not.toBeDisabled();
    expect(endDateYear).not.toBeDisabled();
    expect(screen.getByTestId("preview-pane")).toHaveTextContent("May 2021 - Aug 2023");

    // Tick "I currently work here"
    await user.click(checkbox);

    // End date selects should now be disabled and cleared
    expect(endDateMonth).toBeDisabled();
    expect(endDateYear).toBeDisabled();
    expect(endDateMonth).toHaveValue("");
    expect(endDateYear).toHaveValue("");

    // Preview should now show "May 2021 - Present"
    expect(screen.getByTestId("preview-pane")).toHaveTextContent("May 2021 - Present");
  });
});
