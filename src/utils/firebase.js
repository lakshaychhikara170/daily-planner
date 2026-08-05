import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQy4-o6qpmY-RPC0sEuZs-jHwgOk5ujhI",
  authDomain: "execute-pro-cffc7.firebaseapp.com",
  projectId: "execute-pro-cffc7",
  storageBucket: "execute-pro-cffc7.firebasestorage.app",
  messagingSenderId: "712694362574",
  appId: "1:712694362574:web:9a23758b96db18bf0e3b9f",
  measurementId: "G-NGCM2H3QCP"
};

// Initialize Firebase only if the config is provided
let app = null;
let auth = null;
let db = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "your-api-key-here") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    console.warn("Firebase API Key is missing. Cloud syncing and authentication are disabled.");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { app, auth, db };
