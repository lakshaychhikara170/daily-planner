import crypto from 'crypto';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin only once
if (!getApps().length) {
  try {
    // You MUST provide FIREBASE_SERVICE_ACCOUNT as a JSON string in your Vercel Environment Variables
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    initializeApp({
      credential: cert(serviceAccount)
    });
  } catch (error) {
    console.error("Firebase Admin initialization failed. Make sure FIREBASE_SERVICE_ACCOUNT is set.", error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { provider, uid, paymentDetails } = req.body;

  if (!uid || !provider || !paymentDetails) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    let isValid = false;

    if (provider === 'razorpay') {
      // 1. Verify Razorpay Signature
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;
      const secret = process.env.RAZORPAY_KEY_SECRET;

      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');

      if (generatedSignature === razorpay_signature) {
        isValid = true;
      }
    } else if (provider === 'paypal') {
      // 2. Verify PayPal Order (Server-to-Server)
      if (paymentDetails.orderID) {
        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        const paypalBaseUrl = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

        if (!clientId || !clientSecret) {
          console.error("PayPal credentials missing in backend.");
          return res.status(500).json({ message: "PayPal configuration error" });
        }

        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const orderRes = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${paymentDetails.orderID}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        });

        if (orderRes.ok) {
          const orderData = await orderRes.json();
          if (orderData.status === 'COMPLETED') {
            isValid = true;
          } else {
            console.warn(`PayPal order ${paymentDetails.orderID} not completed. Status: ${orderData.status}`);
          }
        } else {
          console.error("Failed to verify PayPal order from API", await orderRes.text());
        }
      }
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Payment verification failed (Nice try!)' });
    }

    // 3. Upgrade User in Firestore
    if (!getApps().length) {
      console.warn("Firebase Admin is not configured. Bypassing database update for local testing.");
      // We still return 200 so the frontend shows success during local testing
      return res.status(200).json({ message: 'Signature verified! (Database update bypassed due to missing Admin Keys)' });
    }

    const db = getFirestore();
    await db.collection('users').doc(uid).set({
      isPro: true,
      proUpgradedAt: new Date().toISOString(),
      provider: provider
    }, { merge: true });

    return res.status(200).json({ message: 'Successfully upgraded to Pro!' });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
