import { Server } from "node:http";
import crypto from "node:crypto";
import { app } from "../src/app";
import { query, pool } from "../src/db";

let ipCounter = 1;

export function nextIp(): string {
  return `192.168.${Math.floor(ipCounter / 250) + 1}.${(ipCounter++ % 250) + 1}`;
}

export function randomEmail(): string {
  const randomHex = crypto.randomBytes(6).toString("hex");
  return `test-${randomHex}@example.invalid`;
}

export async function startTestServer(): Promise<{ server: Server; baseUrl: string }> {
  app.set("trust proxy", 1);
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address();
      let baseUrl = "";
      if (addr && typeof addr === "object") {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve({ server, baseUrl });
    });
  });
}

export async function deleteUsersByIds(ids: string[]): Promise<void> {
  if (ids.length > 0) {
    await query("DELETE FROM users WHERE id = ANY($1::uuid[])", [ids]);
  }
}

export async function cleanupTestUsers(server?: Server, userIds?: string[]): Promise<void> {
  if (userIds && userIds.length > 0) {
    await deleteUsersByIds(userIds);
  } else {
    await query("DELETE FROM users WHERE email LIKE '%@example.invalid'");
  }
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
  await pool.end();
}

export interface TestUser {
  id: string;
  email: string;
  name: string;
  cookie: string;
}

export async function signupUser(
  baseUrl: string,
  overrides?: { email?: string; name?: string; password?: string }
): Promise<TestUser> {
  const email = overrides?.email || randomEmail();
  const name = overrides?.name || "Test User";
  const password = overrides?.password || "password123";

  const res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": nextIp(),
    },
    body: JSON.stringify({ email, name, password }),
  });

  if (res.status !== 201) {
    const errText = await res.text();
    throw new Error(`signupUser failed with status ${res.status}: ${errText}`);
  }

  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/rr_session=([^;]+)/);
  if (!match) {
    throw new Error("No rr_session cookie in signup response");
  }

  const data = (await res.json()) as { user: { id: string; email: string; name: string } };

  return {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    cookie: match[1],
  };
}

export async function authenticatedFetch(
  baseUrl: string,
  path: string,
  cookie: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers || {});
  headers.set("Cookie", `rr_session=${cookie}`);
  if (!headers.has("X-Forwarded-For")) {
    headers.set("X-Forwarded-For", nextIp());
  }

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });
}
