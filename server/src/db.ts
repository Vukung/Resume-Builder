import { Pool, QueryResult, QueryResultRow } from "pg";
import { config } from "./config";

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle database client:", err.message);
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}
