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
    Image,
    Gamepad2,
    BookOpen,
} from "lucide-react";

const sidebarItems = [
    {
        section: "Overview",
        items: [
            { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
            { label: "Analytics", href: "/dashboard/analytics", icon: Target },
        ],
    },
    {
        section: "Management",
        items: [
            { label: "Players", href: "/dashboard/players", icon: Users },
            { label: "Tournaments", href: "/dashboard/tournaments", icon: Trophy },
            { label: "Teams", href: "/dashboard/teams", icon: Swords },
            { label: "Matches", href: "/dashboard/matches", icon: Gamepad2 },
        ],
    },
    {
        section: "Community",
        items: [
            { label: "Polls", href: "/dashboard/polls", icon: Vote },
            { label: "Winners", href: "/dashboard/winners", icon: Trophy },
            { label: "Rules", href: "/dashboard/rules", icon: BookOpen },
        ],
    },
    {
        section: "Finance",
        items: [
            { label: "Income", href: "/dashboard/income", icon: DollarSign },
        ],
    },
    {
        section: "System",
        items: [
            { label: "Admins", href: "/dashboard/admins", icon: Shield },
            { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
            { label: "Gallery", href: "/dashboard/gallery", icon: Image },
            { label: "Settings", href: "/dashboard/settings", icon: Settings },
        ],
    },
];

export function AdminSidebar() {
    const pathname = usePathname();

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
                    {sidebarItems.map((section) => (
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
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-all ${isActive
                                                        ? "bg-primary/10 font-medium text-primary"
                                                        : "text-foreground/60 hover:bg-default-100 hover:text-foreground"
                                                    }`}
                                            >
                                                <item.icon className="h-4 w-4 shrink-0" />
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
