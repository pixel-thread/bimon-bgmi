"use client";

import { Card, CardBody, CardHeader, Divider, Switch, Skeleton } from "@heroui/react";
import {
    Settings as SettingsIcon,
    Moon,
    Bell,
    Shield,
    Database,
    Info,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { motion } from "motion/react";

/**
 * /dashboard/settings — Admin settings page.
 */
export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useState(() => {
        setMounted(true);
    });

    return (
        <div className="mx-auto max-w-xl space-y-6">
            <div>
                <h1 className="text-xl font-bold">Settings</h1>
                <p className="text-sm text-foreground/50">
                    App preferences and configuration
                </p>
            </div>

            <div className="space-y-4">
                {/* Appearance */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="border border-divider">
                        <CardHeader className="gap-2 pb-2">
                            <Moon className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold">Appearance</h3>
                        </CardHeader>
                        <Divider />
                        <CardBody className="space-y-4 pt-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm">Dark Mode</p>
                                    <p className="text-xs text-foreground/40">
                                        Toggle between light and dark themes
                                    </p>
                                </div>
                                {mounted ? (
                                    <Switch
                                        isSelected={theme === "dark"}
                                        onValueChange={(val) =>
                                            setTheme(val ? "dark" : "light")
                                        }
                                        size="sm"
                                    />
                                ) : (
                                    <Skeleton className="h-6 w-10 rounded-full" />
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>

                {/* Notifications */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                >
                    <Card className="border border-divider">
                        <CardHeader className="gap-2 pb-2">
                            <Bell className="h-4 w-4 text-warning" />
                            <h3 className="text-sm font-semibold">Notifications</h3>
                        </CardHeader>
                        <Divider />
                        <CardBody className="space-y-4 pt-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm">Push Notifications</p>
                                    <p className="text-xs text-foreground/40">
                                        Receive tournament and poll updates
                                    </p>
                                </div>
                                <Switch size="sm" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm">Tournament Reminders</p>
                                    <p className="text-xs text-foreground/40">
                                        Get notified before tournaments start
                                    </p>
                                </div>
                                <Switch size="sm" defaultSelected />
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>

                {/* App Info */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="border border-divider">
                        <CardHeader className="gap-2 pb-2">
                            <Info className="h-4 w-4 text-foreground/50" />
                            <h3 className="text-sm font-semibold">About</h3>
                        </CardHeader>
                        <Divider />
                        <CardBody className="space-y-2 pt-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-foreground/60">Version</span>
                                <span className="font-mono text-xs">2.0.0</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-foreground/60">Framework</span>
                                <span className="font-mono text-xs">Next.js 16</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-foreground/60">UI</span>
                                <span className="font-mono text-xs">HeroUI</span>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
