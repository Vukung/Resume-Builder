import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { rateLimit } from "express-rate-limit";
import { query } from "../db";
import { setSessionCookie, clearSessionCookie } from "../utils/cookies";
import { requireAuth } from "../middleware/requireAuth";
import { DEMO_TTL_HOURS, MAX_LIVE_DEMO_ACCOUNTS } from "../demo/constants";
import { createDemoAccount, DemoBusyError } from "../demo/demoService";
import { validateBody, signupSchema, loginSchema } from "../schemas/auth";

const authRouter = Router();

const DUMMY_HASH = "$2b$12$zsDV6WG5Lqm9Y5.FOXtBqu.Rtk3rqhEvebEJgqpSiIsQvTkcDfkWS";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
  statusCode: 429,
});

const demoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many demo sessions from your network. Please try again later or sign up.",
  },
  statusCode: 429,
});

let testDemoCap: number | null = null;
export function setDemoCap(cap: number | null): void {
  testDemoCap = cap;
}

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
          isDemo: false,
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
        is_demo: boolean;
      }>(
        "SELECT id, email, name, password_hash, is_demo FROM users WHERE lower(email) = lower($1)",
        [normalizedEmail]
      );

      const user = result.rows[0];

      if (!user || user.is_demo) {
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
          isDemo: false,
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

authRouter.post(
  "/demo",
  demoLimiter,
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cap = testDemoCap ?? MAX_LIVE_DEMO_ACCOUNTS;
      const { user, resumeId } = await createDemoAccount(cap);
      setSessionCookie(res, user.id, DEMO_TTL_HOURS * 3600);
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isDemo: true,
        },
        resumeId,
      });
    } catch (err) {
      if (err instanceof DemoBusyError) {
        res.status(503).json({ error: err.message });
        return;
      }
      next(err);
    }
  }
);

export { authRouter };
