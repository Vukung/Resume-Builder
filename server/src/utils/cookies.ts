import { Response, CookieOptions } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export const COOKIE_NAME = "rr_session";

export function getCookieOptions(maxAgeSeconds?: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: config.NODE_ENV === "production",
    maxAge: (maxAgeSeconds !== undefined ? maxAgeSeconds : 7 * 24 * 60 * 60) * 1000,
  };
}

export function getClearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: config.NODE_ENV === "production",
  };
}

export function setSessionCookie(
  res: Response,
  userId: string,
  maxAgeSeconds?: number
): void {
  const expiresIn = maxAgeSeconds !== undefined ? maxAgeSeconds : "7d";
  const token = jwt.sign({ sub: userId }, config.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn,
  });
  res.cookie(COOKIE_NAME, token, getCookieOptions(maxAgeSeconds));
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, getClearCookieOptions());
}
