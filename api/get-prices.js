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
    const db = getFirestore();
    const settingsDoc = await db.collection('system').doc('settings').get();
    
    if (!settingsDoc.exists) {
      return res.status(200).json({ razorpayPrice: 49900, paypalPrice: 9.99 });
    }
    
    return res.status(200).json(settingsDoc.data());
  } catch (error) {
    console.error("Get Prices Error:", error);
    return res.status(200).json({ razorpayPrice: 49900, paypalPrice: 9.99 }); // Fallback
  }
}
