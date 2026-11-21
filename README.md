# Resume Rocket

A resume builder with a live side-by-side preview.

## Client

The `client/` folder contains the frontend application built with Vite, React, TypeScript, and Tailwind CSS.

### Installation

```bash
cd client
npm install
```

### Environment Variables

Copy `.env.example` to `.env`:

```bash
VITE_API_URL=http://localhost:4000
```

`VITE_API_URL` configures the backend API base URL (defaults to `http://localhost:4000` if omitted).

### Running Locally (Two Terminals)

In terminal 1 (backend server):
```bash
cd server
npm run dev
```

In terminal 2 (frontend client):
```bash
cd client
npm run dev
```

The frontend dev server runs at `http://localhost:5173`.

### Running Tests

```bash
cd client
npm test
```

### Editor & Live Preview

The resume editor (`/resume/:id`) features a side-by-side workspace with collapsible section forms (Basics, Summary, Education, Skills, Experience, Projects, Certifications) and an ATS-friendly, semantic preview renderer styled with standard print units. Repeatable list sections support adding, removing with a 6-second Undo toast, and moving items up and down with disabled boundaries. Content edits automatically autosave with a 1500ms debounce, sequencing updates during in-flight saves to prevent overlapping requests. The editor flushes immediately on visibility change or manual save (`Ctrl+S`/`Cmd+S`), and retries failed saves automatically up to 3 times with exponential backoff before offering a manual retry button.

## Server Setup

1. Install Node.js 24.x.
2. Clone the repo and navigate to `server/`.
3. Run `npm install`.
4. Copy `.env.example` to `.env` and fill in `DATABASE_URL` with your Neon pooled connection string.
5. Run `npm run migrate` to create the database tables.
6. Run `npm run dev` to start the development server on port 4000.

## Running Migrations

Migrations are plain SQL files in `server/migrations/`. Run them with:

```
cd server
npm run migrate
```

The migrate script tracks applied files in a `schema_migrations` table and is safe to run repeatedly.

## API Routes

### Health
- `GET /health`: Returns service health status without touching the database.
- `GET /health/db`: Checks database connectivity and returns database status.

### Authentication (`/api/auth`)
- `POST /api/auth/signup`: Creates a new user account, sets session cookie, and returns user details.
- `POST /api/auth/login`: Authenticates user credentials, sets session cookie, and returns user details.
- `POST /api/auth/logout`: Clears the session cookie and logs the user out.
- `GET /api/auth/me`: Returns the currently authenticated user details.

### Resumes (`/api/resumes`)
- `GET /api/resumes`: Lists all active resumes for the authenticated user, newest first, with optional title search (`?q=`).
- `POST /api/resumes`: Creates a new resume with empty prefilled content.
- `GET /api/resumes/:id`: Returns full details and content for a specific resume.
- `PATCH /api/resumes/:id`: Renames a resume title.
- `PUT /api/resumes/:id/content`: Validates and replaces resume content (includes optional `skills` with up to 15 groups, category up to 50 chars, and up to 40 items of max 40 chars; defaults to `[]`).
- `POST /api/resumes/:id/duplicate`: Duplicates a resume with copied content (including skills) and updated title.
- `DELETE /api/resumes/:id`: Soft deletes a resume.

## Deploy to Render

1. Push the repo to GitHub.
2. Create a new Web Service on Render and connect the repo.
3. Render will detect `render.yaml` and configure the service automatically (Build Command: `npm ci --include=dev && npm run build`, Start Command: `npm start`).
4. Set `DATABASE_URL` to your Neon connection string and `CLIENT_ORIGIN` to your frontend URL in the Render dashboard.
5. Run migrations manually from your local machine against the Neon database before deploying:
   ```
   cd server
   DATABASE_URL="your-neon-connection-string" npm run migrate
   ```
