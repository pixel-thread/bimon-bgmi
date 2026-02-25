"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
    Divider,
    Chip,
    Skeleton,
    Button,
} from "@heroui/react";
import {
    Crown,
    Star,
    Zap,
    Gift,
    AlertCircle,
    Flame,
    Loader2,
    ImagePlus,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

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

const RP_PRICE_DISCOUNTED = 10; // 50% off from 20 UC
const RP_PRICE_FULL = 20; // Full price

/**
 * /app/royal-pass — Royal Pass rewards page.
 */
export default function RoyalPassPage() {
    const queryClient = useQueryClient();
    const [isPurchasing, setIsPurchasing] = useState(false);

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

    const lostDiscount = (data?.currentStreak ?? 0) >= (data?.nextRewardAt ?? 8);
    const rpPrice = lostDiscount ? RP_PRICE_FULL : RP_PRICE_DISCOUNTED;

    const handleBuyRP = async () => {
        setIsPurchasing(true);
        try {
            const res = await fetch("/api/royal-pass/buy", { method: "POST" });
            const json = await res.json();
            if (res.ok) {
                toast.success("🎉 Royal Pass purchased!");
                queryClient.invalidateQueries({ queryKey: ["royal-pass"] });
                queryClient.invalidateQueries({ queryKey: ["profile"] });
            } else {
                toast.error(json.message || "Purchase failed");
            }
        } catch {
            toast.error("Purchase failed. Please try again.");
        } finally {
            setIsPurchasing(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-lg space-y-4 px-4 py-4 pb-24 sm:pb-6">
            {/* Promo Banner — only show if user doesn't have Royal Pass AND hasn't lost discount */}
            {data && !data.hasRoyalPass && !lostDiscount && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg bg-gradient-to-r from-red-500 to-orange-500 py-2 px-4 text-center text-sm font-medium text-white"
                >
                    🎉 <span className="line-through opacity-75">20 UC</span> → 10 UC only! Limited time offer
                </motion.div>
            )}

            {/* Header */}
            <div className="text-center">
                <div className="mx-auto mb-2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500">
                    <Crown className="h-8 w-8 text-white" />
                </div>
                <h1 className="bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-2xl font-bold text-transparent">
                    Royal Pass
                </h1>
                <p className="text-sm text-foreground/50">Play tournaments, earn UC!</p>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load Royal Pass data.
                </div>
            )}

            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-2xl" />
                    <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
            )}

            {data && (
                <>
                    {/* Streak Progress Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="relative overflow-hidden border border-orange-200 dark:border-orange-800/30">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-amber-500/5" />
                            <CardBody className="relative space-y-3 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Flame className="h-5 w-5 text-orange-500" />
                                        <span className="text-sm font-semibold">Tournament Streak</span>
                                    </div>
                                    <Chip
                                        size="sm"
                                        variant="bordered"
                                        classNames={{
                                            base: "border-orange-300 dark:border-orange-700",
                                            content: "text-orange-600 dark:text-orange-400",
                                        }}
                                    >
                                        {data.currentStreak}/{data.nextRewardAt} 🔥
                                    </Chip>
                                </div>

                                {/* Segmented progress bar with 30 UC goal */}
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-1 gap-1">
                                        {Array.from({ length: data.nextRewardAt }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-3 flex-1 rounded-full transition-all ${i < data.currentStreak
                                                        ? "bg-gradient-to-r from-orange-400 to-red-500"
                                                        : "bg-default-200 dark:bg-default-100"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-amber-500">30 UC</span>
                                </div>

                                <p className="text-center text-xs text-foreground/50">
                                    {data.hasRoyalPass
                                        ? "Leh kai ban ban 8 tournament ioh ei 30 UC instant!"
                                        : "Get Royal Pass to earn 30 UC when you hit 8 streak!"}
                                </p>
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Already has RP */}
                    {data.hasRoyalPass ? (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                        >
                            <Card className="border border-green-200 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:border-green-800/30">
                                <CardBody className="p-4 text-center">
                                    <Crown className="mx-auto mb-2 h-8 w-8 text-amber-500" />
                                    <p className="font-semibold text-green-600 dark:text-green-400">
                                        You have Royal Pass! 👑
                                    </p>
                                </CardBody>
                            </Card>
                        </motion.div>
                    ) : (
                        /* Buy RP Button */
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="space-y-2"
                        >
                            <Button
                                fullWidth
                                size="lg"
                                className={`h-14 text-lg font-bold text-white shadow-lg ${lostDiscount
                                        ? "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500"
                                        : "bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500"
                                    }`}
                                onPress={handleBuyRP}
                                isDisabled={isPurchasing}
                            >
                                <span className="flex items-center gap-2">
                                    {isPurchasing ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Crown className="h-5 w-5" />
                                    )}
                                    {isPurchasing
                                        ? "Claiming..."
                                        : lostDiscount
                                            ? "Buy RP - Get 🔥 30 UC Instant!"
                                            : `Buy RP - ${rpPrice} UC`
                                    }
                                </span>
                            </Button>
                            {!lostDiscount && (
                                <div className="text-center">
                                    <Chip size="sm" color="danger" variant="flat" className="text-[10px]">
                                        50% OFF
                                    </Chip>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Pending rewards */}
                    {data.hasRoyalPass && data.pendingRewards.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
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

                    {/* How it works */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="space-y-2 text-sm text-foreground/50"
                    >
                        <p className="font-medium text-foreground">How it works:</p>
                        <ul className="list-inside list-disc space-y-1">
                            <li>Rung ha ka tournament</li>
                            <li>Your streak increases by 1</li>
                            <li>Pep shi tournament? Ka streak la resets sha 0</li>
                            <li>Khlem pep 8 tournament → Ioh 30 UC bonus!</li>
                            <li className="text-amber-600 dark:text-amber-400">
                                🎨 Upload custom character image/video for your podium card!
                            </li>
                        </ul>
                    </motion.div>
                </>
            )}
        </div>
    );
}
