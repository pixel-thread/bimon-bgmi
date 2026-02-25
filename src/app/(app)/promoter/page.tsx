"use client";

import { Card, CardBody } from "@heroui/react";
import { BarChart3, Users, Trophy, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

/**
 * /promoter — Promoter tracker page.
 * Shows referral stats (coming soon — no tracking yet).
 */
export default function PromoterPage() {
    const { user } = useUser();
    const referralCode = user?.username || "...";

    return (
        <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
            {/* Back + Header */}
            <div className="mb-6">
                <Link
                    href="/settings"
                    className="mb-3 inline-flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Settings
                </Link>
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-bold">Promoter Tracker</h1>
                </div>
                <p className="mt-1 text-sm text-foreground/50">
                    Track your referral performance
                </p>
            </div>

            <div className="space-y-4">
                {/* Your Code */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="border border-divider bg-gradient-to-br from-primary/10 to-primary/5">
                        <CardBody className="items-center gap-1 py-6">
                            <span className="text-xs font-medium uppercase tracking-wider text-foreground/50">
                                Your Referral Code
                            </span>
                            <p className="text-2xl font-bold text-primary">
                                {referralCode}
                            </p>
                        </CardBody>
                    </Card>
                </motion.div>

                {/* Stats (placeholder) */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Referrals", value: "—", icon: Users, color: "text-primary" },
                        { label: "Active", value: "—", icon: Trophy, color: "text-success" },
                        { label: "Earned", value: "—", icon: BarChart3, color: "text-warning" },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 + i * 0.05 }}
                        >
                            <Card className="border border-divider">
                                <CardBody className="items-center gap-1 p-3">
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                    <p className="text-xl font-bold">{stat.value}</p>
                                    <p className="text-[10px] text-foreground/40">{stat.label}</p>
                                </CardBody>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Coming soon notice */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="border border-dashed border-foreground/10">
                        <CardBody className="items-center gap-2 py-8 text-center">
                            <BarChart3 className="h-8 w-8 text-foreground/15" />
                            <p className="text-sm font-medium text-foreground/50">
                                Tracking coming soon
                            </p>
                            <p className="text-xs text-foreground/30 max-w-xs">
                                Share your code with friends. Tracking and rewards will be available in a future update.
                            </p>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
