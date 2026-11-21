import React from "react";
import { EducationItem, ResumeContent } from "../../api/types";
import { SectionCard } from "../components/SectionCard";
import { RepeatableList } from "../components/RepeatableList";
import { TextField } from "../components/TextField";
import { MonthYearInput } from "../components/MonthYearInput";
import { GradeInput } from "../components/GradeInput";
import { InfoTooltip } from "../components/InfoTooltip";
import { LIMITS } from "../limits";

interface EducationFormProps {
  education: EducationItem[];
  updateContent: (updater: (prev: ResumeContent) => ResumeContent) => void;
}

export const EducationForm: React.FC<EducationFormProps> = ({
  education,
  updateContent,
}) => {
  const handleItemsChange = (newItems: EducationItem[]) => {
    updateContent((prev) => ({
      ...prev,
      education: newItems,
    }));
  };

  const createItem = (): EducationItem => ({
    id: crypto.randomUUID(),
    institution: "",
    degree: "",
    startDate: "",
    endDate: "",
    gradeType: "percentage",
    gradeValue: null,
  });

  const count = education.length;
  const countText = count === 0 ? "No entries" : count === 1 ? "1 entry" : `${count} entries`;

  return (
    <SectionCard title="Education" countText={countText} defaultExpanded={false}>
      <RepeatableList
        items={education}
        onItemsChange={handleItemsChange}
        createItem={createItem}
        getItemLabel={(item, idx) => item.institution.trim() || `Education ${idx + 1}`}
        limit={LIMITS.MAX_EDUCATION}
        addLabel="Add education"
        renderItem={(item, idx, updateItem) => {
          const dateWarning =
            item.startDate && item.endDate && item.endDate < item.startDate
              ? "End date is before the start date"
              : undefined;

          return (
            <div className="space-y-4 pt-2">
              <TextField
                id={`edu-inst-${idx}`}
                label="Institution"
                value={item.institution}
                maxLength={LIMITS.INSTITUTION_MAX_LENGTH}
                placeholder="e.g. Savitribai Phule Pune University"
                onChange={(val) => updateItem({ ...item, institution: val })}
                help={{
                  text: "Use the full official name of your college or school, not just an abbreviation.",
                  example: "Savitribai Phule Pune University",
                }}
              />

              <TextField
                id={`edu-degree-${idx}`}
                label="Degree"
                value={item.degree}
                maxLength={LIMITS.DEGREE_MAX_LENGTH}
                placeholder="e.g. B.Tech in Computer Engineering"
                onChange={(val) => updateItem({ ...item, degree: val })}
                help={{
                  text: "Write the full degree and your branch or major. Recruiters scan for this line first.",
                  example: "B.Tech in Computer Engineering",
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MonthYearInput
                  id={`edu-start-${idx}`}
                  label="Start date"
                  value={item.startDate}
                  onChange={(val) => updateItem({ ...item, startDate: val })}
                  help={
                    <InfoTooltip
                      fieldLabel="Start date"
                      text="Use the month and year you started and finished. If you have not graduated yet, enter your expected graduation date."
                    />
                  }
                />

                <MonthYearInput
                  id={`edu-end-${idx}`}
                  label="End date"
                  value={item.endDate}
                  onChange={(val) => updateItem({ ...item, endDate: val })}
                  warning={dateWarning}
                  help={
                    <InfoTooltip
                      fieldLabel="End date"
                      text="Use the month and year you started and finished. If you have not graduated yet, enter your expected graduation date."
                    />
                  }
                />
              </div>

              <GradeInput
                gradeType={item.gradeType}
                gradeValue={item.gradeValue}
                onChange={(type, val) => updateItem({ ...item, gradeType: type, gradeValue: val })}
                onGradeTypeChange={(type) => updateItem({ ...item, gradeType: type })}
                onGradeValueChange={(val) => updateItem({ ...item, gradeValue: val })}
                help={
                  <InfoTooltip
                    fieldLabel="Grade"
                    text="Add a grade only if it helps you. Pick Percentage or CGPA, whichever your university reports, and enter it exactly as it appears on your marksheet. Percentage is 0 to 100 and CGPA is 0 to 10."
                    example="CGPA 8.4"
                  />
                }
              />
            </div>
          );
        }}
      />
    </SectionCard>
  );
};
