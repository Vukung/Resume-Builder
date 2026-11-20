import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.string().default("development"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const invalidVars = result.error.issues.map((issue) => issue.path.join("."));
  console.error(
    `Invalid or missing environment variables: ${invalidVars.join(", ")}`
  );
  process.exit(1);
}

export const config = result.data;
