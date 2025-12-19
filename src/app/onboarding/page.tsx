"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import http from "@/src/utils/http";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { LoaderFive } from "@/src/components/ui/loader";
import { FiUser, FiCheck, FiAlertCircle } from "react-icons/fi";

export default function OnboardingPage() {
    const { user, refreshAuth } = useAuth();
    const router = useRouter();
    const [userName, setUserName] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [userNameError, setUserNameError] = useState("");
    const [displayNameError, setDisplayNameError] = useState("");

    // Validation for simple username (alphanumeric + underscore)
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

    // Validation for display name (any Unicode, just length check)
    const validateDisplayName = (value: string) => {
        if (value.length < 2) {
            return "IGN must be at least 2 characters";
        }
        if (value.length > 50) {
            return "IGN must be at most 50 characters";
        }
        return "";
    };

    const { mutate: submitUsernames, isPending } = useMutation({
        mutationFn: (data: { userName: string; displayName: string }) =>
            http.post("/onboarding", data),
        onSuccess: () => {
            toast.success("Welcome to PUBGMI Tournament! Your account is ready.");
            refreshAuth();
            router.push("/");
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
        submitUsernames({ userName, displayName });
    };

    // If user is already onboarded, redirect to home
    if (user?.isOnboarded) {
        router.push("/");
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
            <div className="w-full max-w-md">
                {/* Header Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <FiUser className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-200 mb-2">
                        Set Your Usernames
                    </h1>

                    {/* Description */}
                    <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
                        Thoh kyrteng <span className="font-semibold text-indigo-600 dark:text-indigo-400">kumjuh ha BGMI (IGN)</span>.
                    </p>

                    {/* Important notice */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
                        <div className="flex gap-3">
                            <FiAlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-700 dark:text-amber-300">
                                <p className="font-medium mb-1">Balei ban thoh da kyrteng kumjuh na bgmi?</p>
                                <p>Ban suk ban thoh points bad ban ym shah kick ha room</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Simple Username */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                            >
                                Simple Username (for system)
                            </label>
                            <Input
                                id="username"
                                type="text"
                                value={userName}
                                onChange={(e) => {
                                    setUserName(e.target.value);
                                    setUserNameError("");
                                }}
                                placeholder="e.g. meban_ks"
                                className={`w-full ${userNameError
                                    ? "border-red-500 focus-visible:ring-red-500"
                                    : "focus-visible:ring-indigo-500"
                                    }`}
                                disabled={isPending}
                                autoFocus
                            />
                            {userNameError && (
                                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                    <FiAlertCircle className="w-4 h-4" />
                                    {userNameError}
                                </p>
                            )}
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                3-30 characters. Letters, numbers, and underscores only.
                            </p>
                        </div>

                        {/* Display Name (BGMI IGN) */}
                        <div>
                            <label
                                htmlFor="displayName"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                            >
                                BGMI IGN (shown everywhere)
                            </label>
                            <Input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => {
                                    setDisplayName(e.target.value);
                                    setDisplayNameError("");
                                }}
                                placeholder="e.g. KŠツMeban"
                                className={`w-full ${displayNameError
                                    ? "border-red-500 focus-visible:ring-red-500"
                                    : "focus-visible:ring-indigo-500"
                                    }`}
                                disabled={isPending}
                            />
                            {displayNameError && (
                                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                    <FiAlertCircle className="w-4 h-4" />
                                    {displayNameError}
                                </p>
                            )}
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Enter exactly as shown in BGMI. Special characters allowed.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending || !userName.trim() || !displayName.trim()}
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
