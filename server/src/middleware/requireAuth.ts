import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { query } from "../db";
import { clearSessionCookie, COOKIE_NAME } from "../utils/cookies";

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
    const result = await query<{ id: string; email: string; name: string }>(
      "SELECT id, email, name FROM users WHERE id = $1",
      [payload.sub]
    );

    const user = result.rows[0];
    if (!user) {
      clearSessionCookie(res);
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (err) {
    next(err);
  }
}
