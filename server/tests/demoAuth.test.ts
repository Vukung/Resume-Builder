import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { Server } from "node:http";
import {
  startTestServer,
  cleanupTestUsers,
  nextIp,
  authenticatedFetch,
} from "./helpers";
import { DEMO_EMAIL_DOMAIN } from "../src/demo/constants";
import { SAMPLE_CONTENT, SAMPLE_RESUME_TITLE } from "../src/demo/sampleContent";

describe("Phase 7a: Demo Accounts - Auth and Routes", () => {
  let server: Server;
  let baseUrl: string;
  const createdUserIds: string[] = [];

  before(async () => {
    const started = await startTestServer();
    server = started.server;
    baseUrl = started.baseUrl;
  });

  after(async () => {
    await cleanupTestUsers(server, createdUserIds);
  });

  test("1. POST /api/auth/demo returns 201 with cookie Max-Age 86400, user.isDemo true, demo email, resumeId, and GET /me works", async () => {
    const res = await fetch(`${baseUrl}/api/auth/demo`, {
      method: "POST",
      headers: { "X-Forwarded-For": nextIp() },
    });
    assert.equal(res.status, 201);
    const body = (await res.json()) as {
      user: { id: string; email: string; name: string; isDemo: boolean };
      resumeId: string;
    };
    createdUserIds.push(body.user.id);

    assert.equal(body.user.isDemo, true);
    assert.ok(body.user.email.endsWith(`@${DEMO_EMAIL_DOMAIN}`));
    assert.equal(body.user.name, "Demo Visitor");
    assert.ok(body.resumeId);

    const setCookie = res.headers.get("set-cookie") || "";
    assert.match(setCookie, /rr_session=/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    assert.match(setCookie, /Max-Age=86400/i);

    const cookieMatch = setCookie.match(/rr_session=([^;]+)/);
    assert.ok(cookieMatch);

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: `rr_session=${cookieMatch[1]}`,
        "X-Forwarded-For": nextIp(),
      },
    });
    assert.equal(meRes.status, 200);
    const meBody = (await meRes.json()) as { user: { id: string; email: string; isDemo: boolean } };
    assert.equal(meBody.user.id, body.user.id);
    assert.equal(meBody.user.isDemo, true);
  });

  test("2. Demo user resume list contains exactly one Sample Resume, and GET on it returns SAMPLE_CONTENT", async () => {
    const demoRes = await fetch(`${baseUrl}/api/auth/demo`, {
      method: "POST",
      headers: { "X-Forwarded-For": nextIp() },
    });
    assert.equal(demoRes.status, 201);
    const { user, resumeId } = (await demoRes.json()) as any;
    createdUserIds.push(user.id);
    const cookie = (demoRes.headers.get("set-cookie") || "").match(/rr_session=([^;]+)/)![1];

    const listRes = await authenticatedFetch(baseUrl, "/api/resumes", cookie);
    assert.equal(listRes.status, 200);
    const listBody = (await listRes.json()) as { resumes: any[] };
    assert.equal(listBody.resumes.length, 1);
    assert.equal(listBody.resumes[0].id, resumeId);
    assert.equal(listBody.resumes[0].title, SAMPLE_RESUME_TITLE);

    const getRes = await authenticatedFetch(baseUrl, `/api/resumes/${resumeId}`, cookie);
    assert.equal(getRes.status, 200);
    const getBody = (await getRes.json()) as { resume: any };
    assert.deepEqual(getBody.resume.content, SAMPLE_CONTENT);
  });

  test("3. Two demo accounts are isolated: demo B gets 404 for demo A's resume", async () => {
    const resA = await fetch(`${baseUrl}/api/auth/demo`, {
      method: "POST",
      headers: { "X-Forwarded-For": nextIp() },
    });
    const bodyA = (await resA.json()) as any;
    createdUserIds.push(bodyA.user.id);

    const resB = await fetch(`${baseUrl}/api/auth/demo`, {
      method: "POST",
      headers: { "X-Forwarded-For": nextIp() },
    });
    const bodyB = (await resB.json()) as any;
    createdUserIds.push(bodyB.user.id);
    const cookieB = (resB.headers.get("set-cookie") || "").match(/rr_session=([^;]+)/)![1];

    const getOtherRes = await authenticatedFetch(baseUrl, `/api/resumes/${bodyA.resumeId}`, cookieB);
    assert.equal(getOtherRes.status, 404);
  });

  test("4. Logging in with a demo email and any password returns the generic 401", async () => {
    const demoRes = await fetch(`${baseUrl}/api/auth/demo`, {
      method: "POST",
      headers: { "X-Forwarded-For": nextIp() },
    });
    const { user } = (await demoRes.json()) as any;
    createdUserIds.push(user.id);

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": nextIp() },
      body: JSON.stringify({ email: user.email, password: "anypassword" }),
    });
    assert.equal(loginRes.status, 401);
    const loginBody = await loginRes.json();
    assert.deepEqual(loginBody, { error: "Invalid email or password" });
  });

  test("5. Signup with a demo domain email returns 400", async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": nextIp() },
      body: JSON.stringify({
        email: `someone@${DEMO_EMAIL_DOMAIN}`,
        name: "Test Demo Signer",
        password: "password123",
      }),
    });
    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: string; fields: Array<{ path: string; message: string }> };
    assert.equal(body.error, "Validation failed");
    assert.ok(body.fields.some((f) => f.path === "email"));
  });

  test("6. After more than 5 demo requests from one IP in the window the next returns 429", async () => {
    const testIp = "192.168.199.99";
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${baseUrl}/api/auth/demo`, {
        method: "POST",
        headers: { "X-Forwarded-For": testIp },
      });
      assert.equal(res.status, 201);
      const data = (await res.json()) as any;
      createdUserIds.push(data.user.id);
    }
    const blockedRes = await fetch(`${baseUrl}/api/auth/demo`, {
      method: "POST",
      headers: { "X-Forwarded-For": testIp },
    });
    assert.equal(blockedRes.status, 429);
    const blockedBody = await blockedRes.json();
    assert.deepEqual(blockedBody, {
      error: "Too many demo sessions from your network. Please try again later or sign up.",
    });
  });
});
