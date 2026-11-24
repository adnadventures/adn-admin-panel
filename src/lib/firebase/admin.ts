import "server-only";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const isNew = getApps().length === 0;

const app = isNew
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    })
  : getApp();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
if (isNew) {
  // settings() may only be called once, so it's guarded against hot reload
  adminDb.settings({ ignoreUndefinedProperties: true });
}