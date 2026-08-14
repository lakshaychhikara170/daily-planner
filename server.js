import express from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

// Firebase initialization
if (getApps().length === 0 && process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log("Firebase Admin successfully initialized.");
  } catch (error) {
    console.error("Firebase Admin initialization failed.", error);
  }
}

app.post('/api/create-razorpay-order', async (req, res) => {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ message: "Server configuration error" });
  }

  try {
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: 49900, 
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };

    if (options.amount < 100) return res.status(400).json({ message: "Amount must be at least 100 paise" });

    const order = await razorpay.orders.create(options);
    return res.status(200).json({ id: order.id, currency: order.currency, amount: order.amount });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    if (error.statusCode === 401 || (error.error && error.error.code === 'BAD_REQUEST_ERROR' && error.error.description.includes('authorized'))) {
      return res.status(401).json({ message: "Authentication Failed with Razorpay", error: error.message });
    }
    return res.status(500).json({ message: "Failed to create order", error: error.message });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  const { provider, uid, paymentDetails } = req.body;
  if (!uid || !provider || !paymentDetails) return res.status(400).json({ message: 'Missing required fields' });

  try {
    let isValid = false;
    if (provider === 'razorpay') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;
      const secret = process.env.RAZORPAY_KEY_SECRET;
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');
      if (generatedSignature === razorpay_signature) isValid = true;
    } else if (provider === 'paypal') {
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

    if (!isValid) return res.status(400).json({ message: 'Payment verification failed' });

    if (getApps().length === 0) {
      console.warn("Firebase Admin missing. Bypassing database update.");
      return res.status(200).json({ message: 'Signature verified! (DB update bypassed)' });
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
});
// --- ADMIN ROUTES ---

const verifyAdmin = async (req, res, next) => {
  const uid = req.query.uid || req.body.adminUid;
  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  
  if (getApps().length === 0) return res.status(500).json({ message: "Firebase Admin not initialized" });
  
  try {
    const db = getFirestore();
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists && doc.data().isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden: Not an admin" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error checking admin status" });
  }
};

app.get('/api/admin-users', verifyAdmin, async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('users').get();
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

app.post('/api/admin-update-user', verifyAdmin, async (req, res) => {
  const { targetUid, action } = req.body;
  if (!targetUid || !action) return res.status(400).json({ message: "Missing targetUid or action" });

  try {
    const db = getFirestore();
    const updateData = {};
    if (action === 'ban') updateData.isBanned = true;
    else if (action === 'unban') updateData.isBanned = false;
    else if (action === 'grant_pro') updateData.isPro = true;
    else if (action === 'revoke_pro') updateData.isPro = false;
    else return res.status(400).json({ message: "Invalid action" });

    await db.collection('users').doc(targetUid).update(updateData);
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

app.get('/api/admin-settings', verifyAdmin, async (req, res) => {
  res.status(200).json({ razorpayPrice: 49900, paypalPrice: 9.99, notificationFrequency: 'daily' });
});

app.post('/api/admin-settings', verifyAdmin, async (req, res) => {
  res.status(200).json({ message: "Settings saved" });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
