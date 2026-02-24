"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    Users,
    Trophy,
    Target,
    Vote,
    Settings,
    Swords,
    DollarSign,
    Shield,
    Bell,
    Gamepad2,
    BookOpen,
    Briefcase,
    Crown,
    Star,
    Gift,
    TrendingDown,
    Loader2,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useState, useEffect } from "react";

interface SidebarItem {
    label: string;
    href: string;
    icon: typeof BarChart3;
    superAdminOnly?: boolean;
}

interface SidebarSection {
    section: string;
    superAdminOnly?: boolean;
    items: SidebarItem[];
}

const sidebarItems: SidebarSection[] = [
    {
        section: "Tournament",
        items: [
            { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
            { label: "Players", href: "/dashboard/players", icon: Users, superAdminOnly: true },
            { label: "Operations", href: "/dashboard/operations", icon: Settings },
            { label: "Teams", href: "/dashboard/teams", icon: Swords },
        ],
    },
    {
        section: "Platform",
        items: [
            { label: "Polls", href: "/dashboard/polls", icon: Vote },
            { label: "Job Listings", href: "/dashboard/job-listings", icon: Briefcase },
            { label: "Rules", href: "/dashboard/rules", icon: BookOpen },
        ],
    },
    {
        section: "Insights",
        superAdminOnly: true,
        items: [
            { label: "Analytics", href: "/dashboard/analytics", icon: Target },
            { label: "Royal Pass", href: "/dashboard/royal-pass", icon: Crown },
            { label: "Income", href: "/dashboard/income", icon: DollarSign },
            { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
        ],
    },
    {
        section: "Admin",
        items: [
            { label: "Admins", href: "/dashboard/admins", icon: Shield, superAdminOnly: true },
        ],
    },
];

export { sidebarItems };

export function AdminSidebar() {
    const pathname = usePathname();
    const { isSuperAdmin } = useAuthUser();
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

    // Clear loading when pathname changes (navigation complete)
    useEffect(() => {
        setNavigatingTo(null);
    }, [pathname]);

    // Filter sections and items by permission
    const filteredSections = sidebarItems
        .filter((section) => !section.superAdminOnly || isSuperAdmin)
        .map((section) => ({
            ...section,
            items: section.items.filter((item) => !item.superAdminOnly || isSuperAdmin),
        }))
        .filter((section) => section.items.length > 0);

    return (
        <aside className="hidden w-64 shrink-0 border-r border-divider bg-background/50 lg:block">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-14 items-center gap-2 border-b border-divider px-4">
                    <Swords className="h-6 w-6 text-primary" />
                    <span className="text-lg font-bold tracking-tight">PUBGMI</span>
                    <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Admin
                    </span>
                </div>

                {/* Nav sections */}
                <nav className="flex-1 space-y-6 overflow-y-auto p-4">
                    {filteredSections.map((section) => (
                        <div key={section.section}>
                            <h3 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
                                {section.section}
                            </h3>
                            <ul className="space-y-0.5">
                                {section.items.map((item) => {
                                    const isActive =
                                        pathname === item.href ||
                                        (item.href !== "/dashboard" &&
                                            pathname.startsWith(item.href));
                                    const isLoading = navigatingTo === item.href && !isActive;
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                onClick={() => {
                                                    if (!isActive) setNavigatingTo(item.href);
                                                }}
                                                className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-all ${isActive
                                                    ? "bg-primary/10 font-medium text-primary"
                                                    : "text-foreground/60 hover:bg-default-100 hover:text-foreground"
                                                    }`}
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                                                ) : (
                                                    <item.icon className="h-4 w-4 shrink-0" />
                                                )}
                                                {item.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
