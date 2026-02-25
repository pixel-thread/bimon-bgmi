"use client";

import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenu,
    NavbarMenuItem,
    NavbarMenuToggle,
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@heroui/react";
import { useClerk, useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
    Swords,
    Users,
    Vote,
    Crown,
    Wallet,
    BarChart3,
    LogOut,
    User,
    Trophy,
    BookOpen,
    ChevronDown,
    Settings,
    Bell,
    Briefcase,
    Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { sidebarItems } from "./admin-sidebar";

const navItems = [
    { label: "Players", href: "/players", icon: Users },
    { label: "Vote", href: "/vote", icon: Vote },
    { label: "Wallet", href: "/wallet", icon: Wallet },
];

const moreItems = [
    { label: "Winners", href: "/winners", icon: Trophy },
    { label: "Jobs", href: "/jobs", icon: Briefcase },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Rules", href: "/rules", icon: BookOpen },
];

const adminItems = [
    { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
];

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
    const pathname = usePathname();
    const isDashboard = pathname.startsWith("/dashboard");
    const router = useRouter();
    const { isAdmin, isSuperAdmin, isSignedIn, balance } = useAuthUser();
    const { user } = useUser();
    const { signOut } = useClerk();

    // Check if a section contains the active page
    const sectionHasActive = useCallback((section: typeof sidebarItems[0]) => {
        return section.items.some(
            (item) =>
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
        );
    }, [pathname]);

    // Collapsed state for mobile menu sections
    const [mobileCollapsed, setMobileCollapsed] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        for (const section of sidebarItems) {
            initial[section.section] = !sectionHasActive(section);
        }
        return initial;
    });

    const toggleMobileSection = (sectionName: string) => {
        setMobileCollapsed((prev) => ({ ...prev, [sectionName]: !prev[sectionName] }));
    };

    // Clear loading spinner and close menu when pathname changes
    useEffect(() => {
        setNavigatingTo(null);
        setIsMenuOpen(false);
    }, [pathname]);

    // Auto-expand mobile section when navigating to it
    useEffect(() => {
        for (const section of sidebarItems) {
            if (sectionHasActive(section) && mobileCollapsed[section.section]) {
                setMobileCollapsed((prev) => ({ ...prev, [section.section]: false }));
            }
        }
    }, [pathname]);

    const { data: notifData } = useQuery({
        queryKey: ["notification-count"],
        queryFn: async () => {
            const res = await fetch("/api/notifications");
            if (!res.ok) return { unreadCount: 0, unclaimedRewardCount: 0 };
            const json = await res.json();
            return {
                unreadCount: json.data?.unreadCount ?? 0,
                unclaimedRewardCount: json.data?.unclaimedRewards?.length ?? 0,
            };
        },
        enabled: isSignedIn,
        staleTime: Infinity,
    });
    const unreadCount = notifData?.unreadCount ?? 0;
    const unclaimedRewardCount = notifData?.unclaimedRewardCount ?? 0;
    const totalActionCount = unreadCount + unclaimedRewardCount;



    const handleSignOut = async () => {
        await signOut({ redirectUrl: "/" });
    };

    const initials = user?.firstName?.[0] || user?.username?.[0]?.toUpperCase() || "?";

    return (
        <>
            {/* Backdrop overlay — fades in/out smoothly */}
            <div
                className={`fixed inset-0 left-[280px] z-[39] bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={() => setIsMenuOpen(false)}
            />
            <Navbar
                isMenuOpen={isMenuOpen}
                onMenuOpenChange={setIsMenuOpen}
                maxWidth="xl"
                position="static"
                classNames={{
                    base: "!fixed !top-0 !left-0 !right-0 !z-40 bg-background/60 backdrop-blur-xl border-b border-divider",
                    wrapper: "px-4 sm:px-6",
                    menu: `!fixed !top-[var(--navbar-height)] !h-[calc(100dvh-var(--navbar-height))] !w-[280px] !max-w-[280px] border-r border-divider shadow-xl !bg-background/60 !backdrop-blur-xl !backdrop-saturate-150 !overflow-y-auto transition-transform duration-300 ease-out ${isMenuOpen ? "!translate-x-0" : "!-translate-x-full"
                        }`,
                }}
                isBordered
                shouldHideOnScroll
            >
                {/* Logo */}
                <NavbarContent justify="start">
                    <div className="relative lg:hidden">
                        <NavbarMenuToggle />
                        {totalActionCount > 0 && (
                            <span className="absolute right-0 top-0 z-10 h-2 w-2 rounded-full bg-danger pointer-events-none" />
                        )}
                    </div>
                    <NavbarBrand>
                        <span className="text-lg font-bold tracking-tight">PUBGMI</span>
                    </NavbarBrand>
                </NavbarContent>


                {/* Desktop Nav */}
                <NavbarContent className="hidden gap-3 lg:flex" justify="center">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <NavbarItem key={item.href} isActive={isActive}>
                                <Link
                                    href={item.href}
                                    onClick={() => {
                                        if (!isActive) setNavigatingTo(item.href);
                                    }}
                                    className={`flex items-center gap-1.5 text-sm transition-colors ${isActive
                                        ? "font-semibold text-primary"
                                        : "text-foreground/70 hover:text-foreground"
                                        }`}
                                >
                                    {navigatingTo === item.href && !isActive ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    {item.label === "Wallet" ? (
                                        <span className={
                                            (balance ?? 0) > 0 ? "text-success" : (balance ?? 0) < 0 ? "text-danger" : ""
                                        }>{(balance ?? 0).toLocaleString()} UC</span>
                                    ) : item.label}
                                </Link>
                            </NavbarItem>
                        );
                    })}
                    {isAdmin &&
                        adminItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <NavbarItem key={item.href} isActive={isActive}>
                                    <Link
                                        href={item.href}
                                        onClick={() => {
                                            if (!isActive) setNavigatingTo(item.href);
                                        }}
                                        className={`flex items-center gap-1.5 text-sm transition-colors ${isActive
                                            ? "font-semibold text-primary"
                                            : "text-foreground/70 hover:text-foreground"
                                            }`}
                                    >
                                        {navigatingTo === item.href && !isActive ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <item.icon className="h-4 w-4" />
                                        )}
                                        {item.label}
                                    </Link>
                                </NavbarItem>
                            );
                        })}

                    {/* More dropdown */}
                    <NavbarItem>
                        <Popover placement="bottom" showArrow offset={12}>
                            <PopoverTrigger>
                                <button
                                    className={`relative flex items-center gap-1 text-sm transition-colors ${[...moreItems.map(i => i.href), "/settings"].some((h) => pathname.startsWith(h))
                                        ? "font-semibold text-primary"
                                        : "text-foreground/70 hover:text-foreground"
                                        }`}
                                >
                                    More
                                    <ChevronDown className="h-3.5 w-3.5" />
                                    {totalActionCount > 0 && (
                                        <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-danger" />
                                    )}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-44 p-1">
                                {moreItems.map((item) => {
                                    const isActive = pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${isActive
                                                ? "bg-primary/10 font-medium text-primary"
                                                : "text-foreground/70 hover:bg-default-100 hover:text-foreground"
                                                }`}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.label}
                                            {item.label === "Notifications" && totalActionCount > 0 && (
                                                <span className="ml-auto rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                                    {totalActionCount}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                                <div className="my-1 border-t border-divider" />
                                <Link
                                    href="/settings"
                                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${pathname.startsWith("/settings")
                                        ? "bg-primary/10 font-medium text-primary"
                                        : "text-foreground/70 hover:bg-default-100 hover:text-foreground"
                                        }`}
                                >
                                    <Settings className="h-4 w-4" />
                                    Settings
                                </Link>
                            </PopoverContent>
                        </Popover>
                    </NavbarItem>
                </NavbarContent>

                {/* Right section */}
                <NavbarContent justify="end">
                    {isSignedIn && (
                        <>
                            <NavbarItem>
                                <Link
                                    href="/royal-pass"
                                    onClick={() => {
                                        if (!pathname.startsWith("/royal-pass")) setNavigatingTo("/royal-pass");
                                    }}
                                    className="flex items-center justify-center rounded-full p-1.5 text-yellow-500 transition-opacity hover:opacity-80"
                                >
                                    {navigatingTo === "/royal-pass" && !pathname.startsWith("/royal-pass") ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Crown className="h-5 w-5" />
                                    )}
                                </Link>
                            </NavbarItem>
                            <NavbarItem className="hidden lg:flex">
                                <Link href="/profile" className="block">
                                    {user?.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={user.imageUrl}
                                            alt={user.username || "avatar"}
                                            className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20 transition-all hover:ring-primary/40"
                                        />
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-primary/20">
                                            {initials}
                                        </div>
                                    )}
                                </Link>
                            </NavbarItem>
                        </>
                    )}
                </NavbarContent>

                {/* Mobile menu */}
                <NavbarMenu className="pt-4">
                    {pathname.startsWith("/dashboard") ? (
                        /* Admin dashboard view — collapsible sidebar items */
                        <>
                            {sidebarItems
                                .filter((section) => !section.superAdminOnly || isSuperAdmin)
                                .map((section) => ({
                                    ...section,
                                    items: section.items.filter((item) => !item.superAdminOnly || isSuperAdmin),
                                }))
                                .filter((section) => section.items.length > 0)
                                .map((section) => {
                                    const isCollapsed = mobileCollapsed[section.section] ?? false;
                                    return (
                                        <NavbarMenuItem key={section.section}>
                                            <button
                                                onClick={() => toggleMobileSection(section.section)}
                                                className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 mt-2 mb-1 transition-colors hover:bg-default-100 ${sectionHasActive(section) ? "text-foreground/60" : "text-foreground/40"
                                                    }`}
                                            >
                                                <span className="text-[11px] font-semibold uppercase tracking-wider">
                                                    {section.section}
                                                </span>
                                                <ChevronDown
                                                    className={`h-3 w-3 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""
                                                        }`}
                                                />
                                            </button>
                                            <div
                                                className={`overflow-hidden transition-all duration-200 ${isCollapsed ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
                                                    }`}
                                            >
                                                {section.items.map((item) => {
                                                    const isActive =
                                                        pathname === item.href ||
                                                        (item.href !== "/dashboard" && pathname.startsWith(item.href));
                                                    return (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                            onClick={() => {
                                                                if (!isActive) setNavigatingTo(item.href);
                                                                else setIsMenuOpen(false);
                                                            }}
                                                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive
                                                                ? "bg-primary/10 font-semibold text-primary"
                                                                : "text-foreground/70 hover:bg-default-100"
                                                                }`}
                                                        >
                                                            {navigatingTo === item.href && !isActive ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <item.icon className="h-4 w-4" />
                                                            )}
                                                            {item.label}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </NavbarMenuItem>
                                    );
                                })}
                            {/* Quick link back to main app */}
                            <NavbarMenuItem>
                                <div className="mt-3 border-t border-divider pt-3">
                                    <Link
                                        href="/players"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/50 hover:bg-default-100"
                                    >
                                        ← Back to App
                                    </Link>
                                </div>
                            </NavbarMenuItem>
                        </>
                    ) : (
                        /* Regular app view — show More items + Settings */
                        <>
                            {moreItems.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <NavbarMenuItem key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={() => {
                                                if (!isActive) setNavigatingTo(item.href);
                                                else setIsMenuOpen(false);
                                            }}
                                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base transition-colors ${isActive
                                                ? "bg-primary/10 font-semibold text-primary"
                                                : "text-foreground/70 hover:bg-default-100"
                                                }`}
                                        >
                                            {navigatingTo === item.href && !isActive ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <item.icon className="h-5 w-5" />
                                            )}
                                            {item.label}
                                            {item.label === "Notifications" && totalActionCount > 0 && (
                                                <span className="ml-auto rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                                    {totalActionCount}
                                                </span>
                                            )}
                                        </Link>
                                    </NavbarMenuItem>
                                );
                            })}

                        </>
                    )}

                    {/* Settings — hide on dashboard since admin sidebar has its own */}
                    {isSignedIn && !isDashboard ? (
                        <>
                            <NavbarMenuItem>
                                <div className="mt-1 border-t border-divider pt-2">
                                    <Link
                                        href="/settings"
                                        onClick={() => {
                                            if (!pathname.startsWith("/settings")) setNavigatingTo("/settings");
                                            else setIsMenuOpen(false);
                                        }}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base transition-colors ${pathname.startsWith("/settings")
                                            ? "bg-primary/10 font-semibold text-primary"
                                            : "text-foreground/70 hover:bg-default-100"
                                            }`}
                                    >
                                        {navigatingTo === "/settings" && !pathname.startsWith("/settings") ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Settings className="h-5 w-5" />
                                        )}
                                        Settings
                                    </Link>
                                </div>
                            </NavbarMenuItem>
                        </>
                    ) : !isSignedIn ? (
                        <NavbarMenuItem>
                            <div className="mt-3 border-t border-divider pt-3">
                                <Link
                                    href="/sign-in"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-primary transition-colors hover:bg-primary/10"
                                >
                                    <LogOut className="h-5 w-5 rotate-180" />
                                    Sign in
                                </Link>
                            </div>
                        </NavbarMenuItem>
                    ) : null}
                </NavbarMenu>
            </Navbar>
        </>
    );
}
