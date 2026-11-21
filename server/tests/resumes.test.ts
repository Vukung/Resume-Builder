import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { Server } from "node:http";
import crypto from "node:crypto";
import { query } from "../src/db";
import {
  startTestServer,
  cleanupTestUsers,
  signupUser,
  authenticatedFetch,
  nextIp,
  randomEmail,
  TestUser,
} from "./helpers";
import { ResumeContent, emptyContent } from "../src/schemas/resumeContent";

describe("Phase 3: Resumes API", () => {
  let server: Server;
  let baseUrl: string;
  let userA: TestUser;
  let userB: TestUser;
  const createdUserIds: string[] = [];

  before(async () => {
    const started = await startTestServer();
    server = started.server;
    baseUrl = started.baseUrl;

    userA = await signupUser(baseUrl, { name: "User Alpha" });
    userB = await signupUser(baseUrl, { name: "User Beta" });
    createdUserIds.push(userA.id, userB.id);
  });

  after(async () => {
    await cleanupTestUsers(server, createdUserIds);
  });

  test("1. Every route returns 401 without a cookie", async () => {
    const fakeId = crypto.randomUUID();
    const routes: Array<{ method: string; path: string; body?: any }> = [
      { method: "GET", path: "/api/resumes" },
      { method: "POST", path: "/api/resumes", body: { title: "Test" } },
      { method: "GET", path: `/api/resumes/${fakeId}` },
      { method: "PATCH", path: `/api/resumes/${fakeId}`, body: { title: "Test" } },
      { method: "PUT", path: `/api/resumes/${fakeId}/content`, body: {} },
      { method: "POST", path: `/api/resumes/${fakeId}/duplicate` },
      { method: "DELETE", path: `/api/resumes/${fakeId}` },
    ];

    for (const r of routes) {
      const res = await fetch(`${baseUrl}${r.path}`, {
        method: r.method,
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": nextIp(),
        },
        body: r.body ? JSON.stringify(r.body) : undefined,
      });

      assert.equal(res.status, 401, `Route ${r.method} ${r.path} must return 401 without cookie`);
      const data = await res.json();
      assert.deepEqual(data, { error: "Unauthorized" });
    }
  });

  test("2. Create returns 201 with schemaVersion 1, basics prefilled from the account, and all lists empty", async () => {
    const res = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My First Resume" }),
    });

    assert.equal(res.status, 201);
    const data = (await res.json()) as { resume: any };
    const r = data.resume;

    assert.ok(r.id);
    assert.equal(r.title, "My First Resume");
    assert.ok(r.createdAt);
    assert.ok(r.updatedAt);

    const c: ResumeContent = r.content;
    assert.equal(c.schemaVersion, 1);
    assert.equal(c.basics.fullName, userA.name);
    assert.equal(c.basics.email, userA.email);
    assert.equal(c.basics.phone, "");
    assert.equal(c.basics.location, "");
    assert.deepEqual(c.basics.links, []);
    assert.equal(c.summary, "");
    assert.deepEqual(c.education, []);
    assert.deepEqual(c.experience, []);
    assert.deepEqual(c.projects, []);
    assert.deepEqual(c.certifications, []);
    assert.deepEqual(c.skills, []);
  });

  test("3. List returns only the caller's resumes and no content field. B never sees A's", async () => {
    // Create resume for user A
    const resA = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "A's Private Resume" }),
    });
    assert.equal(resA.status, 201);
    const resumeA = (await resA.json()).resume;

    // List user B's resumes
    const listResB = await authenticatedFetch(baseUrl, "/api/resumes", userB.cookie);
    assert.equal(listResB.status, 200);
    const listB = (await listResB.json()).resumes as any[];

    // Ensure user B does not see user A's resume
    const foundAInB = listB.some((r) => r.id === resumeA.id);
    assert.equal(foundAInB, false, "User B must not see User A's resumes");

    // List user A's resumes
    const listResA = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie);
    assert.equal(listResA.status, 200);
    const listA = (await listResA.json()).resumes as any[];

    const foundA = listA.find((r) => r.id === resumeA.id);
    assert.ok(foundA);
    assert.equal(foundA.title, "A's Private Resume");
    assert.ok(foundA.createdAt);
    assert.ok(foundA.updatedAt);

    // Verify NO content field in list responses
    for (const item of listA) {
      assert.equal("content" in item, false, "List items must not contain content field");
    }
  });

  test("4. GET another user's resume, a random valid UUID, and the string 'not-a-uuid' all return 404 with identical bodies", async () => {
    // Create resume under A
    const resA = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Confidential A" }),
    });
    const resumeA = (await resA.json()).resume;

    // B tries to GET A's resume
    const resForeign = await authenticatedFetch(baseUrl, `/api/resumes/${resumeA.id}`, userB.cookie);
    assert.equal(resForeign.status, 404);
    const bodyForeign = await resForeign.json();

    // Random valid UUID
    const randomUuid = crypto.randomUUID();
    const resRandomUuid = await authenticatedFetch(baseUrl, `/api/resumes/${randomUuid}`, userA.cookie);
    assert.equal(resRandomUuid.status, 404);
    const bodyRandomUuid = await resRandomUuid.json();

    // Not-a-uuid string
    const resNotUuid = await authenticatedFetch(baseUrl, "/api/resumes/not-a-uuid", userA.cookie);
    assert.equal(resNotUuid.status, 404);
    const bodyNotUuid = await resNotUuid.json();

    assert.deepEqual(bodyForeign, { error: "Not found" });
    assert.deepEqual(bodyForeign, bodyRandomUuid);
    assert.deepEqual(bodyForeign, bodyNotUuid);
  });

  test("5. PATCH, PUT content, DELETE and duplicate on another user's resume all return 404, and afterward A's resume is completely unchanged", async () => {
    // Create resume under A
    const createRes = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Protected Resume" }),
    });
    const original = (await createRes.json()).resume;

    // User B attempts PATCH
    const patchRes = await authenticatedFetch(baseUrl, `/api/resumes/${original.id}`, userB.cookie, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Hacked Title" }),
    });
    assert.equal(patchRes.status, 404);
    assert.deepEqual(await patchRes.json(), { error: "Not found" });

    // User B attempts PUT content
    const putRes = await authenticatedFetch(baseUrl, `/api/resumes/${original.id}/content`, userB.cookie, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schemaVersion: 1,
        basics: { fullName: "Hacker", email: "hacker@evil.com", phone: "", location: "", links: [] },
        summary: "Overwritten",
        education: [],
        experience: [],
        projects: [],
        certifications: [],
      }),
    });
    assert.equal(putRes.status, 404);
    assert.deepEqual(await putRes.json(), { error: "Not found" });

    // User B attempts duplicate
    const dupRes = await authenticatedFetch(baseUrl, `/api/resumes/${original.id}/duplicate`, userB.cookie, {
      method: "POST",
    });
    assert.equal(dupRes.status, 404);
    assert.deepEqual(await dupRes.json(), { error: "Not found" });

    // User B attempts DELETE
    const delRes = await authenticatedFetch(baseUrl, `/api/resumes/${original.id}`, userB.cookie, {
      method: "DELETE",
    });
    assert.equal(delRes.status, 404);
    assert.deepEqual(await delRes.json(), { error: "Not found" });

    // User A fetches their resume: must be completely unchanged
    const verifyRes = await authenticatedFetch(baseUrl, `/api/resumes/${original.id}`, userA.cookie);
    assert.equal(verifyRes.status, 200);
    const current = (await verifyRes.json()).resume;

    assert.equal(current.title, original.title);
    assert.deepEqual(current.content, original.content);
    assert.equal(current.createdAt, original.createdAt);
    assert.equal(current.updatedAt, original.updatedAt);
  });

  test("6. Rename works. An empty title and a 101-character title return 400", async () => {
    const createRes = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Old Title" }),
    });
    const resume = (await createRes.json()).resume;

    // Successful rename
    const renameRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}`, userA.cookie, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Valid Title" }),
    });
    assert.equal(renameRes.status, 200);
    const renamed = (await renameRes.json()).resume;
    assert.equal(renamed.title, "New Valid Title");
    assert.equal(renamed.id, resume.id);
    assert.equal("content" in renamed, false);

    // Empty title (or whitespace only) returns 400
    const emptyRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}`, userA.cookie, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "   " }),
    });
    assert.equal(emptyRes.status, 400);
    const emptyBody = await emptyRes.json();
    assert.equal(emptyBody.error, "Validation failed");
    assert.ok(emptyBody.fields.some((f: any) => f.path === "title"));

    // 101-character title returns 400
    const longTitle = "a".repeat(101);
    const longRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}`, userA.cookie, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: longTitle }),
    });
    assert.equal(longRes.status, 400);
    const longBody = await longRes.json();
    assert.equal(longBody.error, "Validation failed");
    assert.ok(longBody.fields.some((f: any) => f.path === "title"));
  });

  test("7. A valid full content object saves, GET returns it exactly, and updatedAt moves forward", async () => {
    const createRes = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Full Content Resume" }),
    });
    const resume = (await createRes.json()).resume;
    const initialUpdatedAt = new Date(resume.updatedAt).getTime();

    // Small delay to ensure timestamp advances
    await new Promise((r) => setTimeout(r, 100));

    const fullContent: ResumeContent = {
      schemaVersion: 1,
      basics: {
        fullName: "Jane Doe",
        email: "jane.doe@example.com",
        phone: "+1-555-0199",
        location: "San Francisco, CA",
        links: [
          { label: "GitHub", url: "https://github.com/janedoe" },
          { label: "Portfolio", url: "https://janedoe.dev" },
        ],
      },
      summary: "Experienced software engineer with expertise in distributed backend systems.",
      education: [
        {
          id: "edu-1",
          institution: "University of Tech",
          degree: "B.S. in Computer Science",
          startDate: "2018-09",
          endDate: "2022-05",
          gradeType: "cgpa",
          gradeValue: 3.85,
        },
      ],
      experience: [
        {
          id: "exp-1",
          jobTitle: "Senior Software Engineer",
          company: "Cloud Corp",
          startDate: "2022-06",
          endDate: "",
          isCurrent: true,
          bullets: [
            "Architected scalable microservices using Node.js and PostgreSQL.",
            "Reduced query latencies by 45% with indexing strategies.",
          ],
        },
      ],
      projects: [
        {
          id: "proj-1",
          name: "Resume Rocket",
          techStack: ["TypeScript", "Express", "PostgreSQL"],
          link: "https://github.com/janedoe/resume-rocket",
          bullets: ["Built real-time resume editor with side-by-side preview."],
        },
      ],
      certifications: [
        {
          id: "cert-1",
          name: "AWS Certified Solutions Architect",
          issuer: "Amazon Web Services",
        },
      ],
      skills: [],
    };

    const putRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}/content`, userA.cookie, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullContent),
    });

    assert.equal(putRes.status, 200);
    const putBody = (await putRes.json()) as { updatedAt: string };
    const newUpdatedAt = new Date(putBody.updatedAt).getTime();
    assert.ok(newUpdatedAt > initialUpdatedAt, "updatedAt must move forward");

    // GET and assert exact match
    const getRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}`, userA.cookie);
    assert.equal(getRes.status, 200);
    const fetched = (await getRes.json()).resume;
    assert.deepEqual(fetched.content, fullContent);
  });

  test("8. Invalid content returns 400 for each of: an unknown top-level key, an unknown key inside an item, date '2024-13', gradeType 'other', cgpa gradeValue 11, duplicate ids in one list, 16 bullets, schemaVersion 2, a summary over 2000 characters, a non-http link", async () => {
    const createRes = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Validation Test" }),
    });
    const resume = (await createRes.json()).resume;

    const baseValid: ResumeContent = {
      schemaVersion: 1,
      basics: { fullName: "A", email: "a@b.com", phone: "", location: "", links: [] },
      summary: "Summary",
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      skills: [],
    };

    const cases: Array<{ label: string; payload: any }> = [
      {
        label: "unknown top-level key",
        payload: { ...baseValid, extraKey: "not allowed" },
      },
      {
        label: "unknown key inside an item",
        payload: {
          ...baseValid,
          education: [
            {
              id: "e1",
              institution: "Uni",
              degree: "BS",
              startDate: "2020-01",
              endDate: "2024-01",
              gradeType: "percentage",
              gradeValue: null,
              unexpectedProp: true,
            },
          ],
        },
      },
      {
        label: "date '2024-13'",
        payload: {
          ...baseValid,
          education: [
            {
              id: "e1",
              institution: "Uni",
              degree: "BS",
              startDate: "2024-13",
              endDate: "",
              gradeType: "percentage",
              gradeValue: null,
            },
          ],
        },
      },
      {
        label: "gradeType 'other'",
        payload: {
          ...baseValid,
          education: [
            {
              id: "e1",
              institution: "Uni",
              degree: "BS",
              startDate: "",
              endDate: "",
              gradeType: "other",
              gradeValue: null,
            },
          ],
        },
      },
      {
        label: "cgpa gradeValue 11",
        payload: {
          ...baseValid,
          education: [
            {
              id: "e1",
              institution: "Uni",
              degree: "BS",
              startDate: "",
              endDate: "",
              gradeType: "cgpa",
              gradeValue: 11,
            },
          ],
        },
      },
      {
        label: "duplicate ids in one list",
        payload: {
          ...baseValid,
          education: [
            { id: "same-id", institution: "U1", degree: "D1", startDate: "", endDate: "", gradeType: "percentage", gradeValue: null },
            { id: "same-id", institution: "U2", degree: "D2", startDate: "", endDate: "", gradeType: "percentage", gradeValue: null },
          ],
        },
      },
      {
        label: "16 bullets",
        payload: {
          ...baseValid,
          experience: [
            {
              id: "exp1",
              jobTitle: "Dev",
              company: "Co",
              startDate: "",
              endDate: "",
              isCurrent: false,
              bullets: Array(16).fill("bullet"),
            },
          ],
        },
      },
      {
        label: "schemaVersion 2",
        payload: { ...baseValid, schemaVersion: 2 },
      },
      {
        label: "a summary over 2000 characters",
        payload: { ...baseValid, summary: "x".repeat(2001) },
      },
      {
        label: "a non-http link",
        payload: {
          ...baseValid,
          basics: {
            ...baseValid.basics,
            links: [{ label: "Bad Link", url: "ftp://example.com" }],
          },
        },
      },
    ];

    for (const c of cases) {
      const res = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}/content`, userA.cookie, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c.payload),
      });

      assert.equal(res.status, 400, `Case '${c.label}' must return 400`);
      const body = await res.json();
      assert.equal(body.error, "Validation failed", `Case '${c.label}' must have error: Validation failed`);
      assert.ok(Array.isArray(body.fields), `Case '${c.label}' must return fields array`);
    }
  });

  test("9. Content with empty-string dates, empty lists and null gradeValue is accepted", async () => {
    const createRes = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Partial Autosave" }),
    });
    const resume = (await createRes.json()).resume;

    const partialContent: ResumeContent = {
      schemaVersion: 1,
      basics: {
        fullName: "",
        email: "",
        phone: "",
        location: "",
        links: [],
      },
      summary: "",
      education: [
        {
          id: "edu-partial",
          institution: "College",
          degree: "",
          startDate: "",
          endDate: "",
          gradeType: "percentage",
          gradeValue: null,
        },
      ],
      experience: [],
      projects: [],
      certifications: [],
      skills: [],
    };

    const putRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}/content`, userA.cookie, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partialContent),
    });

    assert.equal(putRes.status, 200);
    const putBody = await putRes.json();
    assert.ok(putBody.updatedAt);
  });

  test("10. Duplicate copies title with ' (Copy)' and content into a separate row, and editing the copy does not change the original", async () => {
    const createRes = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Senior Developer" }),
    });
    const original = (await createRes.json()).resume;

    const originalContent: ResumeContent = {
      schemaVersion: 1,
      basics: { fullName: "Orig Name", email: "orig@example.com", phone: "", location: "", links: [] },
      summary: "Original summary",
      education: [],
      experience: [
        {
          id: "exp-1",
          jobTitle: "Lead Dev",
          company: "Corp",
          startDate: "2020-01",
          endDate: "2023-01",
          isCurrent: false,
          bullets: ["Original bullet"],
        },
      ],
      projects: [],
      certifications: [],
      skills: [],
    };

    await authenticatedFetch(baseUrl, `/api/resumes/${original.id}/content`, userA.cookie, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(originalContent),
    });

    // Duplicate original
    const dupRes = await authenticatedFetch(baseUrl, `/api/resumes/${original.id}/duplicate`, userA.cookie, {
      method: "POST",
    });
    assert.equal(dupRes.status, 201);
    const copy = (await dupRes.json()).resume;

    assert.notEqual(copy.id, original.id);
    assert.equal(copy.title, "Senior Developer (Copy)");
    assert.deepEqual(copy.content, originalContent);

    // Edit the copy's title and content
    await authenticatedFetch(baseUrl, `/api/resumes/${copy.id}`, userA.cookie, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Lead Architect" }),
    });

    const newCopyContent = {
      ...originalContent,
      summary: "Completely new copy summary",
    };
    await authenticatedFetch(baseUrl, `/api/resumes/${copy.id}/content`, userA.cookie, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCopyContent),
    });

    // Check that original resume is completely unchanged
    const originalRefetched = await authenticatedFetch(baseUrl, `/api/resumes/${original.id}`, userA.cookie);
    assert.equal(originalRefetched.status, 200);
    const origData = (await originalRefetched.json()).resume;

    assert.equal(origData.title, "Senior Developer");
    assert.equal(origData.content.summary, "Original summary");
  });

  test("11. Soft delete: DELETE returns 200, then GET, PUT content, PATCH and duplicate on it return 404, the list excludes it, a second DELETE returns 404, and the row still exists in the database with is_deleted true", async () => {
    const createRes = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Delete Me" }),
    });
    const resume = (await createRes.json()).resume;

    // DELETE returns 200
    const delRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}`, userA.cookie, {
      method: "DELETE",
    });
    assert.equal(delRes.status, 200);
    assert.deepEqual(await delRes.json(), { ok: true });

    // GET on deleted returns 404
    const getRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}`, userA.cookie);
    assert.equal(getRes.status, 404);

    // PUT content on deleted returns 404
    const putRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}/content`, userA.cookie, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schemaVersion: 1,
        basics: { fullName: "A", email: "", phone: "", location: "", links: [] },
        summary: "",
        education: [],
        experience: [],
        projects: [],
        certifications: [],
      }),
    });
    assert.equal(putRes.status, 404);

    // PATCH on deleted returns 404
    const patchRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}`, userA.cookie, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Cannot Rename" }),
    });
    assert.equal(patchRes.status, 404);

    // Duplicate on deleted returns 404
    const dupRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}/duplicate`, userA.cookie, {
      method: "POST",
    });
    assert.equal(dupRes.status, 404);

    // List excludes deleted resume
    const listRes = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie);
    const list = (await listRes.json()).resumes as any[];
    assert.equal(list.some((r) => r.id === resume.id), false);

    // Second DELETE returns 404
    const delRes2 = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}`, userA.cookie, {
      method: "DELETE",
    });
    assert.equal(delRes2.status, 404);

    // Direct database query confirms row still exists with is_deleted = true
    const dbCheck = await query<{ is_deleted: boolean }>(
      "SELECT is_deleted FROM resumes WHERE id = $1",
      [resume.id]
    );
    assert.equal(dbCheck.rows.length, 1);
    assert.equal(dbCheck.rows[0].is_deleted, true);
  });

  test("12. Search is case insensitive. With titles '100% match' and 'abc', q=% returns only '100% match', and q=_ returns neither", async () => {
    // Fresh user for clean search testing
    const searchUser = await signupUser(baseUrl, { name: "Search User" });
    createdUserIds.push(searchUser.id);

    await authenticatedFetch(baseUrl, "/api/resumes", searchUser.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "100% match" }),
    });

    await authenticatedFetch(baseUrl, "/api/resumes", searchUser.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "abc" }),
    });

    // Search with q=%: should match only "100% match"
    const resPercent = await authenticatedFetch(baseUrl, "/api/resumes?q=%25", searchUser.cookie);
    assert.equal(resPercent.status, 200);
    const listPercent = (await resPercent.json()).resumes as any[];
    assert.equal(listPercent.length, 1);
    assert.equal(listPercent[0].title, "100% match");

    // Search with q=_: should match neither
    const resUnderscore = await authenticatedFetch(baseUrl, "/api/resumes?q=_", searchUser.cookie);
    assert.equal(resUnderscore.status, 200);
    const listUnderscore = (await resUnderscore.json()).resumes as any[];
    assert.equal(listUnderscore.length, 0);

    // Search case insensitive: q=MATCH matches "100% match"
    const resCase = await authenticatedFetch(baseUrl, "/api/resumes?q=MATCH", searchUser.cookie);
    assert.equal(resCase.status, 200);
    const listCase = (await resCase.json()).resumes as any[];
    assert.equal(listCase.length, 1);
    assert.equal(listCase[0].title, "100% match");
  });

  test("13. A fresh user can create 20 resumes and the 21st returns 409. Duplicate also returns 409 at the limit", async () => {
    const quotaUser = await signupUser(baseUrl, { name: "Quota User" });
    createdUserIds.push(quotaUser.id);
    let lastResumeId = "";

    // Create 20 resumes
    for (let i = 1; i <= 20; i++) {
      const res = await authenticatedFetch(baseUrl, "/api/resumes", quotaUser.cookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Resume #${i}` }),
      });
      assert.equal(res.status, 201, `Resume #${i} must be created with 201`);
      const body = await res.json();
      lastResumeId = body.resume.id;
    }

    // 21st create returns 409
    const res21 = await authenticatedFetch(baseUrl, "/api/resumes", quotaUser.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Resume #21" }),
    });
    assert.equal(res21.status, 409);
    const body21 = await res21.json();
    assert.deepEqual(body21, { error: "Resume limit reached" });

    // Duplicate at the 20 limit also returns 409
    const dupRes = await authenticatedFetch(baseUrl, `/api/resumes/${lastResumeId}/duplicate`, quotaUser.cookie, {
      method: "POST",
    });
    assert.equal(dupRes.status, 409);
    const dupBody = await dupRes.json();
    assert.deepEqual(dupBody, { error: "Resume limit reached" });
  });

  test("14. Malformed JSON returns 400 {'error':'Invalid JSON'}, and an oversized body returns 413", async () => {
    // Malformed JSON
    const malformedRes = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"title": "broken json...',
    });
    assert.equal(malformedRes.status, 400);
    const malformedBody = await malformedRes.json();
    assert.deepEqual(malformedBody, { error: "Invalid JSON" });

    // Oversized body (> 200kb limit)
    const largePayload = JSON.stringify({
      title: "Oversized",
      oversizedData: "x".repeat(210 * 1024),
    });
    const oversizedRes = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: largePayload,
    });
    assert.equal(oversizedRes.status, 413);
    const oversizedBody = await oversizedRes.json();
    assert.deepEqual(oversizedBody, { error: "Payload too large" });
  });

  test("15. A POST /api/resumes with an Origin header that does not match CLIENT_ORIGIN returns 403", async () => {
    const res = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://malicious-origin.com",
      },
      body: JSON.stringify({ title: "Forbidden Resume" }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.deepEqual(body, { error: "Forbidden" });
  });

  test("16. Content with a valid skills list saves, and GET returns it exactly", async () => {
    const createRes = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Skills Test" }),
    });
    const resume = (await createRes.json()).resume;

    const contentWithSkills = {
      ...emptyContent(userA),
      skills: [
        {
          id: "skill-group-1",
          category: "Programming Languages",
          items: ["TypeScript", "Python", "Go"],
        },
        {
          id: "skill-group-2",
          category: "Frameworks & Libraries",
          items: ["React", "Express", "Next.js"],
        },
      ],
    };

    const putRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}/content`, userA.cookie, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contentWithSkills),
    });
    assert.equal(putRes.status, 200);

    const getRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}`, userA.cookie);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.deepEqual(getBody.resume.content, contentWithSkills);
  });

  test("17. A PUT body with no skills key is accepted, and the following GET shows skills as an empty array", async () => {
    const createRes = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "No Skills Key Test" }),
    });
    const resume = (await createRes.json()).resume;

    const contentWithoutSkills: any = {
      schemaVersion: 1,
      basics: { fullName: "A", email: "a@example.com", phone: "", location: "", links: [] },
      summary: "Summary text",
      education: [],
      experience: [],
      projects: [],
      certifications: [],
    };
    assert.equal("skills" in contentWithoutSkills, false);

    const putRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}/content`, userA.cookie, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contentWithoutSkills),
    });
    assert.equal(putRes.status, 200);

    const getRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}`, userA.cookie);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.deepEqual(getBody.resume.content.skills, []);
  });

  test("18. Legacy row without skills key returns normalized skills as [] on GET", async () => {
    const legacyContent = {
      schemaVersion: 1,
      basics: { fullName: "Legacy User", email: "legacy@example.com", phone: "", location: "", links: [] },
      summary: "Legacy summary",
      education: [],
      experience: [],
      projects: [],
      certifications: [],
    };

    const insertResult = await query<{ id: string }>(
      `INSERT INTO resumes (user_id, title, content)
       VALUES ($1, $2, $3::jsonb)
       RETURNING id`,
      [userA.id, "Legacy Resume", JSON.stringify(legacyContent)]
    );
    const legacyId = insertResult.rows[0].id;

    const getRes = await authenticatedFetch(baseUrl, `/api/resumes/${legacyId}`, userA.cookie);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.deepEqual(getBody.resume.content.skills, []);
    assert.equal(getBody.resume.content.summary, "Legacy summary");
  });

  test("19. Invalid skills return 400 for each of: 16 groups, 41 items in one group, item > 40 chars, category > 50 chars, duplicate ids, unknown key inside skills group", async () => {
    const createRes = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Invalid Skills Test" }),
    });
    const resume = (await createRes.json()).resume;

    const baseValid = emptyContent(userA);

    const invalidCases: Array<{ label: string; skills: any }> = [
      {
        label: "16 groups",
        skills: Array.from({ length: 16 }, (_, i) => ({
          id: `group-${i}`,
          category: `Category ${i}`,
          items: ["item"],
        })),
      },
      {
        label: "41 items in one group",
        skills: [
          {
            id: "group-1",
            category: "Languages",
            items: Array(41).fill("item"),
          },
        ],
      },
      {
        label: "an item longer than 40 characters",
        skills: [
          {
            id: "group-1",
            category: "Languages",
            items: ["a".repeat(41)],
          },
        ],
      },
      {
        label: "a category longer than 50 characters",
        skills: [
          {
            id: "group-1",
            category: "c".repeat(51),
            items: ["item"],
          },
        ],
      },
      {
        label: "duplicate ids",
        skills: [
          { id: "duplicate-id", category: "Cat 1", items: ["item1"] },
          { id: "duplicate-id", category: "Cat 2", items: ["item2"] },
        ],
      },
      {
        label: "unknown key inside a skills group",
        skills: [
          {
            id: "group-1",
            category: "Languages",
            items: ["item"],
            unexpectedKey: "bad",
          },
        ],
      },
    ];

    for (const c of invalidCases) {
      const res = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}/content`, userA.cookie, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...baseValid, skills: c.skills }),
      });

      assert.equal(res.status, 400, `Case '${c.label}' must return 400`);
      const body = await res.json();
      assert.equal(body.error, "Validation failed", `Case '${c.label}' error must be 'Validation failed'`);
      assert.ok(Array.isArray(body.fields), `Case '${c.label}' must return fields array`);
    }
  });

  test("20. Duplicating a resume copies its skills", async () => {
    const createRes = await authenticatedFetch(baseUrl, "/api/resumes", userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Original With Skills" }),
    });
    const resume = (await createRes.json()).resume;

    const contentWithSkills = {
      ...emptyContent(userA),
      skills: [
        {
          id: "sk-1",
          category: "Cloud",
          items: ["AWS", "GCP", "Kubernetes"],
        },
      ],
    };

    await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}/content`, userA.cookie, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contentWithSkills),
    });

    const dupRes = await authenticatedFetch(baseUrl, `/api/resumes/${resume.id}/duplicate`, userA.cookie, {
      method: "POST",
    });
    assert.equal(dupRes.status, 201);
    const copy = (await dupRes.json()).resume;

    assert.equal(copy.title, "Original With Skills (Copy)");
    assert.deepEqual(copy.content.skills, contentWithSkills.skills);

    const getCopyRes = await authenticatedFetch(baseUrl, `/api/resumes/${copy.id}`, userA.cookie);
    assert.equal(getCopyRes.status, 200);
    const getCopyBody = await getCopyRes.json();
    assert.deepEqual(getCopyBody.resume.content.skills, contentWithSkills.skills);
  });
});
