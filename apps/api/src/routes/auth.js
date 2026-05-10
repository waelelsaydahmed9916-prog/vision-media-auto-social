import express from "express";
import { requireAdmin } from "../middleware/auth.js";

export const authRouter = express.Router();

authRouter.get("/me", requireAdmin, (req, res) => {
  res.json({
    uid: req.admin.uid,
    email: req.admin.email || null,
    name: req.admin.name || "VISION MEDIA Admin"
  });
});
