import React from "react";
import { ResumeContent } from "../../api/types";
import { TextAreaField } from "../components/TextAreaField";
import { SectionCard } from "../components/SectionCard";

interface SummaryFormProps {
  summary: string;
  updateContent: (updater: (prev: ResumeContent) => ResumeContent) => void;
}

const SUMMARY_TOOLTIP = {
  text: "Write two to four sentences: who you are, your strongest skills, and the role you are aiming for. Tailor it to each job you apply to, and avoid vague phrases like hard working or team player.",
  example:
    "Final year electronics engineering student with hands-on experience building full stack web apps in React and Node. Looking for a software engineering internship working on APIs and data driven products.",
};

export const SummaryForm: React.FC<SummaryFormProps> = ({ summary, updateContent }) => {
  const handleChange = (val: string) => {
    updateContent((prev) => ({
      ...prev,
      summary: val,
    }));
  };

  return (
    <SectionCard title="Professional Summary">
      <TextAreaField
        id="summary-input"
        label="Professional Summary"
        value={summary}
        onChange={handleChange}
        maxLength={2000}
        rows={4}
        placeholder="Brief summary of your background, core strengths, and what you bring to the role..."
        help={SUMMARY_TOOLTIP}
      />
    </SectionCard>
  );
};
