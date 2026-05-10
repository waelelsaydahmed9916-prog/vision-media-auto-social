import dotenv from "dotenv";

dotenv.config();

const parseFirebaseConfig = () => {
  try {
    return process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {};
  } catch {
    return {};
  }
};

const firebaseConfig = parseFirebaseConfig();

export const env = {
  port: Number(process.env.PORT || 4000),
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:5173",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:4000",
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || "",
  firebase: {
    projectId: firebaseConfig.projectId || firebaseConfig.project_id || "",
    clientEmail: firebaseConfig.clientEmail || firebaseConfig.client_email || "",
    privateKey: (firebaseConfig.privateKey || firebaseConfig.private_key || "").replace(/\\n/g, "\n"),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket || firebaseConfig.storage_bucket || ""
  },
  oauth: {
    meta: {
      clientId: process.env.META_APP_ID || "",
      clientSecret: process.env.META_APP_SECRET || "",
      redirectUri: process.env.META_REDIRECT_URI || "http://localhost:4000/api/oauth/meta/callback"
    },
    youtube: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectUri: process.env.YOUTUBE_REDIRECT_URI || "http://localhost:4000/api/oauth/youtube/callback"
    },
    tiktok: {
      clientKey: process.env.TIKTOK_CLIENT_KEY || "",
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || ""
    },
    x: {
      clientId: process.env.X_CLIENT_ID || "",
      clientSecret: process.env.X_CLIENT_SECRET || ""
    }
  }
};
