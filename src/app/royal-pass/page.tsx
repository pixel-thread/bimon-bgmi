"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRoyalPass } from "@/src/hooks/royal-pass/useRoyalPass";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ArrowLeft, Crown, Loader2, Flame, Gift } from "lucide-react";
import { toast } from "sonner";
import http from "@/src/utils/http";

const RP_PRICE = 5; // 5 UC (50% off from 10 UC)

export default function RewardsPage() {
    const router = useRouter();
    const { user, isAuthLoading } = useAuth();
    const {
        currentBalance,
        streak,
        freeOffer,
        hasRoyalPass,
        isLoading,
        refetch,
    } = useRoyalPass();

    const [isPurchasing, setIsPurchasing] = useState(false);

    const handleBuyRP = async () => {
        // Skip balance check if free offer is active
        if (!freeOffer.isActive && currentBalance < RP_PRICE) {
            toast.error(`Not enough UC! You need ${RP_PRICE} UC but have ${currentBalance} UC.`);
            return;
        }

        setIsPurchasing(true);
        try {
            const response = await http.post("/royal-pass/purchase", { amount: RP_PRICE });
            if (response.success) {
                toast.success(response.message || "🎉 Royal Pass purchased!");
                refetch();
            } else {
                toast.error(response.message || "Purchase failed");
            }
        } catch (error) {
            toast.error("Purchase failed. Please try again.");
        } finally {
            setIsPurchasing(false);
        }
    };

    // Loading state
    if (isAuthLoading || isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-lg">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-2xl" />
                    <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-lg">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <Card className="text-center py-12">
                    <CardContent>
                        <Flame className="w-16 h-16 mx-auto text-orange-500 mb-4" />
                        <h2 className="text-xl font-bold mb-2">Rewards</h2>
                        <p className="text-muted-foreground mb-4">Sign in to track your rewards</p>
                        <Button onClick={() => router.push("/auth")}>Sign In</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const canAfford = freeOffer.isActive || currentBalance >= RP_PRICE;

    return (
        <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
            {/* Back button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            {/* Promo Banner */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-center py-2 px-4 rounded-lg text-sm font-medium">
                🎉 <span className="line-through opacity-75">10 UC</span> → {freeOffer.isActive ? "FREE" : "5 UC only"}! Limited time offer
            </div>

            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 mb-2">
                    <Crown className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
                    Royal Pass
                </h1>
                <p className="text-sm text-muted-foreground">Play tournaments, earn UC!</p>
            </div>

            {/* Streak Progress Card */}
            <Card className="relative overflow-hidden border-orange-200 dark:border-orange-800/30">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-amber-500/5" />
                <CardContent className="relative p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Flame className="w-5 h-5 text-orange-500" />
                            <span className="font-semibold text-sm">Tournament Streak</span>
                        </div>
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                            {streak.current}/{streak.rewardThreshold} 🔥
                        </Badge>
                    </div>

                    {/* Progress bar with 30 UC goal at end */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex gap-1 flex-1">
                            {Array.from({ length: streak.rewardThreshold }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-3 flex-1 rounded-full transition-all ${i < streak.current
                                        ? "bg-gradient-to-r from-orange-400 to-red-500"
                                        : "bg-slate-200 dark:bg-slate-700"
                                        }`}
                                />
                            ))}
                        </div>
                        <span className="text-sm font-bold text-amber-500">30 UC</span>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        Leh kai ban ban 8 tournament ioh ei 30 uc
                    </p>
                </CardContent>
            </Card>

            {/* Already has RP */}
            {hasRoyalPass ? (
                <Card className="border-green-200 dark:border-green-800/30 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                    <CardContent className="p-4 text-center">
                        <Crown className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                        <p className="font-semibold text-green-600 dark:text-green-400">
                            You have Royal Pass! 👑
                        </p>
                    </CardContent>
                </Card>
            ) : (
                /* Buy RP Button */
                <div className="space-y-2">
                    <Button
                        className={`w-full h-14 text-lg font-bold shadow-lg relative overflow-hidden disabled:opacity-50 ${freeOffer.isActive
                                ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600'
                                : 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-600 hover:via-amber-600 hover:to-orange-600'
                            } text-white`}
                        onClick={handleBuyRP}
                        disabled={isPurchasing || !canAfford}
                    >
                        {freeOffer.isActive ? (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl animate-pulse">
                                🎁 FREE
                            </div>
                        ) : (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">
                                50% OFF
                            </div>
                        )}
                        <span className="flex items-center gap-2">
                            {isPurchasing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : freeOffer.isActive ? (
                                <Gift className="w-5 h-5" />
                            ) : (
                                <Crown className="w-5 h-5" />
                            )}
                            {isPurchasing
                                ? "Claiming..."
                                : freeOffer.isActive
                                    ? "Claim FREE Royal Pass"
                                    : `Buy RP - ${RP_PRICE} UC`
                            }
                        </span>
                    </Button>

                    {/* Free offer claim count */}
                    {freeOffer.isActive && (
                        <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 font-medium">
                            🎁 {freeOffer.claimed}/{freeOffer.total} claimed • {freeOffer.remaining} FREE spots left!
                        </p>
                    )}

                    {/* Not enough UC message */}
                    {!freeOffer.isActive && !canAfford && (
                        <p className="text-xs text-center text-muted-foreground">
                            Need {RP_PRICE} UC (you have {currentBalance} UC)
                        </p>
                    )}
                </div>
            )}

            {/* How it works */}
            <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Rung ha ka tournament</li>
                    <li>Your streak increases by 1</li>
                    <li>Pep shi tournament? Ka streak la resets sha 0</li>
                    <li>Khlem pep 8 tournament → Ioh 30 UC bonus!</li>
                </ul>
            </div>
        </div>
    );
}
