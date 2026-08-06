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
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const { adminUid, targetUid, action } = req.body || {};

    if (!adminUid || !targetUid || !action) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (adminUid === targetUid) {
      return res.status(400).json({ message: "Cannot modify your own account" });
    }

    const db = getFirestore();
    const adminDoc = await db.collection('users').doc(adminUid).get();
    
    if (!adminDoc.exists || !adminDoc.data().isAdmin) {
      return res.status(403).json({ message: "Forbidden: Not an admin" });
    }

    const targetRef = db.collection('users').doc(targetUid);

    switch(action) {
      case 'ban':
        await targetRef.set({ isBanned: true }, { merge: true });
        break;
      case 'unban':
        await targetRef.set({ isBanned: false }, { merge: true });
        break;
      case 'grant_pro':
        await targetRef.set({ isPro: true, proUpgradedAt: new Date().toISOString() }, { merge: true });
        break;
      case 'revoke_pro':
        await targetRef.set({ isPro: false }, { merge: true });
        break;
      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    return res.status(200).json({ message: "Action successful" });
  } catch (error) {
    console.error("Update User Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
