"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Switch, Divider, Chip } from "@heroui/react";
import {
    Settings,
    Globe,
    Bell,
    Palette,
    Info,
    LogOut,
    ChevronRight,
} from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import Link from "next/link";

/**
 * /settings — App settings page.
 * Responsive for both mobile and desktop.
 */
export default function SettingsPage() {
    const { signOut } = useClerk();
    const { user } = useUser();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const [notifications, setNotifications] = useState(true);

    return (
        <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6 pb-24 sm:pb-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-foreground/70" />
                <h1 className="text-xl font-bold">Settings</h1>
            </div>

            {/* Language */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
            >
                <Card className="border border-divider">
                    <CardBody className="p-4">
                        <button className="flex w-full items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-semibold">Language</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Chip size="sm" variant="flat" color="default">
                                    English
                                </Chip>
                                <ChevronRight className="h-4 w-4 text-foreground/30" />
                            </div>
                        </button>
                        <p className="mt-1.5 text-xs text-foreground/40">
                            More languages coming soon
                        </p>
                    </CardBody>
                </Card>
            </motion.div>

            {/* Notifications */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <Card className="border border-divider">
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-orange-500" />
                                <span className="text-sm font-semibold">Push Notifications</span>
                            </div>
                            <Switch
                                size="sm"
                                isSelected={notifications}
                                onValueChange={setNotifications}
                                color="primary"
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-foreground/40">
                            Get notified about tournaments, matches, and results
                        </p>
                    </CardBody>
                </Card>
            </motion.div>

            {/* Theme */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="border border-divider">
                    <CardBody className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Palette className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-semibold">Theme</span>
                        </div>
                        <div className="flex gap-2">
                            {(["light", "dark", "system"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${mounted && theme === t
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-divider bg-default-50 text-foreground/60 hover:bg-default-100"
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </motion.div>

            {/* About */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
            >
                <Card className="border border-divider">
                    <CardBody className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-foreground/50" />
                            <span className="text-sm font-semibold">About</span>
                        </div>
                        <div className="space-y-1.5 text-xs text-foreground/50">
                            <div className="flex justify-between">
                                <span>App</span>
                                <span className="font-medium text-foreground/70">PUBGMI</span>
                            </div>
                            <Divider />
                            <div className="flex justify-between">
                                <span>Version</span>
                                <span className="font-medium text-foreground/70">v2 · {process.env.NEXT_PUBLIC_BUILD_DATE}</span>
                            </div>
                            <Divider />
                            <div className="flex justify-between">
                                <span>Developer</span>
                                <span className="font-medium text-foreground/70">Bimon</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </motion.div>

            {/* Sign Out */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <button
                    onClick={() => signOut({ redirectUrl: "/" })}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                >
                    <LogOut className="h-4 w-4" />
                    Sign out
                </button>
            </motion.div>
        </div>
    );
}
