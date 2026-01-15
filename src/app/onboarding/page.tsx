"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import http from "@/src/utils/http";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { LoaderFive } from "@/src/components/ui/loader";
import { FiCheck, FiAlertCircle } from "react-icons/fi";
import { GameNameInput, validateDisplayName } from "@/src/components/common/GameNameInput";
import { getStoredReferralCode, clearStoredReferralCode } from "@/src/components/common/ReferralCapture";

export default function OnboardingPage() {
    const { user, refreshAuth } = useAuth();
    const { user: clerkUser } = useUser();
    const router = useRouter();
    const [userName, setUserName] = useState("");
    const [displayName, setDisplayName] = useState("");

    const [userNameError, setUserNameError] = useState("");
    const [displayNameError, setDisplayNameError] = useState("");
    const [isUserNameAutoFilled, setIsUserNameAutoFilled] = useState(false);



    // Auto-fill username with first name from Google
    useEffect(() => {
        if (clerkUser?.firstName && !userName) {
            let sanitized = clerkUser.firstName
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "");

            if (sanitized.length > 0 && sanitized.length < 3) {
                const randomNum = Math.floor(Math.random() * 900) + 100;
                sanitized = sanitized + randomNum;
            }

            if (sanitized.length >= 3) {
                setUserName(sanitized);
                setIsUserNameAutoFilled(true);
            }
        }
    }, [clerkUser?.firstName, userName]);

    // Validation for simple username
    const validateUsername = (value: string) => {
        if (value.length < 3) {
            return "Username must be at least 3 characters";
        }
        if (value.length > 30) {
            return "Username must be at most 30 characters";
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            return "Username can only contain letters, numbers, and underscores";
        }
        return "";
    };

    const { mutate: submitUsernames, isPending } = useMutation({
        mutationFn: (data: { userName: string; displayName: string; dateOfBirth?: string; referralCode?: string }) =>
            http.post("/onboarding", data),
        onSuccess: () => {
            // Clear stored referral code after successful signup
            clearStoredReferralCode();
            toast.success("Welcome to PUBGMI Tournament! Your account is ready.");
            refreshAuth();
            router.push("/?welcome=1");
        },
        onError: (err: { response?: { data?: { message?: string } } }) => {
            const message =
                err?.response?.data?.message || "Failed to set username. Please try again.";
            setUserNameError(message);
            toast.error(message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const usernameError = validateUsername(userName);
        const displayError = validateDisplayName(displayName);

        if (usernameError) {
            setUserNameError(usernameError);
        }
        if (displayError) {
            setDisplayNameError(displayError);
        }

        if (usernameError || displayError) {
            return;
        }

        setUserNameError("");
        setDisplayNameError("");

        // Get referral code from localStorage (if any)
        const referralCode = getStoredReferralCode() || undefined;

        submitUsernames({
            userName,
            displayName,
            referralCode,
        });
    };

    // If user is already onboarded, redirect to home
    if (user?.isOnboarded) {
        router.push("/");
        return null;
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black px-4 pt-4 pb-6">
            <div className="w-full max-w-md mx-auto">
                {/* Header Card */}
                <div className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50 dark:from-stone-900 dark:via-amber-950/30 dark:to-stone-800 rounded-2xl shadow-xl p-6 border border-amber-200/50 dark:border-stone-700">
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <img
                            src="/android-chrome-192x192.png"
                            alt="App Logo"
                            className="w-16 h-16 rounded-xl shadow-lg"
                        />
                    </div>

                    {/* Title */}
                    <h1 className="text-xl font-bold text-center text-slate-800 dark:text-slate-200 mb-1">
                        Welcome to PUBGMI
                    </h1>

                    {/* Description */}
                    <p className="text-center text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Copy bad paste ia <span className="font-semibold text-indigo-600 dark:text-indigo-400">ka kyrteng ba na BGMI</span>.
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Display Name (BGMI IGN) - Primary field */}
                        <GameNameInput
                            value={displayName}
                            onChange={setDisplayName}
                            error={displayNameError}
                            onErrorChange={setDisplayNameError}
                            disabled={isPending}
                            autoOpenTutorial={true}
                            readOnly={true}
                        />

                        {/* Simple Username - Secondary field (less prominent) */}
                        <div className="opacity-80">
                            <label
                                htmlFor="username"
                                className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
                            >
                                Name {isUserNameAutoFilled && <span className="text-slate-400 dark:text-slate-500">(from Google)</span>}
                            </label>
                            <Input
                                id="username"
                                type="text"
                                value={userName}
                                onChange={(e) => {
                                    if (!isUserNameAutoFilled) {
                                        setUserName(e.target.value);
                                        setUserNameError("");
                                    }
                                }}
                                placeholder="e.g. meban_ks"
                                className={`w-full text-sm ${userNameError
                                    ? "border-red-500 focus-visible:ring-red-500"
                                    : "focus-visible:ring-indigo-500"
                                    } ${isUserNameAutoFilled ? "bg-slate-100 dark:bg-slate-700 cursor-not-allowed" : ""}`}
                                disabled={isPending}
                                readOnly={isUserNameAutoFilled}
                            />
                            {userNameError && (
                                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                    <FiAlertCircle className="w-3.5 h-3.5" />
                                    {userNameError}
                                </p>
                            )}
                            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                                {isUserNameAutoFilled
                                    ? "Use this to search for your stats."
                                    : "Letters, numbers, and underscores only."}
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending || !userName.trim() || !displayName.trim() || !!displayNameError}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-2.5"
                        >
                            {isPending ? (
                                <LoaderFive text="Setting up..." />
                            ) : (
                                <>
                                    <FiCheck className="w-4 h-4 mr-2" />
                                    Continue to Tournament
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Footer text */}
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                    Phi lah ban change biang na profile page
                </p>
            </div>
        </div>
    );
}
