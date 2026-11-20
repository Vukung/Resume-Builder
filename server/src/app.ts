import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import { config } from "./config";
import { query } from "./db";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "200kb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/health/db", async (_req: Request, res: Response) => {
  try {
    await query("SELECT 1");
    res.json({ status: "ok", db: true });
  } catch (err) {
    console.error(
      "Database health check failed:",
      err instanceof Error ? err.message : "Unknown error"
    );
    res.status(503).json({ status: "error", db: false });
  }
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err.message);
  if (err.stack) {
    console.error(err.stack);
  }
  res.status(500).json({ error: "Internal server error" });
});

export { app };
