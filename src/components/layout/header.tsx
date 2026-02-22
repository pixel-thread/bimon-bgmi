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
import { useState, useEffect } from "react";
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
    const { isAdmin, isSignedIn, balance } = useAuthUser();
    const { user } = useUser();
    const { signOut } = useClerk();

    // Clear loading spinner and close menu when pathname changes
    useEffect(() => {
        setNavigatingTo(null);
        setIsMenuOpen(false);
    }, [pathname]);

    const { data: notifData } = useQuery({
        queryKey: ["notification-count"],
        queryFn: async () => {
            const res = await fetch("/api/notifications");
            if (!res.ok) return { unreadCount: 0 };
            const json = await res.json();
            return { unreadCount: json.data?.unreadCount ?? 0 };
        },
        enabled: isSignedIn,
        staleTime: Infinity,
    });
    const unreadCount = notifData?.unreadCount ?? 0;



    const handleSignOut = async () => {
        await signOut();
        router.push("/");
    };

    const initials = user?.firstName?.[0] || user?.username?.[0]?.toUpperCase() || "?";

    return (
        <>
            {/* Backdrop overlay — blurs page and closes menu on tap */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 left-[280px] z-[39] bg-black/40 backdrop-blur-sm sm:hidden"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}
            <Navbar
                isMenuOpen={isMenuOpen}
                onMenuOpenChange={setIsMenuOpen}
                maxWidth="xl"
                classNames={{
                    base: "bg-background/60 backdrop-blur-xl border-b border-divider",
                    wrapper: "px-4 sm:px-6",
                    menu: "!w-[280px] !max-w-[280px] border-r border-divider shadow-xl !bg-background !backdrop-blur-none !backdrop-saturate-100 !overflow-y-auto",
                }}
                isBordered
            >
                {/* Logo */}
                <NavbarContent justify="start">
                    <NavbarMenuToggle className="sm:hidden" />
                    <NavbarBrand>
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-lg font-bold tracking-tight">PUBGMI</span>
                        </Link>
                    </NavbarBrand>
                </NavbarContent>


                {/* Desktop Nav */}
                <NavbarContent className="hidden gap-3 sm:flex" justify="center">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <NavbarItem key={item.href} isActive={isActive}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-1.5 text-sm transition-colors ${isActive
                                        ? "font-semibold text-primary"
                                        : "text-foreground/70 hover:text-foreground"
                                        }`}
                                >
                                    <item.icon className="h-4 w-4" />
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
                                        className={`flex items-center gap-1.5 text-sm transition-colors ${isActive
                                            ? "font-semibold text-primary"
                                            : "text-foreground/70 hover:text-foreground"
                                            }`}
                                    >
                                        <item.icon className="h-4 w-4" />
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
                                    {unreadCount > 0 && (
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
                                            {item.label === "Notifications" && unreadCount > 0 && (
                                                <span className="ml-auto rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                                    {unreadCount}
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
                                    className="flex items-center justify-center rounded-full p-1.5 text-yellow-500 transition-opacity hover:opacity-80"
                                >
                                    <Crown className="h-5 w-5" />
                                </Link>
                            </NavbarItem>
                            <NavbarItem className="hidden sm:flex">
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
                        /* Admin dashboard view — show sidebar items */
                        <>
                            {sidebarItems.map((section) => (
                                <NavbarMenuItem key={section.section}>
                                    <h3 className="mb-1 mt-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
                                        {section.section}
                                    </h3>
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
                                </NavbarMenuItem>
                            ))}
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
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base transition-colors ${isActive
                                                ? "bg-primary/10 font-semibold text-primary"
                                                : "text-foreground/70 hover:bg-default-100"
                                                }`}
                                        >
                                            <item.icon className="h-5 w-5" />
                                            {item.label}
                                            {item.label === "Notifications" && unreadCount > 0 && (
                                                <span className="ml-auto rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                                    {unreadCount}
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
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base transition-colors ${pathname.startsWith("/settings")
                                            ? "bg-primary/10 font-semibold text-primary"
                                            : "text-foreground/70 hover:bg-default-100"
                                            }`}
                                    >
                                        <Settings className="h-5 w-5" />
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
