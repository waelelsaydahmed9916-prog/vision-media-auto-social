import cron from "node-cron";
import { firebaseReady } from "../config/firebase.js";
import { publishDuePosts } from "../services/publisher.js";

let running = false;

export const startScheduler = () => {
  cron.schedule("* * * * *", async () => {
    if (!firebaseReady || running) return;
    running = true;
    try {
      await publishDuePosts();
    } catch (error) {
      console.error("Scheduler failed:", error);
    } finally {
      running = false;
    }
  });
};
