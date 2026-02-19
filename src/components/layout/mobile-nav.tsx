"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Users,
    Vote,
    Trophy,
    User,
    LayoutDashboard,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";

const tabs = [
    { label: "Players", href: "/players", icon: Users },
    { label: "Vote", href: "/vote", icon: Vote },
    { label: "Matches", href: "/recent-matches", icon: Trophy },
    { label: "Profile", href: "/profile", icon: User },
];

/**
 * Bottom tab bar for mobile — only visible on small screens.
 * Smooth indicator follows the active tab.
 */
export function MobileNav() {
    const pathname = usePathname();
    const { isAdmin } = useAuthUser();

    const allTabs = isAdmin
        ? [{ label: "Admin", href: "/dashboard", icon: LayoutDashboard }, ...tabs]
        : tabs;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-divider bg-background/80 backdrop-blur-xl sm:hidden">
            <div className="mx-auto flex max-w-lg items-center justify-around">
                {allTabs.map((tab) => {
                    const isActive = pathname.startsWith(tab.href);
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${isActive
                                    ? "text-primary"
                                    : "text-foreground/50 active:text-foreground"
                                }`}
                        >
                            <tab.icon
                                className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : ""
                                    }`}
                                strokeWidth={isActive ? 2.5 : 1.5}
                            />
                            <span className={isActive ? "font-semibold" : "font-normal"}>
                                {tab.label}
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
