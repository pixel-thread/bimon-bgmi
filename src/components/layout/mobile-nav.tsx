"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Users,
    Vote,
    Wallet,
    LayoutDashboard,
    Loader2,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useAuthUser } from "@/hooks/use-auth-user";
import { type LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

type Tab = {
    label: string;
    href: string;
    icon?: LucideIcon;
};

const tabs: Tab[] = [
    { label: "Players", href: "/players", icon: Users },
    { label: "Vote", href: "/vote", icon: Vote },
    { label: "__wallet__", href: "/wallet", icon: Wallet },
    { label: "Profile", href: "/profile" },
];

/**
 * Bottom tab bar for mobile — only visible on small screens.
 * Profile tab uses the user's real profile picture.
 * Shows a spinner on the icon while navigating to a new tab.
 */
export function MobileNav() {
    const pathname = usePathname();
    const { isAdmin, balance } = useAuthUser();
    const { user } = useUser();
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

    const { data: profile } = useQuery<{ imageUrl?: string }>({
        queryKey: ["profile"],
        queryFn: async () => {
            const res = await fetch("/api/profile");
            if (!res.ok) return {};
            const json = await res.json();
            return json.data || {};
        },
        staleTime: 5 * 60 * 1000,
    });

    // Clear loading when pathname changes (navigation complete)
    useEffect(() => {
        setNavigatingTo(null);
    }, [pathname]);

    const allTabs = isAdmin
        ? [{ label: "Admin", href: "/dashboard", icon: LayoutDashboard }, ...tabs]
        : tabs;

    const initials = user?.firstName?.[0] || user?.username?.[0]?.toUpperCase() || "?";

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-divider bg-background/80 backdrop-blur-xl sm:hidden">
            <div className="mx-auto flex max-w-lg items-center justify-around">
                {allTabs.map((tab) => {
                    const isActive = pathname.startsWith(tab.href);
                    const isProfile = tab.label === "Profile";
                    const isLoading = navigatingTo === tab.href && !isActive;

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            onClick={() => {
                                if (!isActive) setNavigatingTo(tab.href);
                            }}
                            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${isActive
                                ? "text-primary"
                                : "text-foreground/50 active:text-foreground"
                                }`}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : isProfile ? (
                                (profile?.imageUrl || user?.imageUrl) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={profile?.imageUrl || user?.imageUrl}
                                        alt="Profile"
                                        className={`h-5 w-5 rounded-full object-cover transition-transform ${isActive ? "scale-110 ring-1.5 ring-primary" : ""
                                            }`}
                                    />
                                ) : (
                                    <div
                                        className={`flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[8px] font-bold text-primary transition-transform ${isActive ? "scale-110" : ""
                                            }`}
                                    >
                                        {initials}
                                    </div>
                                )
                            ) : tab.icon ? (
                                <tab.icon
                                    className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : ""}`}
                                    strokeWidth={isActive ? 2.5 : 1.5}
                                />
                            ) : null}
                            <span className={`${isActive ? "font-semibold" : "font-normal"} ${tab.label === "__wallet__"
                                ? (balance ?? 0) > 0 ? "text-success" : (balance ?? 0) < 0 ? "text-danger" : ""
                                : ""
                                }`}>
                                {tab.label === "__wallet__" ? `${(balance ?? 0).toLocaleString()} UC` : tab.label}
                            </span>
                            {isActive && (
                                <div className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
