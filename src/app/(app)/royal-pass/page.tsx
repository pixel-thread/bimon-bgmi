"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
    Divider,
    Chip,
    Skeleton,
    Progress,
} from "@heroui/react";
import {
    Crown,
    Star,
    Trophy,
    Zap,
    Gift,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";

interface RoyalPassInfo {
    hasRoyalPass: boolean;
    currentStreak: number;
    nextRewardAt: number;
    totalRewards: number;
    pendingRewards: {
        id: string;
        type: string;
        amount: number;
        isPending: boolean;
        createdAt: string;
    }[];
}

/**
 * /app/royal-pass — Royal Pass rewards page.
 */
export default function RoyalPassPage() {
    const { data, isLoading, error } = useQuery<RoyalPassInfo>({
        queryKey: ["royal-pass"],
        queryFn: async () => {
            const res = await fetch("/api/royal-pass");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        staleTime: 60 * 1000,
    });

    return (
        <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 pb-24 sm:pb-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-yellow-500/20 p-6">
                <Crown className="absolute -right-4 -top-4 h-28 w-28 rotate-12 text-yellow-500/10" />
                <div className="relative">
                    <div className="flex items-center gap-2">
                        <Crown className="h-6 w-6 text-yellow-500" />
                        <h1 className="text-xl font-bold">Royal Pass</h1>
                    </div>
                    <p className="mt-1 text-sm text-foreground/50">
                        Exclusive streak rewards for Royal Pass holders
                    </p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load Royal Pass data.
                </div>
            )}

            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            )}

            {data && (
                <>
                    {/* Status card */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card
                            className={`border ${data.hasRoyalPass
                                ? "border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5"
                                : "border-divider"
                                }`}
                        >
                            <CardBody className="space-y-4 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Status</span>
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color={data.hasRoyalPass ? "warning" : "default"}
                                        startContent={
                                            data.hasRoyalPass ? (
                                                <Crown className="h-3 w-3" />
                                            ) : null
                                        }
                                    >
                                        {data.hasRoyalPass ? "Active" : "Not Active"}
                                    </Chip>
                                </div>

                                {data.hasRoyalPass && (
                                    <>
                                        {/* Streak progress */}
                                        <div>
                                            <div className="mb-1 flex items-center justify-between text-xs">
                                                <span className="text-foreground/50">
                                                    Streak Progress
                                                </span>
                                                <span className="font-medium">
                                                    {data.currentStreak} / {data.nextRewardAt}
                                                </span>
                                            </div>
                                            <Progress
                                                value={(data.currentStreak / data.nextRewardAt) * 100}
                                                color="warning"
                                                size="sm"
                                                classNames={{
                                                    track: "bg-default-100",
                                                    indicator:
                                                        "bg-gradient-to-r from-yellow-500 to-amber-400",
                                                }}
                                            />
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="rounded-lg bg-default-100 p-3 text-center">
                                                <Zap className="mx-auto mb-1 h-4 w-4 text-warning" />
                                                <p className="text-lg font-bold">
                                                    {data.currentStreak}
                                                </p>
                                                <p className="text-[10px] text-foreground/40">
                                                    Current Streak
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-default-100 p-3 text-center">
                                                <Gift className="mx-auto mb-1 h-4 w-4 text-success" />
                                                <p className="text-lg font-bold">
                                                    {data.totalRewards}
                                                </p>
                                                <p className="text-[10px] text-foreground/40">
                                                    Total Rewards
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Pending rewards */}
                    {data.hasRoyalPass && data.pendingRewards.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                        >
                            <Card className="border border-divider">
                                <CardHeader className="gap-2 pb-1">
                                    <Star className="h-4 w-4 text-warning" />
                                    <h3 className="text-sm font-semibold">Pending Rewards</h3>
                                </CardHeader>
                                <Divider />
                                <CardBody className="space-y-2 pt-2">
                                    {data.pendingRewards.map((reward, i) => (
                                        <motion.div
                                            key={reward.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="flex items-center justify-between rounded-lg bg-default-50 p-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Gift className="h-4 w-4 text-success" />
                                                <div>
                                                    <p className="text-sm font-medium">{reward.type}</p>
                                                    <p className="text-[10px] text-foreground/30">
                                                        {new Date(reward.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-warning">
                                                    {reward.amount} UC
                                                </span>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={reward.isPending ? "warning" : "success"}
                                                >
                                                    {reward.isPending ? "Pending" : "Claimed"}
                                                </Chip>
                                            </div>
                                        </motion.div>
                                    ))}
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}

                    {/* Not subscribed */}
                    {!data.hasRoyalPass && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                        >
                            <Card className="border border-divider">
                                <CardBody className="items-center gap-3 py-8 text-center">
                                    <Crown className="h-12 w-12 text-foreground/15" />
                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            No Royal Pass
                                        </h3>
                                        <p className="mt-1 text-xs text-foreground/40">
                                            Purchase Royal Pass in-game to unlock exclusive streak
                                            rewards and bonus UC
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}
                </>
            )}
        </div>
    );
}
