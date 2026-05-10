import { admin, db } from "../config/firebase.js";
import { providers } from "./socialProviders.js";

export const publishDuePosts = async () => {
  const now = admin.firestore.Timestamp.now();
  const snapshot = await db
    .collection("posts")
    .where("status", "==", "scheduled")
    .where("scheduledAt", "<=", now)
    .get();

  const results = [];

  for (const doc of snapshot.docs) {
    const post = { id: doc.id, ...doc.data() };
    const platformResults = [];

    try {
      for (const platform of post.platforms || []) {
        const provider = providers[platform];
        if (!provider || provider.status !== "ready") {
          platformResults.push({ platform, status: "failed", reason: "Platform integration is not active yet." });
          continue;
        }

        const accountSnapshot = await db
          .collection("socialAccounts")
          .where("platform", "==", platform)
          .where("connected", "==", true)
          .limit(1)
          .get();

        if (accountSnapshot.empty) {
          platformResults.push({ platform, status: "failed", reason: "No connected account." });
          continue;
        }

        await provider.publish({ account: accountSnapshot.docs[0].data(), post });
        platformResults.push({ platform, status: "published", reason: null });
      }

      const failed = platformResults.some((item) => item.status === "failed");
      await doc.ref.update({
        status: failed ? "failed" : "published",
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
        publishResults: platformResults,
        failureReason: failed ? platformResults.filter((item) => item.status === "failed").map((item) => `${item.platform}: ${item.reason}`).join("; ") : null
      });

      await db.collection("publishLogs").add({
        postId: doc.id,
        status: failed ? "failed" : "published",
        results: platformResults,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      results.push({ postId: doc.id, status: failed ? "failed" : "published" });
    } catch (error) {
      await doc.ref.update({
        status: "failed",
        failureReason: error.message,
        publishedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await db.collection("publishLogs").add({
        postId: doc.id,
        status: "failed",
        reason: error.message,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      results.push({ postId: doc.id, status: "failed", reason: error.message });
    }
  }

  return results;
};
