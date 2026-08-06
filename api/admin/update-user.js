import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin only once
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    initializeApp({
      credential: cert(serviceAccount)
    });
  } catch (error) {
    console.error("Firebase Admin initialization failed.", error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { adminUid, targetUid, action } = req.body;

  if (!adminUid || !targetUid || !action) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const db = getFirestore();
    const adminDoc = await db.collection('users').doc(adminUid).get();
    
    if (!adminDoc.exists || !adminDoc.data().isAdmin) {
      return res.status(403).json({ message: "Forbidden: Not an admin" });
    }

    if (adminUid === targetUid) {
      return res.status(400).json({ message: "Cannot modify your own account" });
    }

    if (action === 'ban' || action === 'unban') {
      await db.collection('users').doc(targetUid).update({
        isBanned: action === 'ban'
      });
    } else if (action === 'grant_pro' || action === 'revoke_pro') {
      await db.collection('users').doc(targetUid).update({
        isPro: action === 'grant_pro'
      });
    }

    return res.status(200).json({ message: `Successfully executed ${action} on ${targetUid}` });
  } catch (error) {
    console.error("Admin Update User Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
