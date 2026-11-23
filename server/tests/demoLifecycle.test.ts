import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { Server } from "node:http";
import {
  startTestServer,
  cleanupTestUsers,
  nextIp,
  randomEmail,
} from "./helpers";
import { query } from "../src/db";
import { SAMPLE_CONTENT } from "../src/demo/sampleContent";
import { resumeContentSchema } from "../src/schemas/resumeContent";
import { createDemoAccount, DemoBusyError } from "../src/demo/demoService";
import { setDemoCap } from "../src/routes/auth";

describe("Phase 7a: Demo Accounts - Lifecycle & Schema", () => {
  let server: Server;
  let baseUrl: string;
  const createdUserIds: string[] = [];

  before(async () => {
    const started = await startTestServer();
    server = started.server;
    baseUrl = started.baseUrl;
  });

  after(async () => {
    setDemoCap(null);
    await cleanupTestUsers(server, createdUserIds);
  });

  test("7. Expiry: set a demo user created_at to 25 hours ago, then GET /me returns 401 and user row is gone", async () => {
    const demoRes = await fetch(`${baseUrl}/api/auth/demo`, {
      method: "POST",
      headers: { "X-Forwarded-For": nextIp() },
    });
    const { user } = (await demoRes.json()) as any;
    createdUserIds.push(user.id);
    const cookie = (demoRes.headers.get("set-cookie") || "").match(/rr_session=([^;]+)/)![1];

    const expiredDate = new Date(Date.now() - 25 * 3600 * 1000);
    await query("UPDATE users SET created_at = $1 WHERE id = $2", [expiredDate, user.id]);

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: `rr_session=${cookie}`,
        "X-Forwarded-For": nextIp(),
      },
    });
    assert.equal(meRes.status, 401);
    const checkDb = await query("SELECT id FROM users WHERE id = $1", [user.id]);
    assert.equal(checkDb.rows.length, 0);
  });

  test("8. Cleanup: with one fresh and one expired demo user, createDemoAccount deletes expired user/resume and keeps fresh one", async () => {
    const expiredAcc = await createDemoAccount();
    const freshAcc = await createDemoAccount();
    createdUserIds.push(expiredAcc.user.id, freshAcc.user.id);

    const expiredDate = new Date(Date.now() - 25 * 3600 * 1000);
    await query("UPDATE users SET created_at = $1 WHERE id = $2", [expiredDate, expiredAcc.user.id]);

    const thirdAcc = await createDemoAccount();
    createdUserIds.push(thirdAcc.user.id);

    const expiredCheck = await query("SELECT id FROM users WHERE id = $1", [expiredAcc.user.id]);
    assert.equal(expiredCheck.rows.length, 0);
    const expiredResume = await query("SELECT id FROM resumes WHERE id = $1", [expiredAcc.resumeId]);
    assert.equal(expiredResume.rows.length, 0);

    const freshCheck = await query("SELECT id FROM users WHERE id = $1", [freshAcc.user.id]);
    assert.equal(freshCheck.rows.length, 1);
  });

  test("9. Cap: createDemoAccount with maxLive equal to current live count throws DemoBusyError, and route maps to 503", async () => {
    const countRes = await query<{ count: number }>("SELECT count(*)::int as count FROM users WHERE is_demo = true");
    const liveCount = countRes.rows[0].count;

    await assert.rejects(
      async () => {
        await createDemoAccount(liveCount);
      },
      (err: any) => err instanceof DemoBusyError
    );

    setDemoCap(liveCount);
    const res = await fetch(`${baseUrl}/api/auth/demo`, {
      method: "POST",
      headers: { "X-Forwarded-For": nextIp() },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.deepEqual(body, { error: "The demo is busy right now. Please try again later or sign up." });
    setDemoCap(null);
  });

  test("10. SAMPLE_CONTENT passes strict content schema and every section is non-empty", () => {
    const parsed = resumeContentSchema.parse(SAMPLE_CONTENT);
    assert.equal(parsed.schemaVersion, 1);
    assert.ok(parsed.basics.fullName.length > 0);
    assert.ok(parsed.basics.email.length > 0);
    assert.ok(parsed.basics.phone.length > 0);
    assert.ok(parsed.basics.location.length > 0);
    assert.ok(parsed.basics.links.length > 0);
    assert.ok(parsed.summary.length > 0);
    assert.ok(parsed.education.length > 0);
    assert.ok(parsed.skills.length > 0);
    assert.ok(parsed.experience.length > 0);
    assert.ok(parsed.projects.length > 0);
    assert.ok(parsed.certifications.length > 0);
  });

  test("11. Normal signup and login still return isDemo false", async () => {
    const email = randomEmail();
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": nextIp() },
      body: JSON.stringify({ email, name: "Regular User", password: "password123" }),
    });
    assert.equal(signupRes.status, 201);
    const signupBody = (await signupRes.json()) as any;
    createdUserIds.push(signupBody.user.id);
    assert.equal(signupBody.user.isDemo, false);

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": nextIp() },
      body: JSON.stringify({ email, password: "password123" }),
    });
    assert.equal(loginRes.status, 200);
    const loginBody = (await loginRes.json()) as any;
    assert.equal(loginBody.user.isDemo, false);
  });
});
