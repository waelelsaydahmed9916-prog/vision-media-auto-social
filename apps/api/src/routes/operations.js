import express from "express";
import { admin, db } from "../config/firebase.js";
import { requireAdmin } from "../middleware/auth.js";

export const operationsRouter = express.Router();

const collectionList = async (name, fallback) => {
  const snapshot = await db.collection(name).orderBy("createdAt", "desc").limit(100).get();
  const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return rows.length ? rows : fallback;
};

operationsRouter.get("/notifications", requireAdmin, async (_req, res) => {
  const fallback = [
    { id: "publish-ok", title: "نجاح النشر", channel: "site", status: "new" },
    { id: "comment-new", title: "تعليق جديد", channel: "site + whatsapp", status: "new" },
    { id: "engagement-up", title: "زيادة التفاعل", channel: "email", status: "new" }
  ];
  res.json(await collectionList("notifications", fallback));
});

operationsRouter.post("/notifications", requireAdmin, async (req, res) => {
  const ref = await db.collection("notifications").add({
    ...req.body,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  res.status(201).json({ id: ref.id, ...req.body });
});

operationsRouter.get("/campaigns", requireAdmin, async (_req, res) => {
  const fallback = [
    { id: "ramadan", name: "حملة رمضان", status: "active", budget: "4500 SAR" },
    { id: "qr-launch", name: "حملة QR", status: "draft", budget: "1200 SAR" }
  ];
  res.json(await collectionList("campaigns", fallback));
});

operationsRouter.post("/campaigns", requireAdmin, async (req, res) => {
  const ref = await db.collection("campaigns").add({
    ...req.body,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  res.status(201).json({ id: ref.id, ...req.body });
});

operationsRouter.post("/qr", requireAdmin, async (req, res) => {
  const ref = await db.collection("qrCodes").add({
    targetUrl: req.body.targetUrl,
    logoUrl: req.body.logoUrl,
    format: req.body.format || "png",
    status: "ready",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  res.status(201).json({ id: ref.id, status: "ready" });
});

operationsRouter.get("/security/activity", requireAdmin, async (_req, res) => {
  const fallback = [
    { id: "login", event: "Admin login", role: "Admin", device: "Trusted device" },
    { id: "publish", event: "Post scheduled", role: "Editor", device: "Web dashboard" }
  ];
  res.json(await collectionList("activityLogs", fallback));
});
