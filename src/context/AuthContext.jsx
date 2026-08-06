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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return; // Firebase not configured yet
    }

    // Handle Redirect Result for strict browsers (Brave, Safari)
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.log("Redirect login successful.");
      }
    }).catch((err) => {
      console.error("Redirect login error:", err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && db) {
        // Fetch user data from Firestore to check Pro/Admin/Ban status
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.isBanned) {
              alert("Your account has been banned due to a violation of our terms of service.");
              signOut(auth);
              setUser(null);
              setIsPro(false);
              setIsAdmin(false);
              setLoading(false);
              return;
            }
            setUser(currentUser);
            setIsPro(data.isPro || false);
            setIsAdmin(data.isAdmin || false);
          } else {
            // Create user document if it doesn't exist
            await setDoc(userDocRef, {
              email: currentUser.email,
              isPro: false,
              isAdmin: false,
              isBanned: false,
              createdAt: new Date().toISOString()
            });
            setUser(currentUser);
            setIsPro(false);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(currentUser);
        }
      } else {
        setUser(null);
        setIsPro(false);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("Firebase not configured");
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
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
