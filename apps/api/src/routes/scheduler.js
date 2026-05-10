import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { publishDuePosts } from "../services/publisher.js";

export const schedulerRouter = express.Router();

schedulerRouter.post("/run-weekly", requireAdmin, async (_req, res) => {
  const results = await publishDuePosts();
  res.json({ ok: true, results });
});
