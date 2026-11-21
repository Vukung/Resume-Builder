# Resume Rocket

A resume builder with a live side-by-side preview. This repo contains the backend server (Phase 1).

## Local Setup

1. Install Node.js 20 or later.
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
