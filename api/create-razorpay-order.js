import Razorpay from 'razorpay';
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
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.error("Razorpay keys missing in environment");
    return res.status(500).json({ message: "Server configuration error" });
  }

  try {
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    let amountPaise = 49900; // Default fallback

    try {
      const db = getFirestore();
      const settingsDoc = await db.collection('system').doc('settings').get();
      if (settingsDoc.exists) {
        amountPaise = settingsDoc.data().razorpayPrice || 49900;
      }
    } catch (e) {
      console.warn("Could not fetch pricing from DB, using fallback", e);
    }

    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1 // Auto capture
    };

    if (options.amount < 100) {
      return res.status(400).json({ message: "Amount must be at least 100 paise" });
    }

    const order = await razorpay.orders.create(options);
    
    return res.status(200).json({ 
      id: order.id,
      currency: order.currency,
      amount: order.amount 
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    if (error.statusCode === 401 || (error.error && error.error.code === 'BAD_REQUEST_ERROR' && error.error.description.includes('authorized'))) {
      return res.status(401).json({ message: "Authentication Failed with Razorpay", error: error.message });
    }
    return res.status(500).json({ message: "Failed to create order", error: error.message });
  }
}
