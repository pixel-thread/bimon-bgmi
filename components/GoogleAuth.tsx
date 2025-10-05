"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface GoogleAuthProps {
  onVerificationSuccess: () => void;
}

export default function GoogleAuth({ onVerificationSuccess }: GoogleAuthProps) {
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const provider = new GoogleAuthProvider();

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;

      if (!userEmail) {
        throw new Error("No email found in Google account.");
      }

      // Check if email is authorized
      const emailDoc = doc(db, "authorized_emails", userEmail);
      const emailSnap = await getDoc(emailDoc);

      if (!emailSnap.exists()) {
        await auth.signOut(); // Sign out unauthorized users
        throw new Error("This email is not authorized to access the form.");
      }

      setUser(result.user);
      onVerificationSuccess();
    } catch (err: any) {
      console.error("Google Sign-In error:", err);
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    setUser(null);
    setError("");
    window.location.href = "/login";
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser && currentUser.email) {
        const emailDoc = doc(db, "authorized_emails", currentUser.email);
        const emailSnap = await getDoc(emailDoc);
        if (emailSnap.exists()) {
          setUser(currentUser);
        } else {
          await auth.signOut();
          setError("This email is not authorized.");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {!user ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">BGMI Tournament Form</h1>
          <p className="mb-4">Please sign in with an authorized Google account.</p>
          <button
            onClick={handleGoogleSignIn}
            className="w-64 rounded-md bg-red-600 px-4 py-2 text-white flex items-center justify-center gap-2 hover:bg-red-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="24px"
              height="24px"
            >
              <path fill="#4285F4" d="M44 20H24v8h12c-1 5-5 9-10 10v-8H12v-4h12v-8h8v4h12c0-8-6-14-14-14S10 12 10 20h8v4H4c0-10 8-18 18-18s18 8 18 18z"/>
            </svg>
            Sign in with Google
          </button>
          {error && <p className="mt-4 text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome, {user.email}!</h1>
          <p>You're authorized to access the form.</p>
          <button
            onClick={handleSignOut}
            className="mt-4 w-64 rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}