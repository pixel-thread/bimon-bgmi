"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * /sign-up redirects to /sign-in
 * Captures ?ref= param into localStorage so onboarding can create the referral.
 */
export default function SignUpPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get("ref");
        if (ref) {
            localStorage.setItem("referral-code", ref);
        }
        router.replace("/sign-in");
    }, [router, searchParams]);

    return null;
}
