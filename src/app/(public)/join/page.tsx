"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

function JoinContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isSignedIn, isLoaded } = useUser();
    const ref = searchParams.get("ref");

    useEffect(() => {
        // Store referral code for future tracking
        if (ref) {
            try {
                localStorage.setItem("referral_code", ref);
                localStorage.setItem("referral_ts", Date.now().toString());
            } catch {
                // localStorage not available
            }
        }

        if (!isLoaded) return;

        if (isSignedIn) {
            // Already signed in → go to vote page
            router.replace("/vote");
        } else {
            // Not signed in → redirect to sign-in
            router.replace("/sign-in");
        }
    }, [ref, isLoaded, isSignedIn, router]);

    return (
        <div className="flex min-h-dvh items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div>
                    <p className="text-sm font-medium text-foreground/70">
                        {ref
                            ? `Invited by ${ref}`
                            : "Redirecting..."}
                    </p>
                    <p className="mt-1 text-xs text-foreground/40">
                        Taking you to PUBGMI
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function JoinPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-dvh items-center justify-center bg-background">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
        >
            <JoinContent />
        </Suspense>
    );
}
