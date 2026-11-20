import { app } from "./app";
import { config } from "./config";
import { pool } from "./db";

const server = app.listen(config.PORT, () => {
  console.log(
    `Server running on port ${config.PORT} [${config.NODE_ENV}]`
  );
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(async () => {
    await pool.end();
    console.log("Server and pool closed.");
    process.exit(0);
  });
});
