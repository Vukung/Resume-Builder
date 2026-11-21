import React from "react";
import { ExperienceItem, ResumeContent } from "../../api/types";
import { SectionCard } from "../components/SectionCard";
import { RepeatableList } from "../components/RepeatableList";
import { TextField } from "../components/TextField";
import { MonthYearInput } from "../components/MonthYearInput";
import { BulletsEditor } from "../components/BulletsEditor";
import { InfoTooltip } from "../components/InfoTooltip";
import { LIMITS } from "../limits";

interface ExperienceFormProps {
  experience: ExperienceItem[];
  updateContent: (updater: (prev: ResumeContent) => ResumeContent) => void;
}

export const ExperienceForm: React.FC<ExperienceFormProps> = ({
  experience,
  updateContent,
}) => {
  const handleItemsChange = (newItems: ExperienceItem[]) => {
    updateContent((prev) => ({
      ...prev,
      experience: newItems,
    }));
  };

  const createItem = (): ExperienceItem => ({
    id: crypto.randomUUID(),
    jobTitle: "",
    company: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    bullets: [],
  });

  const count = experience.length;
  const countText = count === 0 ? "No entries" : count === 1 ? "1 entry" : `${count} entries`;

  return (
    <SectionCard title="Experience" countText={countText} defaultExpanded={false}>
      <RepeatableList
        items={experience}
        onItemsChange={handleItemsChange}
        createItem={createItem}
        getItemLabel={(item, idx) => item.jobTitle.trim() || `Job ${idx + 1}`}
        limit={LIMITS.MAX_EXPERIENCE}
        addLabel="Add experience"
        renderItem={(item, idx, updateItem) => (
          <div className="space-y-4 pt-2">
            <TextField
              id={`exp-title-${idx}`}
              label="Job title"
              value={item.jobTitle}
              maxLength={LIMITS.JOB_TITLE_MAX_LENGTH}
              placeholder="e.g. Frontend Developer Intern"
              onChange={(val) => updateItem({ ...item, jobTitle: val })}
              help={{
                text: "Use your real title or the closest standard equivalent, such as Software Engineering Intern. Recruiters and ATS software search by title.",
                example: "Frontend Developer Intern",
              }}
            />

            <TextField
              id={`exp-company-${idx}`}
              label="Company"
              value={item.company}
              maxLength={LIMITS.COMPANY_MAX_LENGTH}
              placeholder="e.g. Acme Technologies"
              onChange={(val) => updateItem({ ...item, company: val })}
              help={{
                text: "Use the name the company is commonly known by.",
                example: "Acme Technologies",
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MonthYearInput
                id={`exp-start-${idx}`}
                label="Start date"
                value={item.startDate}
                onChange={(val) => updateItem({ ...item, startDate: val })}
                help={
                  <InfoTooltip
                    fieldLabel="Start date"
                    text="Use the month and year you started and left. Tick the checkbox if you still work here."
                  />
                }
              />

              <div className="space-y-2">
                <MonthYearInput
                  id={`exp-end-${idx}`}
                  label="End date"
                  value={item.endDate}
                  disabled={item.isCurrent}
                  onChange={(val) => updateItem({ ...item, endDate: val })}
                  help={
                    <InfoTooltip
                      fieldLabel="End date"
                      text="Use the month and year you started and left. Tick the checkbox if you still work here."
                    />
                  }
                />

                <label className="inline-flex items-center gap-2 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={item.isCurrent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      updateItem({
                        ...item,
                        isCurrent: checked,
                        endDate: checked ? "" : item.endDate,
                      });
                    }}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-xs text-foreground">I currently work here</span>
                </label>
              </div>
            </div>

            <BulletsEditor
              bullets={item.bullets}
              onChange={(newBullets) => updateItem({ ...item, bullets: newBullets })}
              help={
                <InfoTooltip
                  fieldLabel="Bullet Points"
                  text="Write two to five bullets that start with a strong verb. Say what you did, how you did it, and what changed, with numbers only where you honestly have them. Never invent metrics."
                  example="Built a REST API in Node.js that reduced report generation time from 12 seconds to 3 seconds."
                />
              }
            />
          </div>
        )}
      />
    </SectionCard>
  );
};
