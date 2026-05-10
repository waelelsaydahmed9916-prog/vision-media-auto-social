import express from "express";
import { admin, db } from "../config/firebase.js";
import { requireAdmin } from "../middleware/auth.js";

export const companySettingsRouter = express.Router();

const settingsRef = () => db.collection("settings").doc("company");

const defaultSettings = {
  companyName: "VISION MEDIA",
  logoUrl: "/assets/vm_logo.png.png",
  qrUrl: "/assets/VISION_MEDIA_QR_poster.png",
  websiteUrl: "https://visionmadia.netlify.app/",
  phone: "0543044248",
  headline: "Advertising | Digital Marketing"
};

companySettingsRouter.get("/", requireAdmin, async (_req, res) => {
  const doc = await settingsRef().get();
  res.json(doc.exists ? { ...defaultSettings, ...doc.data() } : defaultSettings);
});

companySettingsRouter.patch("/", requireAdmin, async (req, res) => {
  await settingsRef().set({
    ...req.body,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  const doc = await settingsRef().get();
  res.json({ ...defaultSettings, ...doc.data() });
});
