"use client";

import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenu,
    NavbarMenuItem,
    NavbarMenuToggle,
} from "@heroui/react";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    Swords,
    Users,
    Vote,
    Trophy,
    Wallet,
    BarChart3,
} from "lucide-react";
import { useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";

const navItems = [
    { label: "Players", href: "/players", icon: Users },
    { label: "Vote", href: "/vote", icon: Vote },
    { label: "Matches", href: "/recent-matches", icon: Trophy },
    { label: "Wallet", href: "/wallet", icon: Wallet },
];

const adminItems = [
    { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
];

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const { isAdmin, isSignedIn, balance } = useAuthUser();

    return (
        <Navbar
            isMenuOpen={isMenuOpen}
            onMenuOpenChange={setIsMenuOpen}
            maxWidth="xl"
            classNames={{
                base: "bg-background/60 backdrop-blur-xl border-b border-divider",
                wrapper: "px-4 sm:px-6",
            }}
            isBordered
        >
            {/* Logo */}
            <NavbarContent justify="start">
                <NavbarMenuToggle className="sm:hidden" />
                <NavbarBrand>
                    <Link href="/" className="flex items-center gap-2">
                        <Swords className="h-6 w-6 text-primary" />
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
                                {item.label}
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
            </NavbarContent>

            {/* Right section */}
            <NavbarContent justify="end">
                <SignedIn>
                    <NavbarItem className="hidden sm:flex">
                        <div className="flex items-center gap-1 rounded-full bg-default-100 px-3 py-1 text-xs font-medium">
                            <Wallet className="h-3 w-3 text-warning" />
                            <span>{balance} UC</span>
                        </div>
                    </NavbarItem>
                    <NavbarItem>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: "h-8 w-8",
                                },
                            }}
                        />
                    </NavbarItem>
                </SignedIn>
                <SignedOut>
                    <NavbarItem>
                        <Link
                            href="/sign-in"
                            className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                        >
                            Sign In
                        </Link>
                    </NavbarItem>
                </SignedOut>
            </NavbarContent>

            {/* Mobile menu */}
            <NavbarMenu className="pt-4">
                {navItems.map((item) => {
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
                            </Link>
                        </NavbarMenuItem>
                    );
                })}
                {isAdmin &&
                    adminItems.map((item) => {
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
                                </Link>
                            </NavbarMenuItem>
                        );
                    })}

                {/* Mobile wallet badge */}
                <SignedIn>
                    <NavbarMenuItem>
                        <div className="mt-2 flex items-center gap-2 rounded-lg bg-default-100 px-3 py-2.5 text-sm font-medium">
                            <Wallet className="h-4 w-4 text-warning" />
                            <span>{balance} UC</span>
                        </div>
                    </NavbarMenuItem>
                </SignedIn>
            </NavbarMenu>
        </Navbar>
    );
}
