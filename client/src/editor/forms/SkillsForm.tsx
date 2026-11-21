import React from "react";
import { SkillGroup, ResumeContent } from "../../api/types";
import { SectionCard } from "../components/SectionCard";
import { RepeatableList } from "../components/RepeatableList";
import { TextField } from "../components/TextField";
import { TagInput } from "../components/TagInput";
import { InfoTooltip } from "../components/InfoTooltip";
import { LIMITS } from "../limits";

interface SkillsFormProps {
  skills: SkillGroup[];
  updateContent: (updater: (prev: ResumeContent) => ResumeContent) => void;
}

export const SkillsForm: React.FC<SkillsFormProps> = ({ skills, updateContent }) => {
  const handleItemsChange = (newItems: SkillGroup[]) => {
    updateContent((prev) => ({
      ...prev,
      skills: newItems,
    }));
  };

  const createItem = (): SkillGroup => ({
    id: crypto.randomUUID(),
    category: "",
    items: [],
  });

  const count = skills.length;
  const countText = count === 0 ? "No entries" : count === 1 ? "1 entry" : `${count} entries`;

  return (
    <SectionCard title="Skills" countText={countText} defaultExpanded={false}>
      <RepeatableList
        items={skills}
        onItemsChange={handleItemsChange}
        createItem={createItem}
        getItemLabel={(item, idx) => item.category.trim() || `Skill Group ${idx + 1}`}
        limit={LIMITS.MAX_SKILL_GROUPS}
        addLabel="Add skill group"
        renderItem={(item, idx, updateItem) => (
          <div className="space-y-4 pt-2">
            <TextField
              id={`skill-cat-${idx}`}
              label="Category"
              value={item.category}
              maxLength={LIMITS.SKILL_CATEGORY_MAX_LENGTH}
              placeholder="e.g. Languages"
              onChange={(val) => updateItem({ ...item, category: val })}
              help={{
                text: "A short group name that helps a recruiter scan, such as Languages, Frameworks, Databases, or Tools.",
                example: "Languages",
              }}
            />

            <TagInput
              id={`skill-items-${idx}`}
              label="Skills"
              tags={item.items}
              onChange={(newItems) => updateItem({ ...item, items: newItems })}
              maxCount={LIMITS.MAX_SKILL_ITEMS}
              maxTagLength={LIMITS.SKILL_ITEM_MAX_LENGTH}
              placeholder="e.g. TypeScript, React"
              help={
                <InfoTooltip
                  fieldLabel="Skills"
                  text="List skills you can discuss in an interview. Type one and press Enter or a comma. Use the same spelling the job posting uses, for example JavaScript rather than JS and PostgreSQL rather than Postgres."
                  example="TypeScript, Node.js, PostgreSQL"
                />
              }
            />
          </div>
        )}
      />
    </SectionCard>
  );
};
