import cron from "node-cron";
import { firebaseReady } from "../config/firebase.js";
import { publishDuePosts } from "../services/publisher.js";

export const startScheduler = () => {
  cron.schedule("* * * * *", async () => {
    if (!firebaseReady) return;
    await publishDuePosts();
  });
};
