import React, { useState, useEffect } from "react";
import { Basics, ResumeContent } from "../../api/types";
import { TextField } from "../components/TextField";
import { SectionCard } from "../components/SectionCard";
import { isValidHttpUrl } from "../utils/sanitizer";
import { Plus, Trash2 } from "lucide-react";

interface BasicsFormProps {
  basics: Basics;
  updateContent: (updater: (prev: ResumeContent) => ResumeContent) => void;
}

const TOOLTIPS = {
  fullName: {
    text: "Use the name on your official documents and LinkedIn profile. Recruiters and ATS software match your resume against your application, so keep it consistent.",
    example: "Aarav Sharma",
  },
  email: {
    text: "Use a professional address, ideally some form of your name. Check it regularly because recruiters reply here.",
    example: "aarav.sharma@gmail.com",
  },
  phone: {
    text: "Include your country code so recruiters outside your city can call. Add a number you actually answer.",
    example: "+91 98765 43210",
  },
  location: {
    text: "City and state or country is enough. Skip your full street address. If you are open to relocating or remote work, mention it in your summary.",
    example: "Pune, India",
  },
  linkLabel: {
    text: "A short name for the link, such as LinkedIn, GitHub, or Portfolio.",
  },
  linkUrl: {
    text: "Paste the full address starting with https://. Only add links to work that is public and that you want recruiters to open.",
  },
};

export const BasicsForm: React.FC<BasicsFormProps> = ({ basics, updateContent }) => {
  const [linkKeys, setLinkKeys] = useState<string[]>(() =>
    basics.links.map(() => crypto.randomUUID())
  );

  useEffect(() => {
    if (basics.links.length !== linkKeys.length) {
      setLinkKeys((prev) => {
        if (basics.links.length > prev.length) {
          const needed = basics.links.length - prev.length;
          const added = Array.from({ length: needed }, () => crypto.randomUUID());
          return [...prev, ...added];
        }
        return prev.slice(0, basics.links.length);
      });
    }
  }, [basics.links.length, linkKeys.length]);

  const updateField = (field: keyof Omit<Basics, "links">, val: string) => {
    updateContent((prev) => ({
      ...prev,
      basics: {
        ...prev.basics,
        [field]: val,
      },
    }));
  };

  const handleAddLink = () => {
    if (basics.links.length >= 10) return;
    setLinkKeys((prev) => [...prev, crypto.randomUUID()]);
    updateContent((prev) => ({
      ...prev,
      basics: {
        ...prev.basics,
        links: [...prev.basics.links, { label: "", url: "" }],
      },
    }));
  };

  const handleRemoveLink = (index: number) => {
    setLinkKeys((prev) => prev.filter((_, idx) => idx !== index));
    updateContent((prev) => ({
      ...prev,
      basics: {
        ...prev.basics,
        links: prev.basics.links.filter((_, idx) => idx !== index),
      },
    }));
  };

  const handleLinkChange = (index: number, key: "label" | "url", value: string) => {
    updateContent((prev) => {
      const updatedLinks = [...prev.basics.links];
      updatedLinks[index] = {
        ...updatedLinks[index],
        [key]: value,
      };
      return {
        ...prev,
        basics: {
          ...prev.basics,
          links: updatedLinks,
        },
      };
    });
  };

  return (
    <SectionCard title="Basics">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="basics-fullname"
          label="Full name"
          value={basics.fullName}
          onChange={(v) => updateField("fullName", v)}
          maxLength={100}
          placeholder="Aarav Sharma"
          autoComplete="name"
          help={TOOLTIPS.fullName}
        />

        <TextField
          id="basics-email"
          label="Email"
          type="email"
          value={basics.email}
          onChange={(v) => updateField("email", v)}
          maxLength={254}
          placeholder="aarav.sharma@gmail.com"
          autoComplete="email"
          help={TOOLTIPS.email}
        />

        <TextField
          id="basics-phone"
          label="Phone"
          type="tel"
          value={basics.phone}
          onChange={(v) => updateField("phone", v)}
          maxLength={30}
          placeholder="+91 98765 43210"
          autoComplete="tel"
          help={TOOLTIPS.phone}
        />

        <TextField
          id="basics-location"
          label="Location"
          value={basics.location}
          onChange={(v) => updateField("location", v)}
          maxLength={100}
          placeholder="Pune, India"
          help={TOOLTIPS.location}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
            Websites & Social Links ({basics.links.length}/10)
          </h3>
          <button
            type="button"
            onClick={handleAddLink}
            disabled={basics.links.length >= 10}
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover disabled:text-foreground-subtle disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent rounded px-1.5 py-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add link</span>
          </button>
        </div>

        {basics.links.length === 0 ? (
          <p className="text-xs text-foreground-muted italic py-1">
            No links added yet. Add links to GitHub, LinkedIn, or personal portfolio.
          </p>
        ) : (
          <div className="space-y-3">
            {basics.links.map((link, idx) => {
              const urlTrimmed = link.url.trim();
              const isInvalidUrl = urlTrimmed !== "" && !isValidHttpUrl(urlTrimmed);

              return (
                <div
                  key={linkKeys[idx] || idx}
                  className="p-3 bg-surface border border-border rounded-md relative flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                      <TextField
                        id={`link-label-${idx}`}
                        label="Link label"
                        value={link.label}
                        onChange={(v) => handleLinkChange(idx, "label", v)}
                        maxLength={50}
                        placeholder="LinkedIn / GitHub"
                        help={TOOLTIPS.linkLabel}
                      />
                      <TextField
                        id={`link-url-${idx}`}
                        label="Link URL"
                        type="url"
                        value={link.url}
                        onChange={(v) => handleLinkChange(idx, "url", v)}
                        maxLength={500}
                        placeholder="https://linkedin.com/in/aarav"
                        help={TOOLTIPS.linkUrl}
                        error={isInvalidUrl ? "Enter a full address starting with http:// or https://" : undefined}
                        hint={isInvalidUrl ? "Not saved until valid" : undefined}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="p-1.5 text-foreground-subtle hover:text-destructive hover:bg-destructive-subtle rounded transition-colors focus:outline-none focus:ring-2 focus:ring-destructive mt-4"
                      aria-label={`Remove link ${link.label || idx + 1}`}
                      title="Remove link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
};
