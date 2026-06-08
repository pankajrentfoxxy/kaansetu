import admin from 'firebase-admin';

// Skip Firebase init in dev if credentials are not configured
const hasFirebaseCreds = process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PROJECT_ID !== 'dummy' &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_CLIENT_EMAIL;

if (!admin.apps.length) {
  if (hasFirebaseCreds) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } else {
    // Dev mode: initialize with no credentials (push notifications won't work but app runs)
    console.warn('[DEV] Firebase not configured — push notifications disabled');
    admin.initializeApp({ projectId: 'dev-placeholder' });
  }
}

export const firebaseAdmin = admin;

// Safe wrapper — returns null in dev instead of crashing
export async function sendPushNotification(token: string, title: string, body: string, data?: Record<string, string>) {
  if (!hasFirebaseCreds) {
    console.log(`[DEV] Push skipped → ${title}: ${body}`);
    return null;
  }
  try {
    return await admin.messaging().send({ token, notification: { title, body }, data });
  } catch (e) {
    console.error('[FCM]', e);
    return null;
  }
}
