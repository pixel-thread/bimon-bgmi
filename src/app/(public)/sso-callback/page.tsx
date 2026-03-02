"use client";

import { useEffect, useRef, useState } from "react";
import { useSignIn, useSignUp, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Custom SSO callback handler.
 *
 * When a NEW user triggers Google OAuth via signIn.authenticateWithRedirect,
 * Clerk returns a "transferable" status. We must detect this and manually
 * transfer the OAuth token to the signUp flow to complete account creation.
 */
export default function SSOCallbackPage() {
    const { signIn, isLoaded: signInLoaded } = useSignIn();
    const { signUp, isLoaded: signUpLoaded } = useSignUp();
    const { setActive } = useClerk();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const handled = useRef(false);

    useEffect(() => {
        if (!signInLoaded || !signUpLoaded || !signIn || !signUp) return;
        if (handled.current) return;
        handled.current = true;

        async function handleCallback() {
            try {
                // 1. Check if sign-in has a transferable result
                //    This happens when a new user tried to sign IN via OAuth
                const signInAttempt = signIn!;
                const firstFactor = signInAttempt.firstFactorVerification;

                if (
                    firstFactor?.status === "transferable" ||
                    signInAttempt.status === "needs_first_factor"
                ) {
                    console.log(
                        "[SSO] Sign-in returned transferable — new user, transferring to sign-up"
                    );

                    // Transfer the OAuth token to sign-up
                    const result = await signUp!.create({
                        transfer: true,
                    });

                    if (
                        result.status === "complete" &&
                        result.createdSessionId
                    ) {
                        console.log(
                            "[SSO] Sign-up complete, redirecting to onboarding"
                        );
                        await setActive({
                            session: result.createdSessionId,
                        });
                        router.replace("/onboarding");
                        return;
                    }

                    if (result.status === "missing_requirements") {
                        console.log(
                            "[SSO] Sign-up needs more info:",
                            result.missingFields
                        );
                        // Complete with available data
                        await setActive({
                            session: result.createdSessionId,
                        });
                        router.replace("/onboarding");
                        return;
                    }

                    console.log("[SSO] Sign-up status:", result.status);
                    setError(
                        `Unexpected sign-up status: ${result.status}`
                    );
                    return;
                }

                // 2. Normal sign-in completion (existing user)
                if (
                    signInAttempt.status === "complete" &&
                    signInAttempt.createdSessionId
                ) {
                    console.log(
                        "[SSO] Sign-in complete, redirecting to home"
                    );
                    await setActive({
                        session: signInAttempt.createdSessionId,
                    });
                    router.replace("/");
                    return;
                }

                // 3. Check sign-up status directly (user came via sign-up flow)
                const signUpAttempt = signUp!;
                if (
                    signUpAttempt.status === "complete" &&
                    signUpAttempt.createdSessionId
                ) {
                    console.log(
                        "[SSO] Sign-up already complete, redirecting to onboarding"
                    );
                    await setActive({
                        session: signUpAttempt.createdSessionId,
                    });
                    router.replace("/onboarding");
                    return;
                }

                // 4. If we get here, something unexpected happened
                console.error("[SSO] Unhandled state:", {
                    signInStatus: signInAttempt.status,
                    firstFactorStatus: firstFactor?.status,
                    signUpStatus: signUpAttempt.status,
                });
                setError(
                    `Unhandled auth state. Sign-in: ${signInAttempt.status}, Sign-up: ${signUpAttempt.status}`
                );
            } catch (err) {
                console.error("[SSO] Callback error:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Authentication failed. Please try again."
                );
            }
        }

        handleCallback();
    }, [signInLoaded, signUpLoaded, signIn, signUp, setActive, router]);

    if (error) {
        return (
            <div className="flex min-h-dvh items-center justify-center px-4">
                <div className="w-full max-w-sm text-center">
                    <div className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger">
                        {error}
                    </div>
                    <button
                        onClick={() => router.replace("/sign-in")}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                    >
                        Back to Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-dvh items-center justify-center">
            <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-3 text-sm text-foreground/60">
                    Completing sign in…
                </p>
            </div>
        </div>
    );
}
