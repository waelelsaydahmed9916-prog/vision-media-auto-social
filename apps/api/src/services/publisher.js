import { admin, db } from "../config/firebase.js";
import { providers } from "./socialProviders.js";

const serializeError = (error) =>
  error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || "Unknown publish error";

export const publishDuePosts = async () => {
  const now = admin.firestore.Timestamp.now();
  const snapshot = await db
    .collection("posts")
    .where("status", "==", "scheduled")
    .where("scheduledAt", "<=", now)
    .limit(25)
    .get();

  const results = [];

  for (const doc of snapshot.docs) {
    const locked = await db.runTransaction(async (transaction) => {
      const fresh = await transaction.get(doc.ref);
      if (!fresh.exists || fresh.data().status !== "scheduled") return false;
      transaction.update(doc.ref, {
        status: "processing",
        processingAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return true;
    });

    if (!locked) continue;

    const postSnapshot = await doc.ref.get();
    const post = { id: doc.id, ...postSnapshot.data() };
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

        try {
          const response = await provider.publish({ account: accountSnapshot.docs[0].data(), post });
          platformResults.push({ platform, status: "published", providerId: response?.data?.id || response?.data?.data?.id || null, reason: null });
        } catch (error) {
          platformResults.push({ platform, status: "failed", reason: serializeError(error) });
        }
      }

      const failed = platformResults.some((item) => item.status === "failed");
      const finalStatus = failed ? "failed" : "published";
      await doc.ref.update({
        status: finalStatus,
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
        publishResults: platformResults,
        failureReason: failed ? platformResults.filter((item) => item.status === "failed").map((item) => `${item.platform}: ${item.reason}`).join("; ") : null
      });

      await db.collection("publishLogs").add({
        postId: doc.id,
        status: finalStatus,
        results: platformResults,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      results.push({ postId: doc.id, status: finalStatus, results: platformResults });
    } catch (error) {
      await doc.ref.update({
        status: "failed",
        failureReason: serializeError(error),
        publishedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await db.collection("publishLogs").add({
        postId: doc.id,
        status: "failed",
        reason: serializeError(error),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      results.push({ postId: doc.id, status: "failed", reason: serializeError(error) });
    }
  }

  return results;
};
