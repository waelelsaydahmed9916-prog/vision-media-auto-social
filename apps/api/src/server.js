import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { mediaRouter } from "./routes/media.js";
import { oauthRouter } from "./routes/oauth.js";
import { operationsRouter } from "./routes/operations.js";
import { postsRouter } from "./routes/posts.js";
import { reportsRouter } from "./routes/reports.js";
import { autoGenerateRouter } from "./routes/autoGenerate.js";
import { channelsRouter } from "./routes/channels.js";
import { companySettingsRouter } from "./routes/companySettings.js";
import { engagementRouter } from "./routes/engagement.js";
import { schedulerRouter } from "./routes/scheduler.js";
import { weeklyPlanRouter } from "./routes/weeklyPlan.js";
import { whatsappRouter } from "./routes/whatsapp.js";
import { env } from "./config/env.js";
import { startScheduler } from "./jobs/scheduler.js";

const app = express();

app.use(cors({ origin: env.appBaseUrl, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "VISION MEDIA Auto Social Publisher" });
});

app.use("/api/auth", authRouter);
app.use("/api/oauth", oauthRouter);
app.use("/api/operations", operationsRouter);
app.use("/api/media", mediaRouter);
app.use("/api/posts", postsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/channels", channelsRouter);
app.use("/api/company-settings", companySettingsRouter);
app.use("/api/weekly-plan", weeklyPlanRouter);
app.use("/api/auto-generate", autoGenerateRouter);
app.use("/api/engagement", engagementRouter);
app.use("/api/whatsapp", whatsappRouter);
app.use("/api/scheduler", schedulerRouter);

app.use("/channels", channelsRouter);
app.use("/company-settings", companySettingsRouter);
app.use("/operations", operationsRouter);
app.use("/weekly-plan", weeklyPlanRouter);
app.use("/auto-generate", autoGenerateRouter);
app.use("/engagement", engagementRouter);
app.use("/whatsapp", whatsappRouter);
app.use("/scheduler", schedulerRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(400).json({ message: error.message || "Unexpected error" });
});

app.listen(env.port, () => {
  console.log(`VISION MEDIA API running on ${env.apiBaseUrl}`);
  startScheduler();
});
