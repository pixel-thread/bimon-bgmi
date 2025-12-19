"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { LoaderFour } from "@/src/components/ui/loader";

export default function SSOCallback() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();

    // When Clerk auth completes, redirect to home immediately
    // RoleBaseRouting will handle the onboarding redirect with the same loader
    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.replace("/");
        }
    }, [isLoaded, isSignedIn, router]);

    // Show loader with same styling as RoleBaseRouting and onboarding
    // This ensures a seamless visual transition regardless of redirects
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <AuthenticateWithRedirectCallback />
            <LoaderFour text="PUBGMI TOURNAMENT" />
        </div>
    );
}

