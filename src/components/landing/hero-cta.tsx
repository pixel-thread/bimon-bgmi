"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

/**
 * Auth-aware heading for the landing page hero.
 */
export function HeroHeading() {
    const { isSignedIn, isLoaded, user } = useUser();

    const { data: profile } = useQuery<{ displayName?: string }>({
        queryKey: ["profile"],
        queryFn: async () => {
            const res = await fetch("/api/profile");
            if (!res.ok) return {};
            const json = await res.json();
            return json.data || {};
        },
        enabled: isSignedIn,
        staleTime: 5 * 60 * 1000,
    });

    const displayName = profile?.displayName || user?.firstName || user?.username || "";

    if (!isLoaded) {
        return (
            <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-center sm:text-6xl">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                    PUBGMI
                </span>
            </h1>
        );
    }

    return (
        <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-center sm:text-6xl">
            {isSignedIn ? (
                <>
                    Welcome back{" "}
                    <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                        {displayName}
                    </span>
                </>
            ) : (
                <>
                    Welcome to{" "}
                    <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                        PUBGMI
                    </span>
                </>
            )}
        </h1>
    );
}

/**
 * Auth-aware CTA button for the landing page hero.
 * Signed in → "Get Started" → /vote
 * Not signed in → "Sign In" → /sign-in
 */
export function HeroCTA() {
    const { isSignedIn, isLoaded } = useUser();
    const [loading, setLoading] = useState(false);

    if (!isLoaded) {
        return (
            <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-7 py-3 text-sm font-semibold text-white/50 shadow-lg shadow-blue-600/25">
                <Loader2 className="h-4 w-4 animate-spin" />
            </div>
        );
    }

    return (
        <Link
            href={isSignedIn ? "/vote" : "/sign-in"}
            onClick={() => setLoading(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30 hover:brightness-110"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <>
                    {isSignedIn ? "Vote" : "Sign In"}
                    <ChevronRight className="h-4 w-4" />
                </>
            )}
        </Link>
    );
}
