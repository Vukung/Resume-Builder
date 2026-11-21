import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { Server } from "node:http";
import crypto from "node:crypto";
import { app } from "../src/app";
import { query, pool } from "../src/db";

describe("Phase 2: Authentication & Authorization", () => {
  let server: Server;
  let baseUrl: string;
  let ipCounter = 1;

  function nextIp(): string {
    return `192.168.100.${ipCounter++}`;
  }

  function randomEmail(): string {
    const randomHex = crypto.randomBytes(6).toString("hex");
    return `test-${randomHex}@example.invalid`;
  }

  before(async () => {
    // Ensure trust proxy is enabled so X-Forwarded-For is respected by express-rate-limit during tests
    app.set("trust proxy", 1);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === "object") {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    // Delete all test users created during test runs
    await query("DELETE FROM users WHERE email LIKE '%@example.invalid'");
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    await pool.end();
  });

  test("1. Signup with valid data returns 201 and a Set-Cookie for rr_session containing HttpOnly and SameSite=Lax", async () => {
    const email = randomEmail();
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": nextIp(),
      },
      body: JSON.stringify({
        email,
        name: "Valid User",
        password: "password123",
      }),
    });

    assert.equal(res.status, 201);
    const body = (await res.json()) as { user: { id: string; email: string; name: string } };
    assert.equal(body.user.email, email.toLowerCase());
    assert.equal(body.user.name, "Valid User");
    assert.ok(body.user.id);

    const setCookie = res.headers.get("set-cookie") || "";
    assert.match(setCookie, /rr_session=/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
  });

  test("2. GET /me with that cookie returns the user, with no password_hash field anywhere in the body", async () => {
    const email = randomEmail();
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": nextIp(),
      },
      body: JSON.stringify({
        email,
        name: "Me Test User",
        password: "password123",
      }),
    });

    assert.equal(signupRes.status, 201);
    const setCookie = signupRes.headers.get("set-cookie") || "";
    const cookieMatch = setCookie.match(/rr_session=([^;]+)/);
    assert.ok(cookieMatch, "rr_session cookie must be present");
    const cookieVal = cookieMatch[1];

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: `rr_session=${cookieVal}`,
        "X-Forwarded-For": nextIp(),
      },
    });

    assert.equal(meRes.status, 200);
    const bodyText = await meRes.text();
    assert.equal(bodyText.includes("password_hash"), false, "password_hash must not appear anywhere in body");

    const body = JSON.parse(bodyText);
    assert.equal(body.user.email, email.toLowerCase());
    assert.equal(body.user.name, "Me Test User");
    assert.ok(body.user.id);
  });

  test("3. GET /me without a cookie returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        "X-Forwarded-For": nextIp(),
      },
    });

    assert.equal(res.status, 401);
    const body = (await res.json()) as { error: string };
    assert.deepEqual(body, { error: "Unauthorized" });
  });

  test("4. Signup again with the same email in different letter case returns 409", async () => {
    const email = randomEmail();
    const ip = nextIp();

    const firstRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": ip,
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        name: "Case Test User",
        password: "password123",
      }),
    });
    assert.equal(firstRes.status, 201);

    const secondRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": nextIp(),
      },
      body: JSON.stringify({
        email: email.toUpperCase(),
        name: "Case Test User 2",
        password: "password123",
      }),
    });

    assert.equal(secondRes.status, 409);
    const body = (await secondRes.json()) as { error: string };
    assert.deepEqual(body, { error: "An account with this email already exists" });
  });

  test("5. Login with a wrong password and login with a nonexistent email return the identical 401 body", async () => {
    const email = randomEmail();
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": nextIp(),
      },
      body: JSON.stringify({
        email,
        name: "Auth Test User",
        password: "correctpassword",
      }),
    });
    assert.equal(signupRes.status, 201);

    // Wrong password for existing user
    const wrongPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": nextIp(),
      },
      body: JSON.stringify({
        email,
        password: "wrongpassword",
      }),
    });
    assert.equal(wrongPassRes.status, 401);
    const wrongPassBody = await wrongPassRes.json();

    // Nonexistent user
    const nonExistentRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": nextIp(),
      },
      body: JSON.stringify({
        email: randomEmail(),
        password: "anypassword",
      }),
    });
    assert.equal(nonExistentRes.status, 401);
    const nonExistentBody = await nonExistentRes.json();

    assert.deepEqual(wrongPassBody, { error: "Invalid email or password" });
    assert.deepEqual(wrongPassBody, nonExistentBody);
  });

  test("6. Password of 7 characters returns 400", async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": nextIp(),
      },
      body: JSON.stringify({
        email: randomEmail(),
        name: "Short Password User",
        password: "1234567", // 7 chars (below min 8)
      }),
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: string; fields: Array<{ path: string; message: string }> };
    assert.equal(body.error, "Validation failed");
    assert.ok(Array.isArray(body.fields));
    assert.ok(body.fields.some((f) => f.path === "password"));
  });

  test("7. Logout returns 200 and the Set-Cookie header expires rr_session. A following /me with the old cookie value still returns 200 (stateless JWT)", async () => {
    const email = randomEmail();
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": nextIp(),
      },
      body: JSON.stringify({
        email,
        name: "Logout User",
        password: "password123",
      }),
    });
    assert.equal(signupRes.status, 201);
    const setCookie = signupRes.headers.get("set-cookie") || "";
    const cookieMatch = setCookie.match(/rr_session=([^;]+)/);
    assert.ok(cookieMatch);
    const cookieVal = cookieMatch[1];

    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: `rr_session=${cookieVal}`,
        "X-Forwarded-For": nextIp(),
      },
    });
    assert.equal(logoutRes.status, 200);
    const logoutBody = await logoutRes.json();
    assert.deepEqual(logoutBody, { ok: true });

    const logoutSetCookie = logoutRes.headers.get("set-cookie") || "";
    assert.match(logoutSetCookie, /rr_session=/);
    assert.ok(
      /Max-Age=0/i.test(logoutSetCookie) || /Expires=Thu, 01 Jan 1970/i.test(logoutSetCookie),
      "Logout Set-Cookie header must expire the session cookie"
    );

    // Stateless JWT: a token remains cryptographically valid until its expiration time even after logout
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: `rr_session=${cookieVal}`,
        "X-Forwarded-For": nextIp(),
      },
    });
    assert.equal(meRes.status, 200);
  });

  test("8. After more than 10 login attempts from one IP within the window, the next one returns 429", async () => {
    const spamIp = "10.88.88.88";
    const email = randomEmail();

    // Perform 10 failed login attempts from the same IP
    for (let i = 0; i < 10; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": spamIp,
        },
        body: JSON.stringify({
          email,
          password: "wrongpassword",
        }),
      });
      assert.equal(res.status, 401);
    }

    // 11th request from the same IP must be rate limited
    const limitedRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": spamIp,
      },
      body: JSON.stringify({
        email,
        password: "wrongpassword",
      }),
    });

    assert.equal(limitedRes.status, 429);
    const body = await limitedRes.json();
    assert.deepEqual(body, { error: "Too many attempts, please try again later" });
  });

  test("9. A POST with an Origin header that does not match CLIENT_ORIGIN returns 403", async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://malicious-site.example",
        "X-Forwarded-For": nextIp(),
      },
      body: JSON.stringify({
        email: randomEmail(),
        name: "Forbidden User",
        password: "password123",
      }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.deepEqual(body, { error: "Forbidden" });
  });
});
