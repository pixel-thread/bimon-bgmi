"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiPhone, FiLock, FiLoader, FiAlertCircle } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  error?: string | null;
  onError?: (error: string | null, phoneNumber?: string) => void;
  onSubmit?: (phoneNumber: string, password: string) => void;
}

export default function LoginForm({ error: initialError, onError, onSubmit }: LoginFormProps) {
  const [error, setError] = useState<string | null>(initialError || null);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const router = useRouter();

  const parseErrorMessage = (errorMsg: string | null) => {
    setPhoneError(null);
    setOtpError(null);
    if (!errorMsg) return;
    if (errorMsg.includes("10 digits") || errorMsg.includes("Unauthorized")) {
      setPhoneError(errorMsg);
    } else if (errorMsg.includes("Invalid code") || errorMsg.includes("Code expired")) {
      setOtpError(errorMsg);
    } else {
      setOtpError(errorMsg);
    }
  };

  useEffect(() => {
    if (initialError) {
      setError(initialError);
      parseErrorMessage(initialError);
    }
  }, [initialError]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPhoneError(null);
    setOtpError(null);

    const formData = new FormData(e.currentTarget);
    const rawPhoneNumber = formData.get("phoneNumber") as string;
    if (rawPhoneNumber.length !== 10) {
      setPhoneError("Phone number must be 10 digits");
      setLoading(false);
      return;
    }
    const normalizedPhoneNumber = `+91${rawPhoneNumber.replace(/\D/g, "")}`;
    const password = (formData.get("password") as string) || "";

    if (!showOtp) {
      // First submission - show OTP field
      setShowOtp(true);
    } else if (onSubmit) {
      // Second submission with OTP
      onSubmit(normalizedPhoneNumber, password);
    }

    setLoading(false);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
            Phone Number (India)
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiPhone className={`h-5 w-5 ${phoneError ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
            <div className="absolute inset-y-0 left-10 flex items-center border-r pr-2">
              <span className={`${phoneError ? 'text-red-500' : 'text-gray-500'} sm:text-sm`}>+91</span>
            </div>
            <Input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={phoneNumber}
              onChange={(e) => {
                let value = e.target.value.replace(/^\+91/, "").replace(/\D/g, "");
                if (value.length > 10) value = value.slice(0, 10);
                setPhoneNumber(value);
                if (phoneError && value.length === 10) setPhoneError(null);
              }}
              className={cn("pl-24", phoneError ? "border-red-500 focus-visible:ring-red-500" : undefined)}
              placeholder="Enter 10-digit number"
              required
            />
          </div>
          {phoneError && (
            <div className="flex items-center text-sm text-red-600 mt-1">
              <FiAlertCircle className="mr-1 h-4 w-4 flex-shrink-0" />
              <span>{phoneError}</span>
            </div>
          )}
        </div>

        {showOtp && (
          <div className="space-y-4">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              OTP
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className={`h-5 w-5 ${otpError ? 'text-red-500' : 'text-gray-400'}`} />
              </div>
              <Input
  type="password"
  id="password"
  name="password"
  className={cn("pl-10", otpError ? "border-red-500 focus-visible:ring-red-500" : undefined)}
  placeholder="Enter OTP"
  required
/>

            </div>
            {otpError && (
              <div className="flex items-center text-sm text-red-600 mt-1">
                <FiAlertCircle className="mr-1 h-4 w-4 flex-shrink-0" />
                <span>{otpError}</span>
              </div>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading && <FiLoader className="animate-spin mr-2 h-4 w-4" />}
          {loading ? "Processing..." : showOtp ? "Login" : "Continue"}
        </Button>
      </form>
    </div>
  );
}