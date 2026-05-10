import express from "express";
import { admin, db, firebaseReady } from "../config/firebase.js";
import { requireAdmin } from "../middleware/auth.js";
import { env } from "../config/env.js";

export const systemHealthRouter = express.Router();

const nowIso = () => new Date().toISOString();

const safeCount = async (collectionName) => {
  try {
    const snapshot = await db.collection(collectionName).limit(500).get();
    return { ok: true, count: snapshot.size };
  } catch (error) {
    return { ok: false, count: 0, message: error.message };
  }
};

const safeLatest = async (collectionName, orderField = "createdAt", limit = 5) => {
  try {
    const snapshot = await db.collection(collectionName).orderBy(orderField, "desc").limit(limit).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        status: data.status || data.connectionStatus || data.executionStatus || "غير محدد",
        title: data.title || data.name || data.platform || data.text || collectionName,
        createdAt: data.createdAt?.toDate?.().toISOString?.() || null,
        updatedAt: data.updatedAt?.toDate?.().toISOString?.() || null,
        scheduledAt: data.scheduledAt?.toDate?.().toISOString?.() || null,
        failureReason: data.failureReason || data.error || ""
      };
    });
  } catch {
    return [];
  }
};

systemHealthRouter.get("/", requireAdmin, async (req, res) => {
  const [posts, channels, weeklyPlan, media, whatsappMessages] = await Promise.all([
    safeCount("posts"),
    safeCount("channels"),
    safeCount("weeklyPlan"),
    safeCount("media"),
    safeCount("whatsappMessages")
  ]);

  const [latestPosts, latestChannels, latestWhatsApp] = await Promise.all([
    safeLatest("posts", "scheduledAt", 8),
    safeLatest("channels", "updatedAt", 8),
    safeLatest("whatsappMessages", "createdAt", 8)
  ]);

  const failedPosts = latestPosts.filter((item) => item.status === "failed" || item.failureReason);
  const disconnectedChannels = latestChannels.filter((item) => !String(item.status).includes("مربوط"));

  const checks = [
    {
      id: "firebase-admin",
      label: "Firebase Admin",
      status: firebaseReady ? "ok" : "error",
      message: firebaseReady ? "Firebase متصل بنفس إعدادات المشروع الحالي" : "Firebase غير مهيأ على Render"
    },
    {
      id: "firestore",
      label: "Firestore Database",
      status: posts.ok && channels.ok ? "ok" : "warning",
      message: posts.ok && channels.ok ? "قراءة البيانات تعمل" : "بعض Collections لم تستجب للفحص"
    },
    {
      id: "auth",
      label: "Firebase Auth",
      status: req.admin?.uid ? "ok" : "error",
      message: req.admin?.email || req.admin?.uid || "لم يتم التحقق من الأدمن"
    },
    {
      id: "render-api",
      label: "Render API",
      status: "ok",
      message: `API يعمل على المنفذ ${env.port}`
    },
    {
      id: "scheduler",
      label: "Scheduler",
      status: weeklyPlan.ok ? "ok" : "warning",
      message: weeklyPlan.ok ? `${weeklyPlan.count} عنصر في الخطة الأسبوعية` : weeklyPlan.message
    },
    {
      id: "oauth-channels",
      label: "OAuth Channels",
      status: disconnectedChannels.length ? "warning" : "ok",
      message: disconnectedChannels.length ? `${disconnectedChannels.length} قناة تحتاج مراجعة` : "كل القنوات المقروءة حالتها مستقرة"
    },
    {
      id: "whatsapp",
      label: "WhatsApp Integration",
      status: whatsappMessages.ok ? "ok" : "warning",
      message: whatsappMessages.ok ? `${whatsappMessages.count} رسالة/سجل واتساب` : whatsappMessages.message
    }
  ];

  const score = Math.round((checks.filter((check) => check.status === "ok").length / checks.length) * 100);

  res.json({
    ok: true,
    generatedAt: nowIso(),
    project: "VISION MEDIA Auto Social Publisher",
    environment: {
      appBaseUrl: env.appBaseUrl,
      apiBaseUrl: env.apiBaseUrl,
      timezone: "Asia/Riyadh"
    },
    score,
    checks,
    collections: { posts, channels, weeklyPlan, media, whatsappMessages },
    latest: {
      posts: latestPosts,
      channels: latestChannels,
      whatsapp: latestWhatsApp
    },
    alerts: [
      ...failedPosts.map((item) => ({ type: "post", level: "error", message: item.failureReason || "منشور فشل في التنفيذ", item })),
      ...disconnectedChannels.map((item) => ({ type: "channel", level: "warning", message: `${item.title} يحتاج مراجعة ربط`, item }))
    ].slice(0, 20)
  });
});
