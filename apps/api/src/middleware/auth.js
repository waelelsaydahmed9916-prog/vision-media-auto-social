import { admin, firebaseReady } from "../config/firebase.js";
import { env } from "../config/env.js";

export const requireAdmin = async (req, res, next) => {
  if (!firebaseReady) {
    return res.status(503).json({ message: "Firebase Auth is not configured." });
  }

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    if (env.adminEmails.length && !env.adminEmails.includes(decoded.email)) {
      return res.status(403).json({ message: "This account is not allowed to use the admin panel." });
    }
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
};
