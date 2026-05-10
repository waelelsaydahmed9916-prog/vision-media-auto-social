import axios from "axios";
import { google } from "googleapis";
import { env } from "../config/env.js";
import { decryptToken } from "../utils/crypto.js";

const buildMessage = (post) => [post.text, post.hashtags].filter(Boolean).join("\n\n");

export const providers = {
  facebook: {
    label: "Facebook Pages",
    status: "ready",
    async publish({ account, post }) {
      const accessToken = decryptToken(account.tokens.accessToken);
      const pageId = account.externalId;
      const message = buildMessage(post);

      if (post.media?.type === "image" && post.media.url) {
        return axios.post(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
          url: post.media.url,
          caption: message,
          access_token: accessToken
        });
      }

      if (post.media?.type === "video" && post.media.url) {
        return axios.post(`https://graph.facebook.com/v19.0/${pageId}/videos`, {
          file_url: post.media.url,
          description: message,
          access_token: accessToken
        });
      }

      return axios.post(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
        message,
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
      const caption = buildMessage(post);
      const mediaUrl = post.media?.url;

      if (!mediaUrl) throw new Error("Instagram publishing requires an image or video URL.");

      const payload = {
        caption,
        access_token: accessToken
      };

      if (post.media.type === "image") {
        payload.image_url = mediaUrl;
      } else {
        payload.video_url = mediaUrl;
        payload.media_type = "REELS";
      }

      const container = await axios.post(`https://graph.facebook.com/v19.0/${igUserId}/media`, payload);

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
            description: buildMessage(post)
          },
          status: {
            privacyStatus: post.youtubePrivacyStatus || "public"
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
      throw new Error("TikTok publishing needs developer approval for Content Posting API before activation.");
    }
  },
  x: {
    label: "X",
    status: "coming_soon",
    async publish() {
      throw new Error("X publishing needs an active X API plan and write permissions before activation.");
    }
  }
};
