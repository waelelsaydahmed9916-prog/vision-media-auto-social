import express from "express";
import { admin, db } from "../config/firebase.js";
import { requireAdmin } from "../middleware/auth.js";

export const channelsRouter = express.Router();

const serialize = (doc) => ({ id: doc.id, ...doc.data() });

channelsRouter.get("/", requireAdmin, async (_req, res) => {
  const snapshot = await db.collection("channels").orderBy("createdAt", "desc").limit(100).get();
  res.json(snapshot.docs.map(serialize));
});

channelsRouter.post("/", requireAdmin, async (req, res) => {
  const ref = await db.collection("channels").add({
    platform: req.body.platform,
    name: req.body.name,
    connectionStatus: req.body.connectionStatus || "بانتظار الربط",
    lastSync: req.body.lastSync || "لم تتم",
    permissions: req.body.permissions || {
      canPublish: false,
      canReadComments: false,
      canReadInsights: false
    },
    authType: "oauth",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const doc = await ref.get();
  res.status(201).json(serialize(doc));
});

channelsRouter.patch("/:id", requireAdmin, async (req, res) => {
  const ref = db.collection("channels").doc(req.params.id);
  await ref.set({ ...req.body, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  const doc = await ref.get();
  res.json(serialize(doc));
});

channelsRouter.delete("/:id", requireAdmin, async (req, res) => {
  await db.collection("channels").doc(req.params.id).delete();
  res.json({ ok: true });
});
