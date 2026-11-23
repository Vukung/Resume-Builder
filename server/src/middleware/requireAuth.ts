import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { query } from "../db";
import { clearSessionCookie, COOKIE_NAME } from "../utils/cookies";
import { DEMO_TTL_HOURS } from "../demo/constants";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let payload: { sub?: string };
  try {
    payload = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ["HS256"],
    }) as { sub?: string };
  } catch {
    clearSessionCookie(res);
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!payload || typeof payload.sub !== "string") {
    clearSessionCookie(res);
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = await query<{
      id: string;
      email: string;
      name: string;
      is_demo: boolean;
      created_at: Date;
    }>(
      "SELECT id, email, name, is_demo, created_at FROM users WHERE id = $1",
      [payload.sub]
    );

    const user = result.rows[0];
    if (!user) {
      clearSessionCookie(res);
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (user.is_demo) {
      const createdAtMs = new Date(user.created_at).getTime();
      const ageMs = Date.now() - createdAtMs;
      if (ageMs > DEMO_TTL_HOURS * 3600 * 1000) {
        await query("DELETE FROM users WHERE id = $1", [user.id]);
        clearSessionCookie(res);
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      isDemo: Boolean(user.is_demo),
    };

    next();
  } catch (err) {
    next(err);
  }
}
