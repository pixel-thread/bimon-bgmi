"use client";

import { useState } from "react";
import { Card, CardBody, Button, Chip, Skeleton } from "@heroui/react";
import {
    Users,
    Gift,
    Copy,
    Check,
    Shield,
    Sparkles,
    ArrowRight,
    Clock,
    CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface ReferralData {
    referrals: {
        id: string;
        playerName: string;
        imageUrl: string | null;
        tournamentsCompleted: number;
        tournamentsRequired: number;
        progress: number;
        status: string;
        reward: number;
        isPaid: boolean;
        paidAt: string | null;
        createdAt: string;
    }[];
    stats: {
        total: number;
        active: number;
        paid: number;
        totalEarned: number;
        rewardPerReferral: number;
        tournamentsRequired: number;
    };
}

/**
 * /refer — Referral page.
 * Shows referral code, real tracking data, and how the program works.
 */
export default function ReferPage() {
    const { user } = useUser();
    const referralCode = user?.username || "...";
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    const referralLink = `${siteUrl}/sign-up?ref=${referralCode}`;
    const [copied, setCopied] = useState(false);

    const { data, isLoading } = useQuery<ReferralData>({
        queryKey: ["referrals"],
        queryFn: async () => {
            const res = await fetch("/api/referrals");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        staleTime: 60 * 1000,
    });

    const copyReferralLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const stats = data?.stats;
    const referrals = data?.referrals ?? [];

    return (
        <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 pb-24 lg:pb-6">
            <div className="space-y-4">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-2"
                >
                    <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/30">
                        <Gift className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">
                        Earn <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">FREE 20 UC</span>
                    </h1>
                    <p className="text-sm text-foreground/50">
                        Invite friends and earn UC when they play!
                    </p>
                    <Chip size="sm" color="warning" variant="flat" className="text-[10px] animate-pulse">
                        ⏳ Limited time only!
                    </Chip>
                </motion.div>

                {/* Referral Code Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                >
                    <Card className="border border-green-500/20 bg-gradient-to-br from-green-950/30 to-emerald-950/20 dark:from-green-950/50 dark:to-emerald-950/30">
                        <CardBody className="gap-3 p-5">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-green-400" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                                    Your Referral Code
                                </span>
                            </div>
                            <div className="text-center py-2">
                                <p className="text-3xl font-black tracking-wide text-green-400">
                                    {referralCode}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 truncate rounded-lg bg-default-100 px-3 py-2.5 text-xs text-foreground/70 font-mono">
                                    {referralLink}
                                </div>
                                <Button
                                    isIconOnly
                                    variant="flat"
                                    color={copied ? "success" : "primary"}
                                    className="h-10 w-10"
                                    onPress={copyReferralLink}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <Button
                                fullWidth
                                size="lg"
                                className="mt-1 h-12 text-base font-bold text-white bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 shadow-md shadow-green-500/20"
                                onPress={copyReferralLink}
                                startContent={copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                            >
                                {copied ? "Copied!" : "Copy & Share"}
                            </Button>
                        </CardBody>
                    </Card>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {isLoading ? (
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-20 rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            <Card className="border border-divider">
                                <CardBody className="items-center gap-1 p-3">
                                    <Users className="h-4 w-4 text-primary" />
                                    <p className="text-xl font-bold">{stats?.total ?? 0}</p>
                                    <p className="text-[10px] text-foreground/40">Referrals</p>
                                </CardBody>
                            </Card>
                            <Card className="border border-divider">
                                <CardBody className="items-center gap-1 p-3">
                                    <Clock className="h-4 w-4 text-warning" />
                                    <p className="text-xl font-bold">{stats?.active ?? 0}</p>
                                    <p className="text-[10px] text-foreground/40">In Progress</p>
                                </CardBody>
                            </Card>
                            <Card className="border border-divider">
                                <CardBody className="items-center gap-1 p-3">
                                    <Sparkles className="h-4 w-4 text-success" />
                                    <p className="text-xl font-bold text-success">{stats?.totalEarned ?? 0}</p>
                                    <p className="text-[10px] text-foreground/40">UC Earned</p>
                                </CardBody>
                            </Card>
                        </div>
                    )}
                </motion.div>

                {/* Referred Players List */}
                {!isLoading && referrals.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <Card className="border border-divider">
                            <CardBody className="p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-foreground/50" />
                                    <h2 className="text-sm font-semibold">Your Referrals</h2>
                                </div>
                                <div className="space-y-2">
                                    {referrals.map((ref) => (
                                        <div
                                            key={ref.id}
                                            className="flex items-center gap-3 rounded-xl bg-default-50 p-3"
                                        >
                                            {/* Avatar */}
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                                {ref.imageUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={ref.imageUrl}
                                                        alt=""
                                                        className="h-9 w-9 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    ref.playerName[0]?.toUpperCase() || "?"
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{ref.playerName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {/* Progress bar */}
                                                    <div className="flex-1 h-1.5 bg-default-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${ref.isPaid
                                                                ? "bg-success"
                                                                : "bg-gradient-to-r from-orange-400 to-amber-500"
                                                                }`}
                                                            style={{ width: `${ref.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-foreground/40 shrink-0">
                                                        {ref.tournamentsCompleted}/{ref.tournamentsRequired}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            {ref.isPaid ? (
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color="success"
                                                    startContent={<CheckCircle2 className="h-3 w-3" />}
                                                >
                                                    +{ref.reward} UC
                                                </Chip>
                                            ) : (
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color="warning"
                                                    startContent={<Clock className="h-3 w-3" />}
                                                >
                                                    {ref.tournamentsRequired - ref.tournamentsCompleted} left
                                                </Chip>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                )}

                {/* How it Works */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: referrals.length > 0 ? 0.2 : 0.15 }}
                >
                    <Card className="border border-divider">
                        <CardBody className="p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-warning" />
                                <h2 className="text-sm font-semibold">How it works</h2>
                            </div>

                            <div className="space-y-3">
                                {[
                                    {
                                        step: 1,
                                        title: "Share your code",
                                        desc: "Send your referral code to your friend",
                                        emoji: "📤",
                                    },
                                    {
                                        step: 2,
                                        title: "They sign up",
                                        desc: "Your friend enters your code during registration",
                                        emoji: "📝",
                                    },
                                    {
                                        step: 3,
                                        title: "They play 5 tournaments",
                                        desc: "Your friend completes 5 tournaments",
                                        emoji: "🎮",
                                    },
                                    {
                                        step: 4,
                                        title: "You get 20 UC!",
                                        desc: "Automatically added to your pending rewards",
                                        emoji: "💰",
                                    },
                                ].map((item, i) => (
                                    <div key={item.step} className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-lg">
                                            {item.emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold">{item.title}</p>
                                                {i < 3 && <ArrowRight className="h-3 w-3 text-foreground/20 hidden sm:block" />}
                                            </div>
                                            <p className="text-xs text-foreground/40">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>

                {/* Reward highlight */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: referrals.length > 0 ? 0.25 : 0.2 }}
                >
                    <Card className="border border-green-500/20 overflow-hidden">
                        <CardBody className="p-0">
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-4 text-center text-white">
                                <p className="text-xs font-medium uppercase tracking-wider opacity-80">Per referral you earn</p>
                                <p className="text-4xl font-black mt-1">20 UC</p>
                                <p className="text-xs mt-1 opacity-70">⏳ Limited time — refer now & earn big!</p>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
