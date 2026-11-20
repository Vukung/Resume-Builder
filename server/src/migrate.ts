import fs from "fs";
import path from "path";
import { pool, query } from "./db";

async function migrate(): Promise<void> {
  // Ensure schema_migrations table exists
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // Read migration files
  const migrationsDir = path.resolve(__dirname, "..", "migrations");

  if (!fs.existsSync(migrationsDir)) {
    console.log("No migrations directory found. Nothing to do.");
    await pool.end();
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found. Nothing to do.");
    await pool.end();
    return;
  }

  // Get already applied migrations
  const applied = await query<{ filename: string }>(
    "SELECT filename FROM schema_migrations ORDER BY filename"
  );
  const appliedSet = new Set(applied.rows.map((r) => r.filename));

  let appliedCount = 0;

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`Already applied: ${file}`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [file]
      );
      await client.query("COMMIT");
      console.log(`Applied: ${file}`);
      appliedCount++;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(
        `Failed to apply ${file}:`,
        err instanceof Error ? err.message : "Unknown error"
      );
      await pool.end();
      process.exit(1);
    } finally {
      client.release();
    }
  }

  if (appliedCount === 0) {
    console.log("All migrations already applied. Nothing to do.");
  } else {
    console.log(`Applied ${appliedCount} migration(s).`);
  }

  await pool.end();
}

migrate().catch((err: unknown) => {
  console.error(
    "Migration failed:",
    err instanceof Error ? err.message : String(err)
  );
  process.exit(1);
});
