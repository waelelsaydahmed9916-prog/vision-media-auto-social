import express from "express";
import { admin, db } from "../config/firebase.js";
import { requireAdmin } from "../middleware/auth.js";
import { buildDemoWeek } from "./weeklyPlan.js";

export const autoGenerateRouter = express.Router();

const monthTitles = [
  "إطلاق باقة إدارة السوشيال",
  "كيف نقرأ التفاعل",
  "قصة نجاح عميل",
  "نصائح واتساب بزنس",
  "أفضل أوقات النشر"
];

autoGenerateRouter.post("/week", requireAdmin, async (req, res) => {
  const items = buildDemoWeek(req.body.repeatWeekly !== false);

  if (!req.body.previewOnly) {
    const batch = db.batch();
    items.forEach((item, order) => {
      const ref = db.collection("weeklyPlan").doc(item.day);
      batch.set(ref, {
        ...item,
        order,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });
    await batch.commit();
  }

  res.json(items);
});

autoGenerateRouter.post("/month", requireAdmin, async (_req, res) => {
  const items = Array.from({ length: 30 }, (_, index) => ({
    id: `month-${index + 1}`,
    day: index + 1,
    title: monthTitles[index % monthTitles.length],
    caption: "كابشن تلقائي مناسب لهوية VISION MEDIA مع دعوة واضحة للتواصل.",
    hashtags: "#VisionMedia #تسويق_رقمي #نمو",
    designType: ["Placeholder card", "Short video", "Carousel", "Story layout"][index % 4],
    platform: ["Instagram Business", "TikTok", "WhatsApp Business", "LinkedIn", "X", "YouTube Channel"][index % 6],
    publishTime: ["09:00", "14:30", "20:00"][index % 3],
    executionStatus: index < 7 ? "مجدول" : "مسودة"
  }));

  const batch = db.batch();
  items.forEach((item) => {
    batch.set(db.collection("monthCalendar").doc(String(item.day)), {
      ...item,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });
  await batch.commit();

  res.json(items);
});
