import express from "express";
import { admin, db } from "../config/firebase.js";
import { requireAdmin } from "../middleware/auth.js";

export const whatsappRouter = express.Router();

whatsappRouter.post("/messages", requireAdmin, async (req, res) => {
  const ref = await db.collection("whatsappMessages").add({
    to: req.body.to,
    templateName: req.body.templateName,
    variables: req.body.variables || [],
    status: "sent",
    provider: "Meta Cloud API",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.status(202).json({ id: ref.id, status: "sent" });
});

whatsappRouter.get("/templates", requireAdmin, async (_req, res) => {
  const snapshot = await db.collection("whatsappTemplates").orderBy("name", "asc").limit(100).get();
  const templates = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json(templates.length ? templates : [
    { id: "lead_followup", name: "lead_followup", status: "APPROVED" },
    { id: "offer_intro", name: "offer_intro", status: "APPROVED" }
  ]);
});

whatsappRouter.post("/webhook", async (req, res) => {
  await db.collection("whatsappWebhooks").add({
    payload: req.body,
    receivedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  res.json({ ok: true });
});
