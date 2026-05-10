import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { mediaRouter } from "./routes/media.js";
import { oauthRouter } from "./routes/oauth.js";
import { postsRouter } from "./routes/posts.js";
import { reportsRouter } from "./routes/reports.js";
import { env } from "./config/env.js";
import { startScheduler } from "./jobs/scheduler.js";

const app = express();

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || env.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  }
}));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "VISION MEDIA Auto Social Publisher" });
});

app.use("/api/auth", authRouter);
app.use("/api/oauth", oauthRouter);
app.use("/api/media", mediaRouter);
app.use("/api/posts", postsRouter);
app.use("/api/reports", reportsRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(400).json({ message: error.message || "Unexpected error" });
});

app.listen(env.port, () => {
  console.log(`VISION MEDIA API running on ${env.apiBaseUrl}`);
  startScheduler();
});
