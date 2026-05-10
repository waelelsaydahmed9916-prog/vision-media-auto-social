import axios from "axios";
import { google } from "googleapis";
import { env } from "../config/env.js";
import { decryptToken } from "../utils/crypto.js";

export const providers = {
  facebook: {
    label: "Facebook Pages",
    status: "ready",
    async publish({ account, post }) {
      const accessToken = decryptToken(account.tokens.accessToken);
      const pageId = account.externalId;
      const endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;

      return axios.post(endpoint, {
        message: [post.text, post.hashtags].filter(Boolean).join("\n\n"),
        access_token: accessToken
      });
    }
  },
  instagram: {
    label: "Instagram Business",
    status: "ready",
    async publish({ account, post }) {
      const accessToken = decryptToken(account.tokens.accessToken);
      const igUserId = account.externalId;
      const caption = [post.text, post.hashtags].filter(Boolean).join("\n\n");

      if (!post.media?.url || post.media.placeholderOnly) {
        throw new Error("Instagram publishing is prepared only. Real media publishing is disabled while placeholders are active.");
      }

      const mediaField = post.media.type === "video" ? "video_url" : "media_url";
      const container = await axios.post(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
        [mediaField]: post.media.url,
        caption,
        access_token: accessToken
      });

      return axios.post(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
        creation_id: container.data.id,
        access_token: accessToken
      });
    }
  },
  youtube: {
    label: "YouTube",
    status: "ready",
    async publish({ account, post }) {
      if (post.media?.type !== "video" || !post.media.url) {
        throw new Error("YouTube publishing requires a scheduled video file.");
      }

      const oauth2Client = new google.auth.OAuth2(
        env.oauth.youtube.clientId,
        env.oauth.youtube.clientSecret,
        env.oauth.youtube.redirectUri
      );
      oauth2Client.setCredentials({
        access_token: decryptToken(account.tokens.accessToken),
        refresh_token: account.tokens.refreshToken ? decryptToken(account.tokens.refreshToken) : undefined
      });

      const mediaResponse = await axios.get(post.media.url, { responseType: "stream" });
      const youtube = google.youtube({ version: "v3", auth: oauth2Client });

      return youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: post.text.slice(0, 90) || "VISION MEDIA scheduled video",
            description: [post.text, post.hashtags].filter(Boolean).join("\n\n")
          },
          status: {
            privacyStatus: "public"
          }
        },
        media: {
          body: mediaResponse.data
        }
      });
    }
  },
  tiktok: {
    label: "TikTok",
    status: "coming_soon",
    async publish() {
      throw new Error("TikTok publishing is marked for later integration.");
    }
  },
  x: {
    label: "X",
    status: "coming_soon",
    async publish() {
      throw new Error("X publishing is marked for later integration.");
    }
  }
};
