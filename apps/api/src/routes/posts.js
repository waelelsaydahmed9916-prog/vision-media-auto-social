import express from "express";
import { z } from "zod";
import { admin, db } from "../config/firebase.js";
import { requireAdmin } from "../middleware/auth.js";
import { publishDuePosts } from "../services/publisher.js";

export const postsRouter = express.Router();

const postSchema = z.object({
  text: z.string().min(1),
  hashtags: z.string().optional().default(""),
  media: z.object({
    id: z.string(),
    url: z.string().url(),
    type: z.enum(["image", "video"])
  }).nullable().optional(),
  platforms: z.array(z.enum(["facebook", "instagram", "youtube", "tiktok", "x"])).min(1),
  scheduledAt: z.string().datetime(),
  status: z.enum(["draft", "scheduled"]).default("scheduled")
});

const serializePost = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    scheduledAt: data.scheduledAt?.toDate?.().toISOString?.() || data.scheduledAt,
    createdAt: data.createdAt?.toDate?.().toISOString?.() || data.createdAt,
    publishedAt: data.publishedAt?.toDate?.().toISOString?.() || data.publishedAt
  };
};

postsRouter.get("/", requireAdmin, async (req, res) => {
  const status = req.query.status;
  let query = db.collection("posts").orderBy("scheduledAt", "desc").limit(200);
  if (status) query = db.collection("posts").where("status", "==", status).orderBy("scheduledAt", "desc").limit(200);
  const snapshot = await query.get();
  res.json(snapshot.docs.map(serializePost));
});

postsRouter.post("/", requireAdmin, async (req, res) => {
  const body = postSchema.parse(req.body);
  const ref = await db.collection("posts").add({
    ...body,
    scheduledAt: admin.firestore.Timestamp.fromDate(new Date(body.scheduledAt)),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    failureReason: null,
    publishResults: []
  });

  const doc = await ref.get();
  res.status(201).json(serializePost(doc));
});

postsRouter.get("/calendar", requireAdmin, async (req, res) => {
  const start = req.query.start ? new Date(String(req.query.start)) : new Date();
  const end = req.query.end ? new Date(String(req.query.end)) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  const snapshot = await db
    .collection("posts")
    .where("scheduledAt", ">=", admin.firestore.Timestamp.fromDate(start))
    .where("scheduledAt", "<=", admin.firestore.Timestamp.fromDate(end))
    .orderBy("scheduledAt", "asc")
    .get();

  res.json(snapshot.docs.map(serializePost));
});

postsRouter.post("/run-due", requireAdmin, async (_req, res) => {
  const results = await publishDuePosts();
  res.json({ results });
});
