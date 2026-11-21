import { Response, CookieOptions } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export const COOKIE_NAME = "rr_session";

export function getCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: config.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
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

export function setSessionCookie(res: Response, userId: string): void {
  const token = jwt.sign({ sub: userId }, config.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "7d",
  });
  res.cookie(COOKIE_NAME, token, getCookieOptions());
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, getClearCookieOptions());
}
