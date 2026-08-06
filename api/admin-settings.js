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
    // Safely parse URL to get uid (since req.query might be undefined in some Vercel environments)
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

    if (req.method === 'GET') {
      const settingsDoc = await db.collection('system').doc('settings').get();
      if (!settingsDoc.exists) {
        return res.status(200).json({ razorpayPrice: 499, paypalPrice: 9.99 });
      }
      return res.status(200).json(settingsDoc.data());
    }
    
    if (req.method === 'POST') {
      const { razorpayPrice, paypalPrice } = req.body || {};
      if (!razorpayPrice || !paypalPrice) {
         return res.status(400).json({ message: "Missing prices" });
      }
      await db.collection('system').doc('settings').set({
        razorpayPrice: Number(razorpayPrice),
        paypalPrice: Number(paypalPrice)
      }, { merge: true });
      return res.status(200).json({ message: "Settings updated successfully" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Admin Settings Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
