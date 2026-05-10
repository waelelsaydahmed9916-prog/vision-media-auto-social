import express from "express";
import { admin, db } from "../config/firebase.js";
import { requireAdmin } from "../middleware/auth.js";

export const weeklyPlanRouter = express.Router();

const weekDays = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

export const buildDemoWeek = (repeatWeekly = true) =>
  weekDays.map((day, index) => ({
    id: `generated-${index}`,
    day,
    publishTime: ["09:00", "14:30", "20:00", "11:15", "16:45", "19:30", "17:00"][index],
    contentType: ["Reel", "Carousel", "Short video", "Thread", "Story", "WhatsApp Template", "Weekly recap"][index],
    targetPlatforms: index === 5 ? ["WhatsApp Business"] : ["Instagram Business", ["Facebook Page", "TikTok", "YouTube Channel", "X"][index % 4]],
    selectedMedia: `Placeholder-${index + 1}`,
    executionStatus: index < 4 ? "مجدول" : "بانتظار موافقة الأدمن",
    repeatWeekly
  }));

const serialize = (doc) => ({ id: doc.id, ...doc.data() });

weeklyPlanRouter.get("/", requireAdmin, async (_req, res) => {
  const snapshot = await db.collection("weeklyPlan").orderBy("order", "asc").get();
  res.json(snapshot.docs.map(serialize));
});

weeklyPlanRouter.post("/", requireAdmin, async (req, res) => {
  const ref = await db.collection("weeklyPlan").add({
    ...req.body,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const doc = await ref.get();
  res.status(201).json(serialize(doc));
});

weeklyPlanRouter.patch("/:id", requireAdmin, async (req, res) => {
  const ref = db.collection("weeklyPlan").doc(req.params.id);
  await ref.set({ ...req.body, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  const doc = await ref.get();
  res.json(serialize(doc));
});
