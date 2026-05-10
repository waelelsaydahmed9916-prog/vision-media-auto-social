import crypto from "crypto";
import express from "express";
import axios from "axios";
import { admin, db } from "../config/firebase.js";
import { env } from "../config/env.js";
import { requireAdmin } from "../middleware/auth.js";
import { encryptToken } from "../utils/crypto.js";

export const oauthRouter = express.Router();
const stateStore = new Map();

const createState = (platform) => {
  const state = crypto.randomBytes(24).toString("hex");
  stateStore.set(state, { platform, expiresAt: Date.now() + 10 * 60 * 1000 });
  return state;
};

const verifyState = (state, platform) => {
  const saved = stateStore.get(state);
  stateStore.delete(state);
  return saved?.platform === platform && saved.expiresAt > Date.now();
};

oauthRouter.get("/providers", requireAdmin, async (_req, res) => {
  const snapshot = await db.collection("socialAccounts").get();
  const accounts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), tokens: undefined }));

  res.json({
    providers: [
      { id: "facebook", name: "Facebook Pages", enabled: true },
      { id: "instagram", name: "Instagram Business", enabled: true },
      { id: "youtube", name: "YouTube", enabled: true },
      { id: "tiktok", name: "TikTok", enabled: false },
      { id: "x", name: "X", enabled: false }
    ],
    accounts
  });
});

oauthRouter.get("/meta/start", requireAdmin, (_req, res) => {
  const state = createState("meta");
  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
    "business_management"
  ].join(",");

  const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  url.searchParams.set("client_id", env.oauth.meta.clientId);
  url.searchParams.set("redirect_uri", env.oauth.meta.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", scopes);
  res.json({ url: url.toString() });
});

oauthRouter.get("/meta/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !verifyState(state, "meta")) return res.status(400).send("Invalid OAuth state.");

  const tokenResponse = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
    params: {
      client_id: env.oauth.meta.clientId,
      client_secret: env.oauth.meta.clientSecret,
      redirect_uri: env.oauth.meta.redirectUri,
      code
    }
  });

  const accessToken = tokenResponse.data.access_token;
  const pages = await axios.get("https://graph.facebook.com/v19.0/me/accounts", {
    params: {
      access_token: accessToken,
      fields: "id,name,access_token,instagram_business_account{id,username,name}"
    }
  });

  for (const page of pages.data.data || []) {
    await db.collection("socialAccounts").doc(`facebook_${page.id}`).set({
      platform: "facebook",
      externalId: page.id,
      name: page.name,
      connected: true,
      tokens: { accessToken: encryptToken(page.access_token) },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    if (page.instagram_business_account?.id) {
      await db.collection("socialAccounts").doc(`instagram_${page.instagram_business_account.id}`).set({
        platform: "instagram",
        externalId: page.instagram_business_account.id,
        name: page.instagram_business_account.username || page.instagram_business_account.name || page.name,
        connected: true,
        linkedFacebookPageId: page.id,
        tokens: { accessToken: encryptToken(page.access_token) },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  }

  res.redirect(`${env.appBaseUrl}/connections?connected=meta`);
});

oauthRouter.get("/youtube/start", requireAdmin, (_req, res) => {
  const state = createState("youtube");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.oauth.youtube.clientId);
  url.searchParams.set("redirect_uri", env.oauth.youtube.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("scope", "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly");
  url.searchParams.set("state", state);
  res.json({ url: url.toString() });
});

oauthRouter.get("/youtube/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !verifyState(state, "youtube")) return res.status(400).send("Invalid OAuth state.");

  const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
    client_id: env.oauth.youtube.clientId,
    client_secret: env.oauth.youtube.clientSecret,
    redirect_uri: env.oauth.youtube.redirectUri,
    grant_type: "authorization_code",
    code
  });

  await db.collection("socialAccounts").doc("youtube_primary").set({
    platform: "youtube",
    externalId: "primary",
    name: "YouTube Channel",
    connected: true,
    tokens: {
      accessToken: encryptToken(tokenResponse.data.access_token),
      refreshToken: tokenResponse.data.refresh_token ? encryptToken(tokenResponse.data.refresh_token) : null
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  res.redirect(`${env.appBaseUrl}/connections?connected=youtube`);
});
