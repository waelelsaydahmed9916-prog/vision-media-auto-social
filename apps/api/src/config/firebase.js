import admin from "firebase-admin";
import { env } from "./env.js";

const hasFirebaseCredentials =
  env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey;
const hasFirebaseProject = env.firebase.projectId;

if (!admin.apps.length && hasFirebaseProject) {
  const baseConfig = { projectId: env.firebase.projectId, storageBucket: env.firebase.storageBucket };

  admin.initializeApp({
    ...baseConfig,
    credential: hasFirebaseCredentials
      ? admin.credential.cert({
          projectId: env.firebase.projectId,
          clientEmail: env.firebase.clientEmail,
          privateKey: env.firebase.privateKey
        })
      : admin.credential.applicationDefault()
  });
}

const unavailable = () => {
  throw new Error("Firebase is not configured. Add Firebase service credentials to apps/api/.env.");
};

export const db = hasFirebaseProject ? admin.firestore() : { collection: unavailable };
export const bucket = hasFirebaseProject ? admin.storage().bucket() : { file: unavailable };
export const firebaseReady = hasFirebaseProject;
export { admin };
