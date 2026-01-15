"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import http from "@/src/utils/http";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { toast } from "sonner";
import {
    Gift,
    Copy,
    Check,
    Users,
    TrendingUp,
    Coins,
    ExternalLink,
    Loader2,
    AlertCircle,
} from "lucide-react";

interface PromoterData {
    isPromoter: boolean;
    referralCode: string | null;
    promoterEarnings: number;
    referralStats: {
        totalSignups: number;
        pendingCount: number;
        qualifiedCount: number;
        paidCount: number;
    };
    referrals: Array<{
        id: string;
        playerName: string;
        tournamentsCompleted: number;
        status: "PENDING" | "QUALIFIED" | "PAID";
        createdAt: string;
    }>;
}

export function PromoterTab() {
    const { user, refreshAuth } = useAuth();
    const queryClient = useQueryClient();
    const [referralCode, setReferralCode] = useState("");
    const [copied, setCopied] = useState(false);
    const [codeError, setCodeError] = useState("");

    // Fetch promoter data
    const { data: promoterData, isLoading } = useQuery({
        queryKey: ["promoter-data"],
        queryFn: () => http.get<PromoterData>("/promoter"),
        enabled: !!user?.playerId,
    });

    const promoter = promoterData?.data;

    // Enable promoter mode mutation
    const { mutate: enablePromoter, isPending: isEnabling } = useMutation({
        mutationFn: (data: { referralCode: string }) =>
            http.post("/promoter", data),
        onSuccess: () => {
            toast.success("You're now a promoter! Share your link to earn rewards.");
            queryClient.invalidateQueries({ queryKey: ["promoter-data"] });
            refreshAuth();
        },
        onError: (err: any) => {
            const message = err?.response?.data?.message || "Failed to enable promoter mode";
            setCodeError(message);
            toast.error(message);
        },
    });

    // Update referral code mutation
    const { mutate: updateCode, isPending: isUpdating } = useMutation({
        mutationFn: (data: { referralCode: string }) =>
            http.patch("/promoter", data),
        onSuccess: () => {
            toast.success("Referral code updated!");
            queryClient.invalidateQueries({ queryKey: ["promoter-data"] });
        },
        onError: (err: any) => {
            const message = err?.response?.data?.message || "Failed to update code";
            setCodeError(message);
            toast.error(message);
        },
    });

    // Validate referral code
    const validateCode = (code: string): string => {
        if (code.length < 3) return "Code must be at least 3 characters";
        if (code.length > 20) return "Code must be at most 20 characters";
        if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
            return "Code can only contain letters, numbers, underscores and dashes";
        }
        return "";
    };

    const handleEnablePromoter = () => {
        const error = validateCode(referralCode);
        if (error) {
            setCodeError(error);
            return;
        }
        setCodeError("");
        enablePromoter({ referralCode: referralCode.toLowerCase() });
    };

    const getReferralLink = () => {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
        return `${baseUrl}?ref=${promoter?.referralCode}`;
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(getReferralLink());
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden p-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10" />
                    <div className="absolute inset-0 backdrop-blur-3xl" />
                    <div className="relative space-y-4">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    // Not a promoter yet - show enable UI
    if (!promoter?.isPromoter) {
        return (
            <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 dark:from-amber-600/20 dark:via-orange-600/20 dark:to-rose-600/20" />
                    <div className="absolute inset-0 backdrop-blur-3xl" />

                    <div className="relative p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                <Gift className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Become a Promoter</h3>
                                <p className="text-sm text-muted-foreground">
                                    Earn 5 UC for every player who joins and completes 5 tournaments
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                                Choose your referral code
                            </label>
                            <Input
                                value={referralCode}
                                onChange={(e) => {
                                    setReferralCode(e.target.value);
                                    setCodeError("");
                                }}
                                placeholder="e.g., bimon123"
                                className={codeError ? "border-red-500" : ""}
                            />
                            {codeError && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {codeError}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Your link will be: {typeof window !== "undefined" ? window.location.origin : ""}?ref=
                                <span className="font-medium text-amber-600">{referralCode || "yourcode"}</span>
                            </p>
                        </div>

                        <Button
                            onClick={handleEnablePromoter}
                            disabled={isEnabling || !referralCode.trim()}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        >
                            {isEnabling ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Enabling...
                                </>
                            ) : (
                                <>
                                    <Gift className="w-4 h-4 mr-2" />
                                    Start Promoting
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Promoter dashboard
    return (
        <div className="space-y-4">
            {/* Referral Link Card */}
            <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 dark:from-amber-600/20 dark:via-orange-600/20 dark:to-rose-600/20" />
                <div className="absolute inset-0 backdrop-blur-3xl" />

                <div className="relative p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                <Gift className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="font-semibold">Your Referral Link</h3>
                        </div>
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            Active
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/60 dark:bg-slate-800/60 rounded-lg px-3 py-2 text-sm font-mono truncate">
                            {getReferralLink()}
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={copyLink}
                            className="flex-shrink-0"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-500" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Share this link with friends. You earn <span className="font-bold text-amber-600">5 UC</span> when they complete 5 tournaments!
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="relative rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
                    <div className="absolute inset-0 backdrop-blur-3xl" />
                    <div className="relative p-3 text-center">
                        <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                        <p className="text-2xl font-bold">{promoter.referralStats.totalSignups}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Signups</p>
                    </div>
                </div>

                <div className="relative rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
                    <div className="absolute inset-0 backdrop-blur-3xl" />
                    <div className="relative p-3 text-center">
                        <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                        <p className="text-2xl font-bold">{promoter.referralStats.pendingCount}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">In Progress</p>
                    </div>
                </div>

                <div className="relative rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10" />
                    <div className="absolute inset-0 backdrop-blur-3xl" />
                    <div className="relative p-3 text-center">
                        <Coins className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                        <p className="text-2xl font-bold">{promoter.promoterEarnings}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">UC Earned</p>
                    </div>
                </div>
            </div>

            {/* Referrals List */}
            {promoter.referrals.length > 0 && (
                <div className="relative rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5" />
                    <div className="absolute inset-0 backdrop-blur-3xl" />

                    <div className="relative p-4">
                        <h4 className="font-semibold mb-3">Recent Referrals</h4>
                        <div className="space-y-2">
                            {promoter.referrals.slice(0, 5).map((ref) => (
                                <div
                                    key={ref.id}
                                    className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-slate-800/50"
                                >
                                    <div>
                                        <p className="font-medium text-sm">{ref.playerName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {ref.tournamentsCompleted}/5 tournaments
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={
                                            ref.status === "PAID"
                                                ? "bg-green-500/10 text-green-600 border-green-500/30"
                                                : ref.status === "QUALIFIED"
                                                    ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                                                    : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                        }
                                    >
                                        {ref.status === "PAID"
                                            ? "✓ Paid"
                                            : ref.status === "QUALIFIED"
                                                ? "Qualified"
                                                : `${ref.tournamentsCompleted}/5`}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {promoter.referrals.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No referrals yet</p>
                    <p className="text-xs">Share your link to start earning!</p>
                </div>
            )}
        </div>
    );
}
