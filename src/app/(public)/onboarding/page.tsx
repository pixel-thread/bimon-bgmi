"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardBody,
    CardHeader,
    Input,
    Button,
    Avatar,
    Divider,
} from "@heroui/react";
import { useUser } from "@clerk/nextjs";
import {
    Gamepad2,
    User,
    ChevronRight,
    Loader2,
    CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/**
 * /onboarding — New user setup flow.
 * Step 1: Welcome + set display name
 * Step 2: Confirm and submit
 */
export default function OnboardingPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [displayName, setDisplayName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit() {
        if (!displayName.trim()) {
            setError("Display name is required");
            return;
        }

        if (displayName.trim().length < 3) {
            setError("Display name must be at least 3 characters");
            return;
        }

        setError("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    displayName: displayName.trim(),
                }),
            });

            if (!res.ok) {
                const json = await res.json();
                setError(json.message || "Something went wrong");
                return;
            }

            // Success — redirect to players page
            router.push("/players");
            router.refresh();
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!isLoaded) {
        return (
            <div className="flex min-h-dvh items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4">
            <div className="w-full max-w-md">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <Card className="border border-divider">
                                <CardHeader className="flex-col items-center gap-2 pb-2 pt-8">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                        <Gamepad2 className="h-8 w-8 text-primary" />
                                    </div>
                                    <h1 className="text-xl font-bold">Welcome to PUBGMI</h1>
                                    <p className="text-center text-sm text-foreground/50">
                                        Set up your player profile to join tournaments
                                    </p>
                                </CardHeader>
                                <Divider />
                                <CardBody className="space-y-4 px-6 py-6">
                                    {/* Clerk avatar */}
                                    <div className="flex items-center gap-3 rounded-lg bg-default-100 p-3">
                                        <Avatar
                                            src={user?.imageUrl}
                                            name={user?.username || "User"}
                                            size="md"
                                        />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {user?.username || user?.firstName}
                                            </p>
                                            <p className="text-xs text-foreground/40">
                                                {user?.primaryEmailAddress?.emailAddress}
                                            </p>
                                        </div>
                                    </div>

                                    <Input
                                        label="Display Name"
                                        placeholder="Your BGMI name"
                                        value={displayName}
                                        onValueChange={setDisplayName}
                                        startContent={
                                            <User className="h-4 w-4 text-default-400" />
                                        }
                                        description="This is how other players will see you"
                                        isInvalid={!!error}
                                        errorMessage={error}
                                        maxLength={30}
                                    />

                                    <Button
                                        color="primary"
                                        className="w-full"
                                        onPress={() => {
                                            if (!displayName.trim()) {
                                                setError("Display name is required");
                                                return;
                                            }
                                            setError("");
                                            setStep(2);
                                        }}
                                        endContent={<ChevronRight className="h-4 w-4" />}
                                    >
                                        Continue
                                    </Button>
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <Card className="border border-divider">
                                <CardHeader className="flex-col items-center gap-2 pb-2 pt-8">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                                        <CheckCircle className="h-8 w-8 text-success" />
                                    </div>
                                    <h1 className="text-xl font-bold">Confirm Profile</h1>
                                    <p className="text-center text-sm text-foreground/50">
                                        Review your details before joining
                                    </p>
                                </CardHeader>
                                <Divider />
                                <CardBody className="space-y-4 px-6 py-6">
                                    <div className="space-y-2 rounded-lg bg-default-100 p-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-foreground/50">Username</span>
                                            <span className="font-medium">{user?.username}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-foreground/50">Display Name</span>
                                            <span className="font-medium">{displayName}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-foreground/50">Starting Tier</span>
                                            <span className="font-medium text-secondary">NOOB</span>
                                        </div>
                                    </div>

                                    {error && (
                                        <p className="text-center text-sm text-danger">{error}</p>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            variant="flat"
                                            className="flex-1"
                                            onPress={() => setStep(1)}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            color="primary"
                                            className="flex-1"
                                            onPress={handleSubmit}
                                            isLoading={isSubmitting}
                                        >
                                            Create Profile
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
