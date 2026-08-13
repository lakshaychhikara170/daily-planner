import React, { createContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

export const AuthContext = createContext();

// ─── Hardcoded allowlists (guaranteed fallback) ───────────────────────────────
const ADMIN_EMAILS = ['22tailedanime@gmail.com'];
const PRO_EMAILS   = ['22tailedanime@gmail.com'];

// ─── LocalStorage cache so status shows instantly on every refresh ────────────
const setCachedStatus = (uid, isPro, isAdmin) => {
  try { localStorage.setItem(`exec_status_${uid}`, JSON.stringify({ isPro, isAdmin })); } catch {}
};
const getCachedStatus = (uid) => {
  try {
    const raw = localStorage.getItem(`exec_status_${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    getRedirectResult(auth).catch((err) => console.error("Redirect login error:", err));

    let unsubscribeDoc = null; // real-time Firestore listener

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous Firestore listener if user changes
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (currentUser) {
        setUser(currentUser);

        // Apply cached values immediately (no flash of "Free")
        const cached = getCachedStatus(currentUser.uid);
        if (cached) {
          setIsPro(cached.isPro);
          setIsAdmin(cached.isAdmin);
        }

        if (db) {
          const userDocRef = doc(db, 'users', currentUser.uid);

          // ── Real-time listener: fires immediately + on every Firestore change ──
          unsubscribeDoc = onSnapshot(userDocRef, async (snap) => {
            if (!snap.exists()) {
              // First-time user — create their doc
              await setDoc(userDocRef, {
                email: currentUser.email,
                isPro: false,
                isAdmin: false,
                isBanned: false,
                createdAt: new Date().toISOString()
              });
              // The snapshot will fire again after setDoc, so we'll get the update
              return;
            }

            const data = snap.data();

            if (data.isBanned) {
              alert("Your account has been banned.");
              await signOut(auth);
              setUser(null); setIsPro(false); setIsAdmin(false);
              setLoading(false);
              return;
            }

            // Merge Firestore status with email allowlist
            const proFinal   = data.isPro   === true || PRO_EMAILS.includes(currentUser.email?.toLowerCase());
            const adminFinal = data.isAdmin === true || ADMIN_EMAILS.includes(currentUser.email?.toLowerCase());

            setIsPro(proFinal);
            setIsAdmin(adminFinal);
            setCachedStatus(currentUser.uid, proFinal, adminFinal);

            console.log(`[Auth] ${currentUser.email} → isPro:${proFinal} isAdmin:${adminFinal}`);
            setLoading(false);
          }, (error) => {
            // Firestore read failed — fall back to email allowlist
            console.error("[Auth] Firestore listener error:", error);
            const proFinal   = PRO_EMAILS.includes(currentUser.email?.toLowerCase());
            const adminFinal = ADMIN_EMAILS.includes(currentUser.email?.toLowerCase());
            setIsPro(proFinal);
            setIsAdmin(adminFinal);
            setCachedStatus(currentUser.uid, proFinal, adminFinal);
            setLoading(false);
          });

        } else {
          // No Firestore — email allowlist only
          const proFinal   = PRO_EMAILS.includes(currentUser.email?.toLowerCase());
          const adminFinal = ADMIN_EMAILS.includes(currentUser.email?.toLowerCase());
          setIsPro(proFinal);
          setIsAdmin(adminFinal);
          setLoading(false);
        }

      } else {
        setUser(null);
        setIsPro(false);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("Firebase not configured");
    return signInWithPopup(auth, new GoogleAuthProvider());
  };

  const loginWithEmail = async (email, password) => {
    if (!auth) throw new Error("Firebase not configured");
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signupWithEmail = async (email, password) => {
    if (!auth) throw new Error("Firebase not configured");
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (!auth) return;
    return signOut(auth);
  };

  const resetPassword = async (email) => {
    if (!auth) throw new Error("Firebase not configured");
    return sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ 
      user, isPro, isAdmin, loading, deferredPrompt,
      loginWithGoogle, loginWithEmail, signupWithEmail, logout, resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
