import { z } from "zod";

const urlSchema = z
  .string()
  .trim()
  .max(500, "URL must be at most 500 characters")
  .refine(
    (val) => {
      if (val === "") return true;
      try {
        const u = new URL(val);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Must be a valid http or https URL" }
  );

const dateSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === "" || /^\d{4}-(0[1-9]|1[0-2])$/.test(val),
    { message: "Date must be an empty string or match YYYY-MM (01-12)" }
  );

function hasUniqueIds<T extends { id: string }>(items: T[]): boolean {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) return false;
    ids.add(item.id);
  }
  return true;
}

const linkItemSchema = z
  .object({
    label: z.string().trim().max(50, "Label must be at most 50 characters"),
    url: urlSchema,
  })
  .strict();

const basicsSchema = z
  .object({
    fullName: z.string().trim().max(100, "Full name must be at most 100 characters"),
    email: z.string().trim().max(254, "Email must be at most 254 characters"),
    phone: z.string().trim().max(30, "Phone must be at most 30 characters"),
    location: z.string().trim().max(100, "Location must be at most 100 characters"),
    links: z.array(linkItemSchema).max(10, "At most 10 links allowed"),
  })
  .strict();

const educationItemSchema = z
  .object({
    id: z.string().trim().min(1, "ID is required").max(64, "ID must be at most 64 characters"),
    institution: z.string().trim().max(150, "Institution must be at most 150 characters"),
    degree: z.string().trim().max(150, "Degree must be at most 150 characters"),
    startDate: dateSchema,
    endDate: dateSchema,
    gradeType: z.enum(["percentage", "cgpa"]),
    gradeValue: z.number().nullable(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.gradeValue !== null) {
      if (data.gradeType === "percentage") {
        if (data.gradeValue < 0 || data.gradeValue > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Percentage must be between 0 and 100",
            path: ["gradeValue"],
          });
        }
      } else if (data.gradeType === "cgpa") {
        if (data.gradeValue < 0 || data.gradeValue > 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "CGPA must be between 0 and 10",
            path: ["gradeValue"],
          });
        }
      }
    }
  });

const experienceItemSchema = z
  .object({
    id: z.string().trim().min(1, "ID is required").max(64, "ID must be at most 64 characters"),
    jobTitle: z.string().trim().max(100, "Job title must be at most 100 characters"),
    company: z.string().trim().max(100, "Company must be at most 100 characters"),
    startDate: dateSchema,
    endDate: dateSchema,
    isCurrent: z.boolean(),
    bullets: z
      .array(z.string().trim().max(500, "Bullet must be at most 500 characters"))
      .max(15, "At most 15 bullets allowed per experience item"),
  })
  .strict();

const projectItemSchema = z
  .object({
    id: z.string().trim().min(1, "ID is required").max(64, "ID must be at most 64 characters"),
    name: z.string().trim().max(100, "Project name must be at most 100 characters"),
    techStack: z
      .array(z.string().trim().max(50, "Tech stack item must be at most 50 characters"))
      .max(30, "At most 30 tech stack items allowed per project"),
    link: urlSchema,
    bullets: z
      .array(z.string().trim().max(500, "Bullet must be at most 500 characters"))
      .max(15, "At most 15 bullets allowed per project"),
  })
  .strict();

const certificationItemSchema = z
  .object({
    id: z.string().trim().min(1, "ID is required").max(64, "ID must be at most 64 characters"),
    name: z.string().trim().max(150, "Certification name must be at most 150 characters"),
    issuer: z.string().trim().max(100, "Issuer must be at most 100 characters"),
  })
  .strict();

export const resumeContentSchema = z
  .object({
    schemaVersion: z.literal(1),
    basics: basicsSchema,
    summary: z.string().trim().max(2000, "Summary must be at most 2000 characters"),
    education: z
      .array(educationItemSchema)
      .max(10, "At most 10 education items allowed")
      .refine(hasUniqueIds, { message: "Education item IDs must be unique" }),
    experience: z
      .array(experienceItemSchema)
      .max(20, "At most 20 experience items allowed")
      .refine(hasUniqueIds, { message: "Experience item IDs must be unique" }),
    projects: z
      .array(projectItemSchema)
      .max(20, "At most 20 project items allowed")
      .refine(hasUniqueIds, { message: "Project item IDs must be unique" }),
    certifications: z
      .array(certificationItemSchema)
      .max(30, "At most 30 certification items allowed")
      .refine(hasUniqueIds, { message: "Certification item IDs must be unique" }),
  })
  .strict();

export type ResumeContent = z.infer<typeof resumeContentSchema>;

export function emptyContent(user: { name?: string; email?: string }): ResumeContent {
  return {
    schemaVersion: 1,
    basics: {
      fullName: user.name || "",
      email: user.email || "",
      phone: "",
      location: "",
      links: [],
    },
    summary: "",
    education: [],
    experience: [],
    projects: [],
    certifications: [],
  };
}
