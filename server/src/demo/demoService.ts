import crypto from "crypto";
import bcrypt from "bcryptjs";
import { pool, query } from "../db";
import {
  DEMO_EMAIL_DOMAIN,
  DEMO_TTL_HOURS,
  MAX_LIVE_DEMO_ACCOUNTS,
} from "./constants";
import { SAMPLE_CONTENT, SAMPLE_RESUME_TITLE } from "./sampleContent";

export class DemoBusyError extends Error {
  constructor(
    message = "The demo is busy right now. Please try again later or sign up."
  ) {
    super(message);
    this.name = "DemoBusyError";
  }
}

export async function cleanupExpiredDemos(): Promise<number> {
  const cutoff = new Date(Date.now() - DEMO_TTL_HOURS * 3600 * 1000);
  const result = await query(
    "DELETE FROM users WHERE is_demo = true AND created_at < $1",
    [cutoff]
  );
  return result.rowCount ?? 0;
}

export async function createDemoAccount(
  maxLive: number = MAX_LIVE_DEMO_ACCOUNTS
): Promise<{
  user: { id: string; email: string; name: string; isDemo: true };
  resumeId: string;
}> {
  await cleanupExpiredDemos();

  const countRes = await query<{ count: string | number }>(
    "SELECT count(*)::int as count FROM users WHERE is_demo = true"
  );
  const liveCount = Number(countRes.rows[0]?.count ?? 0);
  if (liveCount >= maxLive) {
    throw new DemoBusyError();
  }

  const randomHex = crypto.randomBytes(6).toString("hex");
  const email = `demo-${randomHex}@${DEMO_EMAIL_DOMAIN}`;
  const name = "Demo Visitor";
  const secret = crypto.randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(secret, 4);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userRes = await client.query<{
      id: string;
      email: string;
      name: string;
    }>(
      "INSERT INTO users (email, name, password_hash, is_demo) VALUES ($1, $2, $3, true) RETURNING id, email, name",
      [email, name, passwordHash]
    );
    const user = userRes.rows[0];

    const resumeRes = await client.query<{ id: string }>(
      "INSERT INTO resumes (user_id, title, content) VALUES ($1, $2, $3) RETURNING id",
      [user.id, SAMPLE_RESUME_TITLE, JSON.stringify(SAMPLE_CONTENT)]
    );
    const resumeId = resumeRes.rows[0].id;

    await client.query("COMMIT");

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isDemo: true,
      },
      resumeId,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
