import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { DEMO_EMAIL_DOMAIN } from "../demo/constants";

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      res.status(400).json({
        error: "Validation failed",
        fields,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .refine(
      (val) => !val.toLowerCase().endsWith("@" + DEMO_EMAIL_DOMAIN),
      { message: "Demo email domain is reserved" }
    ),
  name: z
    .string()
    .trim()
    .min(1, "Name must be at least 1 character")
    .max(100, "Name must be at most 100 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
