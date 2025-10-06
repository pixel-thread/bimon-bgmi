"use client";

import { useState, useRef, useEffect } from "react";
import { auth, db } from "@/src/lib/firebase";
import { signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface PhoneAuthProps {
  onVerificationSuccess: () => void;
}

export default function PhoneAuth({ onVerificationSuccess }: PhoneAuthProps) {
  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!recaptchaVerifierRef.current) {
      console.log("Initializing reCAPTCHA...");
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => console.log("reCAPTCHA verified"),
          "expired-callback": () => {
            console.log("reCAPTCHA expired");
            setError("reCAPTCHA expired, please try again.");
          },
        }
      );
      recaptchaVerifierRef.current
        .render()
        .then(() => console.log("reCAPTCHA rendered"));
    }
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);

  const sendVerificationCode = async (phone: string) => {
    console.log("Checking phone number:", phone);
    const phoneDoc = doc(db, "authorized_numbers", phone);
    console.log("Looking up document:", phoneDoc.path);
    const phoneSnap = await getDoc(phoneDoc);
    console.log(
      "Document exists:",
      phoneSnap.exists(),
      "Data:",
      phoneSnap.data()
    );

    if (!phoneSnap.exists()) {
      throw new Error("This phone number is not authorized.");
    }

    if (!recaptchaVerifierRef.current) {
      throw new Error("reCAPTCHA not initialized");
    }

    console.log("Sending code to:", phone);
    const result = await signInWithPhoneNumber(
      auth,
      phone,
      recaptchaVerifierRef.current
    );
    console.log("Code sent successfully");
    return result;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    console.log("Send Code clicked");

    try {
      const result = await sendVerificationCode(phoneNumber);
      setConfirmationResult(result);
      setStep("code");
    } catch (err: any) {
      console.error("Send Code error:", err);
      setError("Failed to send code: " + err.message);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    console.log("Verify Code clicked");

    try {
      if (!confirmationResult) {
        throw new Error("No confirmation result available.");
      }
      await confirmationResult.confirm(verificationCode);
      console.log("Verification successful");
      onVerificationSuccess();
    } catch (err: any) {
      console.error("Verify Code error:", err);
      setError("Invalid code: " + err.message);
    }
  };

  return (
    <div>
      {step === "phone" ? (
        <form onSubmit={handleSendCode}>
          <div className="mb-4">
            <label className="block text-sm font-medium">
              Enter Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+911234567890"
              className="mt-1 w-full rounded-md border p-2"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white"
          >
            Send Code
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode}>
          <div className="mb-4">
            <label className="block text-sm font-medium">
              Enter Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="123456"
              className="mt-1 w-full rounded-md border p-2"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white"
          >
            Verify Code
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-red-600">{error}</p>}
      <div id="recaptcha-container"></div>
    </div>
  );
}
