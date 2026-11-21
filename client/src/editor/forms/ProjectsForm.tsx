import React from "react";
import { ProjectItem, ResumeContent } from "../../api/types";
import { SectionCard } from "../components/SectionCard";
import { RepeatableList } from "../components/RepeatableList";
import { TextField } from "../components/TextField";
import { TagInput } from "../components/TagInput";
import { BulletsEditor } from "../components/BulletsEditor";
import { InfoTooltip } from "../components/InfoTooltip";
import { isValidHttpUrl } from "../utils/sanitizer";
import { LIMITS } from "../limits";

interface ProjectsFormProps {
  projects: ProjectItem[];
  updateContent: (updater: (prev: ResumeContent) => ResumeContent) => void;
}

export const ProjectsForm: React.FC<ProjectsFormProps> = ({ projects, updateContent }) => {
  const handleItemsChange = (newItems: ProjectItem[]) => {
    updateContent((prev) => ({
      ...prev,
      projects: newItems,
    }));
  };

  const createItem = (): ProjectItem => ({
    id: crypto.randomUUID(),
    name: "",
    techStack: [],
    link: "",
    bullets: [],
  });

  const count = projects.length;
  const countText = count === 0 ? "No entries" : count === 1 ? "1 entry" : `${count} entries`;

  return (
    <SectionCard title="Projects" countText={countText} defaultExpanded={false}>
      <RepeatableList
        items={projects}
        onItemsChange={handleItemsChange}
        createItem={createItem}
        getItemLabel={(item, idx) => item.name.trim() || `Project ${idx + 1}`}
        limit={LIMITS.MAX_PROJECTS}
        addLabel="Add project"
        renderItem={(item, idx, updateItem) => {
          const trimmedLink = item.link.trim();
          const hasInvalidUrl = trimmedLink !== "" && !isValidHttpUrl(trimmedLink);

          return (
            <div className="space-y-4 pt-2">
              <TextField
                id={`proj-name-${idx}`}
                label="Project name"
                value={item.name}
                maxLength={LIMITS.PROJECT_NAME_MAX_LENGTH}
                placeholder="e.g. Expense Tracker App"
                onChange={(val) => updateItem({ ...item, name: val })}
                help={{
                  text: "Use the name people would recognize your project by.",
                  example: "Expense Tracker App",
                }}
              />

              <TagInput
                id={`proj-tech-${idx}`}
                label="Tech stack"
                tags={item.techStack}
                onChange={(newTags) => updateItem({ ...item, techStack: newTags })}
                maxCount={LIMITS.MAX_TECH_STACK_ITEMS}
                maxTagLength={LIMITS.TECH_STACK_ITEM_MAX_LENGTH}
                placeholder="e.g. React, Node.js"
                help={
                  <InfoTooltip
                    fieldLabel="Tech stack"
                    text="List the main technologies you used. Type one and press Enter or a comma."
                    example="React, Node.js, PostgreSQL"
                  />
                }
              />

              <TextField
                id={`proj-link-${idx}`}
                label="Link"
                type="url"
                value={item.link}
                maxLength={LIMITS.PROJECT_LINK_MAX_LENGTH}
                placeholder="https://example.com"
                onChange={(val) => updateItem({ ...item, link: val })}
                error={hasInvalidUrl ? "Enter a full address starting with http:// or https://" : undefined}
                hint={hasInvalidUrl ? "Not saved until valid" : undefined}
                help={{
                  text: "Link to the live demo or the code repository. Paste the full address starting with https://. Make sure the page works and the repository is public.",
                }}
              />

              <BulletsEditor
                bullets={item.bullets}
                onChange={(newBullets) => updateItem({ ...item, bullets: newBullets })}
                help={
                  <InfoTooltip
                    fieldLabel="Bullet Points"
                    text="Explain what the project does, what you built yourself, and what it shows about your skills. Two or three bullets is plenty."
                    example="Built a full stack expense tracker with login, charts and CSV export using React and Node.js."
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
