import express from "express";
import multer from "multer";
import { admin, bucket, db } from "../config/firebase.js";
import { requireAdmin } from "../middleware/auth.js";

export const mediaRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 250 * 1024 * 1024 } });

mediaRouter.get("/", requireAdmin, async (_req, res) => {
  const snapshot = await db.collection("media").orderBy("createdAt", "desc").limit(100).get();
  res.json(snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString?.() || data.createdAt
    };
  }));
});

mediaRouter.post("/", requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "File is required." });

  const type = req.file.mimetype.startsWith("video")
    ? "video"
    : req.file.mimetype.startsWith("audio")
      ? "audio"
      : "image";
  const path = `media/${Date.now()}-${req.file.originalname}`;
  const file = bucket.file(path);

  await file.save(req.file.buffer, {
    metadata: { contentType: req.file.mimetype },
    resumable: false
  });

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "01-01-2035"
  });

  const ref = await db.collection("media").add({
    name: req.file.originalname,
    type,
    mimeType: req.file.mimetype,
    size: req.file.size,
    storagePath: path,
    url,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.status(201).json({ id: ref.id, name: req.file.originalname, type, url });
});
