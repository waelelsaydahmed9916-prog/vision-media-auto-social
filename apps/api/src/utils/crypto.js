import crypto from "crypto";
import { env } from "../config/env.js";

const getKey = () => {
  if (!env.tokenEncryptionKey) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required to encrypt social access tokens.");
  }

  const decoded = Buffer.from(env.tokenEncryptionKey, "base64");
  if (decoded.length === 32) return decoded;

  return crypto.createHash("sha256").update(env.tokenEncryptionKey).digest();
};

export const encryptToken = (value) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    value: encrypted.toString("base64"),
    tag: tag.toString("base64")
  };
};

export const decryptToken = (payload) => {
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(payload.value, "base64")),
    decipher.final()
  ]).toString("utf8");
};
