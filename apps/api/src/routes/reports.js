import express from "express";
import { db } from "../config/firebase.js";
import { requireAdmin } from "../middleware/auth.js";

export const reportsRouter = express.Router();

reportsRouter.get("/", requireAdmin, async (_req, res) => {
  const snapshot = await db.collection("posts").orderBy("scheduledAt", "desc").limit(200).get();
  const posts = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      text: data.text,
      status: data.status,
      platforms: data.platforms,
      failureReason: data.failureReason,
      scheduledAt: data.scheduledAt?.toDate?.().toISOString?.(),
      publishedAt: data.publishedAt?.toDate?.().toISOString?.()
    };
  });

  res.json({
    totals: {
      published: posts.filter((post) => post.status === "published").length,
      failed: posts.filter((post) => post.status === "failed").length,
      scheduled: posts.filter((post) => post.status === "scheduled").length,
      draft: posts.filter((post) => post.status === "draft").length
    },
    posts
  });
});
