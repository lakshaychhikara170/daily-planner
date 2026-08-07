import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
// import { getAuth } from 'firebase-admin/auth';

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
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const uid = url.searchParams.get('uid');

    if (!uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists || !userDoc.data().isAdmin) {
      return res.status(403).json({ message: "Forbidden: Not an admin" });
    }

    // Fetch users directly from Firestore instead of Auth to avoid Vercel edge runtime crashes
    const usersSnapshot = await db.collection('users').limit(1000).get();
    const usersList = [];
    
    usersSnapshot.forEach(doc => {
      const uData = doc.data();
      usersList.push({
        id: doc.id,
        email: uData.email || 'No Email',
        displayName: uData.displayName || 'Anonymous',
        isPro: uData.isPro || false,
        isBanned: uData.isBanned || false,
        isAdmin: uData.isAdmin || false,
        proUpgradedAt: uData.proUpgradedAt || null
      });
    });

    return res.status(200).json(usersList);
  } catch (error) {
    console.error("Admin Users Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
