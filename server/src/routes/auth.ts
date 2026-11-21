import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { rateLimit } from "express-rate-limit";
import { query } from "../db";
import { setSessionCookie, clearSessionCookie } from "../utils/cookies";
import { requireAuth } from "../middleware/requireAuth";

const authRouter = Router();

// Fixed dummy hash for timing attack mitigation on unknown user login
const DUMMY_HASH = "$2b$12$zsDV6WG5Lqm9Y5.FOXtBqu.Rtk3rqhEvebEJgqpSiIsQvTkcDfkWS";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
  statusCode: 429,
});

function validateBody<T>(schema: z.ZodSchema<T>) {
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

const signupSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
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

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

authRouter.post(
  "/signup",
  authLimiter,
  validateBody(signupSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, name, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    try {
      const passwordHash = await bcrypt.hash(password, 12);
      const result = await query<{ id: string; email: string; name: string }>(
        "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name",
        [normalizedEmail, name, passwordHash]
      );
      const user = result.rows[0];
      setSessionCookie(res, user.id);
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        (err as { code?: string }).code === "23505"
      ) {
        res
          .status(409)
          .json({ error: "An account with this email already exists" });
        return;
      }
      next(err);
    }
  }
);

authRouter.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    try {
      const result = await query<{
        id: string;
        email: string;
        name: string;
        password_hash: string;
      }>(
        "SELECT id, email, name, password_hash FROM users WHERE lower(email) = lower($1)",
        [normalizedEmail]
      );

      const user = result.rows[0];

      if (!user) {
        await bcrypt.compare(password, DUMMY_HASH);
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      setSessionCookie(res, user.id);
      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

authRouter.post("/logout", (_req: Request, res: Response): void => {
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
});

authRouter.get(
  "/me",
  requireAuth,
  (req: Request, res: Response): void => {
    res.status(200).json({ user: req.user });
  }
);

export { authRouter };
