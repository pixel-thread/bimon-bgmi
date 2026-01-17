"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useRoyalPass } from "@/src/hooks/royal-pass/useRoyalPass";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { toast } from "sonner";
import { Crown, Trophy, TrendingUp, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";

// FOMO messages for non-subscribed users
const FOMO_MESSAGES = [
    {
        title: "Long ba 3? bad ioh UC rei",
        description: "Khuslai rei ioh lot bai rung da n RP 🏆",
        emoji: "💰",
    },
    {
        title: "One-Time Fee → Insurance Every Game",
        description: "Close finishes? Never lose entry fee!",
        emoji: "🧮",
    },
    {
        title: "Safety Net for Season",
        description: "Just missed 2nd? Still get entry back!",
        emoji: "🚀",
    },
];

// Messages for subscribed users - function to include dynamic savings
const getSubscribedMessages = (totalSaved: number) => [
    totalSaved > 0
        ? {
            title: `You saved ${totalSaved} UC this season!`,
            description: "Your Safety Net is paying off. Keep playing!",
            emoji: "💰",
        }
        : {
            title: "You're protected on close finishes!",
            description: "Just miss the prize? Get entry fee back.",
            emoji: "👑",
        },
    {
        title: "Your Safety Net is ACTIVE",
        description: "Almost 2nd place? Entry fee refunded.",
        emoji: "🔥",
    },
];

// Loss-triggered FOMO messages - function to include dynamic position, fee, and tournament
// Returns null if params missing, so we fall back to FOMO_MESSAGES
const getLossMessages = (position: number | null, fee: number | null, tournamentName: string | null) => {
    if (position && fee) {
        const positionSuffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';
        const tournamentText = tournamentName ? ` in ${tournamentName}` : '';
        return [{
            title: `You finished ${position}${positionSuffix}${tournamentText}!`,
            description: `With Royal Pass, you'd have gotten ${fee} UC back!`,
            emoji: "😤",
        }];
    }
    return null; // Fall back to FOMO_MESSAGES
};

export default function RoyalPassPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthLoading } = useAuth();
    const {
        hasRoyalPass,
        isActive,
        rpPrice,
        bonusPercentage,
        seasonName,
        seasonEndDate,
        totalBonusEarned,
        currentBalance,
        isLoading,
        isSubscribing,
        subscribe,
    } = useRoyalPass();

    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const isLost = searchParams.get("lost") === "true";
    const lossPosition = searchParams.get("position") ? parseInt(searchParams.get("position")!) : null;
    const lossFee = searchParams.get("fee") ? parseInt(searchParams.get("fee")!) : null;
    const lossTournament = searchParams.get("tournament");

    // Rotate messages every 5 seconds
    useEffect(() => {
        const lossMessages = getLossMessages(lossPosition, lossFee, lossTournament);
        const messages = hasRoyalPass ? getSubscribedMessages(totalBonusEarned) : (lossMessages || FOMO_MESSAGES);
        if (messages.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [hasRoyalPass, isLost]);

    const handleSubscribe = async () => {
        if (currentBalance < rpPrice) {
            toast.error(`Insufficient balance. You need ${rpPrice} UC but have ${currentBalance} UC.`);
            return;
        }

        const result = await subscribe();
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
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
                    <Skeleton className="h-12 w-full rounded-xl" />
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
                        <Crown className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                        <h2 className="text-xl font-bold mb-2">Royal Pass</h2>
                        <p className="text-muted-foreground mb-4">Sign in to unlock Royal Pass benefits</p>
                        <Button onClick={() => router.push("/auth")}>Sign In</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const lossMessages = getLossMessages(lossPosition, lossFee, lossTournament);
    const messages = hasRoyalPass ? getSubscribedMessages(totalBonusEarned) : (lossMessages || FOMO_MESSAGES);
    const currentMessage = messages[currentMessageIndex % messages.length];

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

            {/* Header - more compact */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-2">
                    <Crown className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    Royal Pass
                </h1>
                {seasonName && (
                    <p className="text-sm text-muted-foreground">{seasonName}</p>
                )}
            </div>

            {/* Status Badge */}
            {hasRoyalPass && isActive ? (
                <div className="flex justify-center">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 text-sm gap-2">
                        <Crown className="w-4 h-4" />
                        Royal Pass Active
                    </Badge>
                </div>
            ) : null}

            {/* Rotating Message Card - compact */}
            <Card className="relative overflow-hidden border-amber-200 dark:border-amber-800/30">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-yellow-500/5" />
                <CardContent className="relative p-4 text-center">
                    <div className="text-3xl mb-2">{currentMessage.emoji}</div>
                    <h2 className="text-lg font-bold mb-1">{currentMessage.title}</h2>
                    <p className="text-sm text-muted-foreground">{currentMessage.description}</p>

                    {/* Dots indicator */}
                    {messages.length > 1 && (
                        <div className="flex justify-center gap-1.5 mt-3">
                            {messages.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentMessageIndex % messages.length
                                        ? "bg-amber-500"
                                        : "bg-amber-200 dark:bg-amber-800"
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Benefits - compact */}
            <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">Safety Net</p>
                        <p className="text-xs text-muted-foreground truncate">Just miss the prize = entry fee back</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                    <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">Example</p>
                        <p className="text-xs text-muted-foreground">1st & 2nd get UC, you're 3rd → entry fee back</p>
                    </div>
                </div>
            </div>

            {/* Subscribe Button - immediately visible */}
            {!hasRoyalPass && (
                <div className="space-y-2">
                    <Button
                        onClick={handleSubscribe}
                        disabled={isSubscribing || currentBalance < rpPrice}
                        className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    >
                        {isSubscribing ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Subscribing...
                            </>
                        ) : (
                            <>
                                <Crown className="w-5 h-5 mr-2" />
                                Get Royal Pass - {rpPrice} UC
                            </>
                        )}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        Your balance: <span className={currentBalance >= rpPrice ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>{currentBalance} UC</span>
                        {currentBalance < rpPrice && (
                            <span className="text-red-500"> (need {rpPrice - currentBalance} more)</span>
                        )}
                    </p>
                </div>
            )}

            {/* Subscribed User Stats - compact */}
            {hasRoyalPass && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{totalBonusEarned} UC</p>
                        <p className="text-xs text-muted-foreground">Bonus Earned</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-semibold">
                            {seasonEndDate ? format(new Date(seasonEndDate), "MMM d, yyyy") : "Season End"}
                        </p>
                        <p className="text-xs text-muted-foreground">Valid Until</p>
                    </div>
                </div>
            )}
        </div>
    );
}

