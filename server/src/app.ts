import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { query } from "./db";
import { authRouter } from "./routes/auth";
import { resumesRouter } from "./routes/resumes";

const app = express();

if (config.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(
  cors({
    origin: config.CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "200kb" }));

// Origin header check for state-changing HTTP methods
app.use((req: Request, res: Response, next: NextFunction) => {
  const method = req.method.toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const origin = req.headers.origin;
    if (origin && origin !== config.CLIENT_ORIGIN) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }
  next();
});

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

app.use("/api/auth", authRouter);
app.use("/api/resumes", resumesRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (
    err &&
    (err.type === "entity.parse.failed" ||
      ((err as any).status === 400 && "body" in err))
  ) {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  if (
    err &&
    (err.type === "entity.too.large" ||
      (err as any).status === 413 ||
      (err as any).statusCode === 413)
  ) {
    res.status(413).json({ error: "Payload too large" });
    return;
  }

  console.error("Unhandled error:", err.message);
  if (err.stack) {
    console.error(err.stack);
  }
  res.status(500).json({ error: "Internal server error" });
});

export { app };
