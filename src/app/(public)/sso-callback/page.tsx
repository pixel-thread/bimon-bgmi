"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * /sso-callback — Legacy redirect page.
 * NextAuth handles OAuth callbacks at /api/auth/callback/google,
 * so this page just redirects authenticated users.
 */
export default function SSOCallbackPage() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/");
        } else if (status === "unauthenticated") {
            router.replace("/sign-in");
        }
    }, [status, router]);

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
