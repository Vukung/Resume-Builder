import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import { query } from "../db";
import { requireAuth } from "../middleware/requireAuth";
import { resumeContentSchema, emptyContent } from "../schemas/resumeContent";

const resumesRouter = Router();

const resumesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user!.id,
  validate: { keyGeneratorIpFallback: false },
  message: { error: "Too many requests, please try again later" },
  statusCode: 429,
});

// All /api/resumes routes require authentication and user-keyed rate limiting
resumesRouter.use(requireAuth, resumesLimiter);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

function getIdParam(req: Request): string {
  const { id } = req.params;
  return typeof id === "string" ? id : "";
}

const titleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title must be at least 1 character")
    .max(100, "Title must be at most 100 characters"),
});

function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      res.status(400).json({
        error: "Validation failed",
        fields,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// GET /: list current user's non-deleted resumes, optional ?q= substring search on title
resumesRouter.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const qParam = req.query.q;
    let rows: Array<{
      id: string;
      title: string;
      created_at: Date;
      updated_at: Date;
    }>;

    if (typeof qParam === "string") {
      const escapedQ = qParam
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_");

      const result = await query<{
        id: string;
        title: string;
        created_at: Date;
        updated_at: Date;
      }>(
        `SELECT id, title, created_at, updated_at
         FROM resumes
         WHERE user_id = $1 AND is_deleted = false AND title ILIKE $2 ESCAPE '\\'
         ORDER BY updated_at DESC`,
        [req.user!.id, `%${escapedQ}%`]
      );
      rows = result.rows;
    } else {
      const result = await query<{
        id: string;
        title: string;
        created_at: Date;
        updated_at: Date;
      }>(
        `SELECT id, title, created_at, updated_at
         FROM resumes
         WHERE user_id = $1 AND is_deleted = false
         ORDER BY updated_at DESC`,
        [req.user!.id]
      );
      rows = result.rows;
    }

    res.status(200).json({
      resumes: rows.map((r) => ({
        id: r.id,
        title: r.title,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /: create resume with empty content, max 20 per user limit
resumesRouter.post(
  "/",
  validateBody(titleSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title } = req.body;
      const content = emptyContent(req.user!);

      const result = await query<{
        id: string;
        title: string;
        content: any;
        created_at: Date;
        updated_at: Date;
      }>(
        `INSERT INTO resumes (user_id, title, content)
         SELECT $1, $2, $3::jsonb
         WHERE (SELECT count(*) FROM resumes WHERE user_id = $1 AND is_deleted = false) < 20
         RETURNING id, title, content, created_at, updated_at`,
        [req.user!.id, title, JSON.stringify(content)]
      );

      if (result.rows.length === 0) {
        res.status(409).json({ error: "Resume limit reached" });
        return;
      }

      const row = result.rows[0];
      res.status(201).json({
        resume: {
          id: row.id,
          title: row.title,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          content: row.content,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /:id: return single resume including content
resumesRouter.get("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getIdParam(req);
    if (!isValidUuid(id)) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const result = await query<{
      id: string;
      title: string;
      content: any;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, title, content, created_at, updated_at
       FROM resumes
       WHERE id = $1 AND user_id = $2 AND is_deleted = false`,
      [id, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const row = result.rows[0];
    res.status(200).json({
      resume: {
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        content: row.content,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /:id: update resume title
resumesRouter.patch(
  "/:id",
  validateBody(titleSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = getIdParam(req);
      if (!isValidUuid(id)) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const { title } = req.body;

      const result = await query<{
        id: string;
        title: string;
        created_at: Date;
        updated_at: Date;
      }>(
        `UPDATE resumes
         SET title = $1, updated_at = now()
         WHERE id = $2 AND user_id = $3 AND is_deleted = false
         RETURNING id, title, created_at, updated_at`,
        [title, id, req.user!.id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const row = result.rows[0];
      res.status(200).json({
        resume: {
          id: row.id,
          title: row.title,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /:id/content: replace resume content
resumesRouter.put(
  "/:id/content",
  validateBody(resumeContentSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = getIdParam(req);
      if (!isValidUuid(id)) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const content = req.body;

      const result = await query<{
        updated_at: Date;
      }>(
        `UPDATE resumes
         SET content = $1::jsonb, updated_at = now()
         WHERE id = $2 AND user_id = $3 AND is_deleted = false
         RETURNING updated_at`,
        [JSON.stringify(content), id, req.user!.id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      res.status(200).json({
        updatedAt: result.rows[0].updated_at,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /:id/duplicate: duplicate resume with " (Copy)" appended to title
resumesRouter.post(
  "/:id/duplicate",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = getIdParam(req);
      if (!isValidUuid(id)) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      // Check if original resume exists and belongs to current user
      const originalResult = await query<{
        id: string;
        title: string;
        content: any;
      }>(
        `SELECT id, title, content
         FROM resumes
         WHERE id = $1 AND user_id = $2 AND is_deleted = false`,
        [id, req.user!.id]
      );

      if (originalResult.rows.length === 0) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const original = originalResult.rows[0];
      const newTitle = `${original.title} (Copy)`.slice(0, 100);

      // Atomic insert enforcing max 20 resumes limit
      const insertResult = await query<{
        id: string;
        title: string;
        content: any;
        created_at: Date;
        updated_at: Date;
      }>(
        `INSERT INTO resumes (user_id, title, content)
         SELECT $1, $2, $3::jsonb
         WHERE (SELECT count(*) FROM resumes WHERE user_id = $1 AND is_deleted = false) < 20
         RETURNING id, title, content, created_at, updated_at`,
        [req.user!.id, newTitle, JSON.stringify(original.content)]
      );

      if (insertResult.rows.length === 0) {
        res.status(409).json({ error: "Resume limit reached" });
        return;
      }

      const row = insertResult.rows[0];
      res.status(201).json({
        resume: {
          id: row.id,
          title: row.title,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          content: row.content,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /:id: soft delete
resumesRouter.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = getIdParam(req);
      if (!isValidUuid(id)) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const result = await query<{ id: string }>(
        `UPDATE resumes
         SET is_deleted = true, updated_at = now()
         WHERE id = $1 AND user_id = $2 AND is_deleted = false
         RETURNING id`,
        [id, req.user!.id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      res.status(200).json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

export { resumesRouter };
