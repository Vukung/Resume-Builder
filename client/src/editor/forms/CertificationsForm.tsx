import React from "react";
import { CertificationItem, ResumeContent } from "../../api/types";
import { SectionCard } from "../components/SectionCard";
import { RepeatableList } from "../components/RepeatableList";
import { TextField } from "../components/TextField";
import { LIMITS } from "../limits";

interface CertificationsFormProps {
  certifications: CertificationItem[];
  updateContent: (updater: (prev: ResumeContent) => ResumeContent) => void;
}

export const CertificationsForm: React.FC<CertificationsFormProps> = ({
  certifications,
  updateContent,
}) => {
  const handleItemsChange = (newItems: CertificationItem[]) => {
    updateContent((prev) => ({
      ...prev,
      certifications: newItems,
    }));
  };

  const createItem = (): CertificationItem => ({
    id: crypto.randomUUID(),
    name: "",
    issuer: "",
  });

  const count = certifications.length;
  const countText = count === 0 ? "No entries" : count === 1 ? "1 entry" : `${count} entries`;

  return (
    <SectionCard title="Certifications" countText={countText} defaultExpanded={false}>
      <RepeatableList
        items={certifications}
        onItemsChange={handleItemsChange}
        createItem={createItem}
        getItemLabel={(item, idx) => item.name.trim() || `Certification ${idx + 1}`}
        limit={LIMITS.MAX_CERTIFICATIONS}
        addLabel="Add certification"
        renderItem={(item, idx, updateItem) => (
          <div className="space-y-4 pt-2">
            <TextField
              id={`cert-name-${idx}`}
              label="Certification name"
              value={item.name}
              maxLength={LIMITS.CERTIFICATION_NAME_MAX_LENGTH}
              placeholder="e.g. AWS Certified Cloud Practitioner"
              onChange={(val) => updateItem({ ...item, name: val })}
              help={{
                text: "Use the exact certificate title. Only list certifications that matter for the roles you apply for.",
                example: "AWS Certified Cloud Practitioner",
              }}
            />

            <TextField
              id={`cert-issuer-${idx}`}
              label="Issuer"
              value={item.issuer}
              maxLength={LIMITS.ISSUER_MAX_LENGTH}
              placeholder="e.g. Amazon Web Services"
              onChange={(val) => updateItem({ ...item, issuer: val })}
              help={{
                text: "The organization that issued the certificate.",
                example: "Amazon Web Services",
              }}
            />
          </div>
        )}
      />
    </SectionCard>
  );
};
