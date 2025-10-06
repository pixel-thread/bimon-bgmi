// components/EnhancedAuth.tsx
"use client";

import React, { useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";
import {
  IconBrandGoogle,
  IconLock,
  IconArrowLeft,
  IconUsers,
} from "@tabler/icons-react";
import { auth, db } from "@/src/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { SUPER_ADMIN_EMAIL } from "@/src/config/adminAccess";

interface EnhancedAuthProps {
  onVerificationSuccess?: () => void;
}

export function EnhancedAuth({ onVerificationSuccess }: EnhancedAuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState<"login" | "signup" | "reset">("login");
  const [isNewUser, setIsNewUser] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;

      if (!userEmail) {
        throw new Error("No email found in Google account.");
      }

      // Auto-add super admin if it's the super admin email
      if (userEmail === SUPER_ADMIN_EMAIL) {
        await setDoc(doc(db, "authorized_emails", userEmail), {
          authorized: true,
          role: "super_admin",
          addedAt: new Date().toISOString(),
        });
        console.log("✅ Super admin email added to authorized_emails");
      }

      // Check if email is authorized
      const emailDoc = doc(db, "authorized_emails", userEmail);
      const emailSnap = await getDoc(emailDoc);

      if (!emailSnap.exists()) {
        await auth.signOut();
        throw new Error(
          "This email is not authorized to access the admin panel."
        );
      }

      if (onVerificationSuccess) {
        onVerificationSuccess();
      }
    } catch (err: any) {
      console.error("Google Sign-In error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate email format
      if (!email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      // Check if email is authorized first
      const emailDoc = doc(db, "authorized_emails", email);
      const emailSnap = await getDoc(emailDoc);

      if (!emailSnap.exists()) {
        throw new Error(
          "This email is not authorized to access the admin panel."
        );
      }

      let result;

      if (step === "signup") {
        // Create new user
        result = await createUserWithEmailAndPassword(auth, email, password);
        setSuccess("Account created successfully!");
      } else {
        // Sign in existing user
        result = await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Signed in successfully!");
      }

      if (onVerificationSuccess) {
        onVerificationSuccess();
      }
    } catch (err: any) {
      console.error("Email auth error:", err);

      // Handle specific Firebase errors
      if (err.code === "auth/user-not-found") {
        setError(
          "No account found with this email. Would you like to create one?"
        );
        setIsNewUser(true);
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Account already exists. Please sign in instead.");
        setStep("login");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters long.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent! Check your inbox.");
      setStep("login");
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError("Failed to send password reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "signup":
        return "Create Account";
      case "reset":
        return "Reset Password";
      default:
        return "Admin Access";
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case "signup":
        return "Create your admin account";
      case "reset":
        return "Enter your email to reset password";
      default:
        return "Sign in to access the tournament admin panel";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="shadow-2xl mx-auto w-full max-w-md rounded-2xl bg-white p-8 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            {getStepTitle()}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {getStepSubtitle()}
          </p>
        </div>

        {step === "reset" ? (
          // Password Reset Form
          <div className="space-y-6">
            <LabelInputContainer>
              <Label htmlFor="reset-email">Email Address</Label>
              <Input
                id="reset-email"
                placeholder="your-email@gmail.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </LabelInputContainer>

            <button
              onClick={handlePasswordReset}
              disabled={loading}
              className="group/btn relative block h-11 w-full rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              <div className="flex items-center justify-center space-x-2">
                <IconLock className="h-4 w-4" />
                <span>Send Reset Email</span>
              </div>
              <BottomGradient />
            </button>

            <button
              onClick={() => {
                setStep("login");
                setError("");
                setSuccess("");
              }}
              className="flex items-center justify-center space-x-2 w-full text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <IconArrowLeft className="h-4 w-4" />
              <span>Back to sign in</span>
            </button>
          </div>
        ) : (
          // Login/Signup Form
          <form className="space-y-6" onSubmit={handleEmailSubmit}>
            <LabelInputContainer>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                placeholder="your-email@gmail.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </LabelInputContainer>

            <button
              className="group/btn relative block h-11 w-full rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              <div className="flex items-center justify-center space-x-2">
                <IconLock className="h-4 w-4" />
                <span>{step === "signup" ? "Create Account" : "Sign In"}</span>
              </div>
              <BottomGradient />
            </button>

            {/* Toggle between login/signup */}
            <div className="text-center space-y-2">
              {isNewUser && step === "login" && (
                <button
                  type="button"
                  onClick={() => setStep("signup")}
                  className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Create new account instead
                </button>
              )}

              {step === "signup" && (
                <button
                  type="button"
                  onClick={() => {
                    setStep("login");
                    setIsNewUser(false);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Already have an account? Sign in
                </button>
              )}

              {step === "login" && (
                <button
                  type="button"
                  onClick={() => setStep("reset")}
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-slate-900 px-4 text-slate-500 dark:text-slate-400">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              className="group/btn shadow-lg relative flex h-11 w-full items-center justify-center space-x-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-medium text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition-all duration-200 disabled:opacity-50"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <IconBrandGoogle className="h-5 w-5 text-red-500" />
              <span>Sign in with Google</span>
              <BottomGradient />
            </button>
          </form>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">
              {success}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {loading && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
            <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
              {step === "reset" ? "Sending email..." : "Signing in..."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
