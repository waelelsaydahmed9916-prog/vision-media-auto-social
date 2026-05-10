import express from "express";
import { admin, db } from "../config/firebase.js";
import { requireAdmin } from "../middleware/auth.js";

export const engagementRouter = express.Router();

const demoComments = [
  { id: "demo-1", author: "نورة العتيبي", platform: "Instagram Business", postTitle: "Reel عرض رمضان", commentedAt: "قبل 4 دقائق", status: "جديد" },
  { id: "demo-2", author: "Fahad Growth", platform: "LinkedIn", postTitle: "Case Study", commentedAt: "قبل 18 دقيقة", status: "مهم" },
  { id: "demo-3", author: "متجر لمعة", platform: "WhatsApp Business", postTitle: "قالب متابعة", commentedAt: "قبل 27 دقيقة", status: "تم الرد" }
];

engagementRouter.get("/comments", requireAdmin, async (_req, res) => {
  const snapshot = await db.collection("engagementComments").orderBy("createdAt", "desc").limit(100).get();
  const comments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json(comments.length ? comments : demoComments);
});

engagementRouter.post("/comments/:id/reply", requireAdmin, async (req, res) => {
  await db.collection("engagementComments").doc(req.params.id).set({
    reply: req.body.reply,
    status: "تم الرد",
    repliedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  res.json({ ok: true, suggestedReply: req.body.reply });
});

engagementRouter.get("/insights", requireAdmin, async (_req, res) => {
  res.json({
    metrics: [
      ["التعليقات", "1,248", "+18%"],
      ["الإعجابات", "24,930", "+11%"],
      ["المشاركات", "3,106", "+22%"],
      ["المشاهدات", "918K", "+9%"],
      ["مشتركين جدد", "2,410", "حسب دعم المنصة"],
      ["أفضل منشور", "Reel عرض رمضان", "ER 12.8%"],
      ["أسوأ منشور", "منشور نصي X", "ER 1.1%"]
    ],
    recommendation:
      "زد الفيديو القصير على Instagram وTikTok، وانقل العروض إلى الخميس مساءً، ثم أرسل WhatsApp Template للمهتمين خلال 30 دقيقة."
  });
});
