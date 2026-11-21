import { ResumeContent } from "../../api/types";

export function isValidHttpUrl(val: string): boolean {
  if (!val || typeof val !== "string") return false;
  const trimmed = val.trim();
  if (trimmed === "") return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Pure sanitizer for autosave payloads.
 * Any link url that is non-empty and is not a valid http or https URL is sent as an empty string.
 * Everything else is preserved exactly as typed.
 */
export function toSaveable(content: ResumeContent): ResumeContent {
  const sanitizedLinks = content.basics.links.map((link) => {
    const trimmed = link.url.trim();
    if (trimmed !== "" && !isValidHttpUrl(trimmed)) {
      return {
        ...link,
        url: "",
      };
    }
    return link;
  });

  return {
    ...content,
    basics: {
      ...content.basics,
      links: sanitizedLinks,
    },
  };
}
