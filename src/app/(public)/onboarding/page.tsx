"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Avatar, Chip } from "@heroui/react";
import { useUser } from "@clerk/nextjs";
import { Gamepad2, Loader2, CheckCircle } from "lucide-react";
import { PubgmiLogo } from "@/components/common/pubgmi-logo";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
    GameNameInput,
    validateDisplayName,
} from "@/components/common/GameNameInput";
import { useIGNTutorial } from "@/components/common/IGNTutorialModal";
import { useAuthUser } from "@/hooks/use-auth-user";
import { WhatsAppJoinModal } from "@/components/common/WhatsAppJoinModal";

/**
 * /onboarding — New user setup flow.
 * Single-page: paste Game Name + auto-filled username → submit.
 * Already-onboarded users are redirected to /vote.
 */
export default function OnboardingPage() {
    const { user: clerkUser, isLoaded } = useUser();
    const router = useRouter();
    const { user: authUser } = useAuthUser();

    const [displayName, setDisplayName] = useState("");
    const [displayNameError, setDisplayNameError] = useState("");
    const [userName, setUserName] = useState("");
    const [isUserNameAutoFilled, setIsUserNameAutoFilled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showWhatsApp, setShowWhatsApp] = useState(false);
    const [justCompleted, setJustCompleted] = useState(false);
    const [isCheckingIGN, setIsCheckingIGN] = useState(false);
    const ignCheckTimer = useRef<NodeJS.Timeout | null>(null);
    const ignTutorial = useIGNTutorial({ autoOpen: true });

    // Redirect already-onboarded users to home
    useEffect(() => {
        if (authUser?.isOnboarded && !justCompleted) {
            router.push("/vote");
        }
    }, [authUser?.isOnboarded, justCompleted, router]);

    // Auto-fill username from Clerk/Google name
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

    // Debounced duplicate IGN check
    const checkDuplicateIGN = useCallback((name: string) => {
        if (ignCheckTimer.current) clearTimeout(ignCheckTimer.current);
        if (!name || name.length < 2) {
            setIsCheckingIGN(false);
            return;
        }

        setIsCheckingIGN(true);
        ignCheckTimer.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/onboarding/check-ign?displayName=${encodeURIComponent(name)}`
                );
                const json = await res.json();
                if (json.data?.isTaken) {
                    setDisplayNameError(
                        "This Game Name is already taken by another player."
                    );
                }
            } catch {
                // Silently fail — backend will catch on submit
            } finally {
                setIsCheckingIGN(false);
            }
        }, 500);
    }, []);

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (ignCheckTimer.current) clearTimeout(ignCheckTimer.current);
        };
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const displayError = validateDisplayName(displayName);
        if (displayError) {
            setDisplayNameError(displayError);
            return;
        }
        if (!userName.trim() || userName.trim().length < 3) {
            toast.error("Username must be at least 3 characters");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ displayName: displayName.trim() }),
            });

            if (!res.ok) {
                const json = await res.json();
                setDisplayNameError(json.message || "Something went wrong");
                return;
            }

            setJustCompleted(true);
            toast.success("Welcome to PUBGMI! 🎮");
            // Show WhatsApp groups before redirecting
            setShowWhatsApp(true);
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!isLoaded) {
        return (
            <div className="flex min-h-dvh items-center justify-center">
                <PubgmiLogo variant="hero" className="text-3xl" />
            </div>
        );
    }

    // Show WhatsApp groups after successful onboarding
    if (showWhatsApp) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4">
                <WhatsAppJoinModal
                    isOpen={true}
                    onClose={() => {
                        router.push("/vote");
                        router.refresh();
                    }}
                    mandatory={true}
                />
            </div>
        );
    }

    return (
        <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4">
            {/* IGN Tutorial Modal */}
            {ignTutorial.Modal}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="rounded-2xl border border-divider bg-background/80 backdrop-blur-xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-background px-6 pt-8 pb-6 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
                                <Gamepad2 className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-xl font-bold">Welcome to PUBGMI</h1>
                        <p className="text-sm text-foreground/50 mt-1">
                            Copy bad paste ia{" "}
                            <span className="font-semibold text-primary">
                                ka kyrteng ba na BGMI
                            </span>
                        </p>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
                        {/* Clerk user info */}
                        {clerkUser && (
                            <div className="flex items-center gap-3 rounded-xl bg-default-100 p-3 -mt-1">
                                <Avatar
                                    src={clerkUser.imageUrl}
                                    name={
                                        clerkUser.username ||
                                        clerkUser.firstName ||
                                        "User"
                                    }
                                    size="sm"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium truncate">
                                            {clerkUser.firstName || clerkUser.username}
                                        </p>
                                        {isUserNameAutoFilled && (
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color="success"
                                                startContent={
                                                    <CheckCircle className="h-3 w-3" />
                                                }
                                            >
                                                {userName}
                                            </Chip>
                                        )}
                                    </div>
                                    <p className="text-xs text-foreground/40">
                                        {clerkUser.primaryEmailAddress?.emailAddress}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Game Name paste input */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <label className="text-sm font-medium text-foreground/70">
                                    Game Name
                                </label>
                                {ignTutorial.HelpButton}
                            </div>
                            <GameNameInput
                                value={displayName}
                                onChange={(val) => {
                                    setDisplayName(val);
                                    if (val.length >= 2) {
                                        checkDuplicateIGN(val);
                                    }
                                }}
                                error={displayNameError}
                                onErrorChange={setDisplayNameError}
                                disabled={isSubmitting}
                            />
                            <p className="mt-2 text-xs text-foreground/40">
                                <button
                                    type="button"
                                    onClick={ignTutorial.openModal}
                                    className="text-primary hover:underline font-medium"
                                >
                                    Kumno ban copy?
                                </button>
                                {" / "}
                                <button
                                    type="button"
                                    onClick={ignTutorial.openModal}
                                    className="text-primary hover:underline font-medium"
                                >
                                    Need help?
                                </button>
                            </p>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            color="primary"
                            className="w-full font-medium"
                            size="lg"
                            isDisabled={
                                isSubmitting ||
                                !displayName.trim() ||
                                !!displayNameError ||
                                isCheckingIGN
                            }
                            isLoading={isSubmitting}
                        >
                            {isSubmitting ? "Setting up..." : "Continue to Tournament"}
                        </Button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-xs text-foreground/30 px-6 pb-4">
                        Phi lah ban change biang na profile page
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
