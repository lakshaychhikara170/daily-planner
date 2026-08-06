import admin from 'firebase-admin';

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
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

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists || !userDoc.data().isAdmin) {
      return res.status(403).json({ message: "Forbidden: Not an admin" });
    }

    const auth = admin.auth();
    // Fetch up to 1000 users for the admin dashboard
    const listUsersResult = await auth.listUsers(1000);
    const usersList = await Promise.all(listUsersResult.users.map(async (userRecord) => {
      // Fetch custom claims/flags from firestore
      const uDoc = await db.collection('users').doc(userRecord.uid).get();
      const uData = uDoc.exists ? uDoc.data() : {};
      
      return {
        id: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        createdAt: userRecord.metadata.creationTime,
        lastSignIn: userRecord.metadata.lastSignInTime,
        isPro: uData.isPro || false,
        isBanned: uData.isBanned || false,
        isAdmin: uData.isAdmin || false
      };
    }));

    return res.status(200).json({ users: usersList });
  } catch (error) {
    console.error("Admin Users Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
