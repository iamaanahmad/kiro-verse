import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

const hasAdminConfig = 
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
  process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!getApps().length) {
  if (hasAdminConfig) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error) {
      console.error('Firebase admin initialization error', error);
    }
  } else {
    console.warn("Firebase Admin credentials not set. Skipping initialization.");
  }
}

let adminDb, adminAuth;

if (getApps().length > 0) {
  adminDb = admin.firestore();
  adminAuth = admin.auth();
} else {
  // Provide mock/dummy objects if Firebase admin is not initialized
  // This prevents the app from crashing during development if keys are not set
  adminDb = {
    collection: () => ({
      doc: () => ({
        get: () => Promise.resolve({ exists: false, data: () => null }),
        set: () => Promise.resolve(),
      }),
    }),
  };
  adminAuth = {};
}


export { adminDb, adminAuth };