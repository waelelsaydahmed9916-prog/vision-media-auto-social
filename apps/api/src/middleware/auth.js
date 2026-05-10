import { admin, firebaseReady } from "../config/firebase.js";

export const requireAdmin = async (req, res, next) => {
  if (!firebaseReady) {
    return res.status(503).json({ message: "Firebase Auth is not configured." });
  }

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
};
