"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoyalPass } from "@/src/hooks/royal-pass/useRoyalPass";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { Flame, Gift, Heart, Loader2, Sparkles, Trophy, Users } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import * as DialogPrimitive from "@radix-ui/react-dialog";

/**
 * Global non-dismissible banner for claiming pending rewards.
 * Priority: Winner > Solo Support > Referral Bonus > Streak
 * Player must claim all rewards before they can vote.
 */
export function StreakRewardBanner() {
    const { user, isSignedIn } = useAuth();
    const {
        streak,
        pendingWinner,
        pendingSoloSupport,
        pendingReferralBonus,
        claimStreakRewardAsync,
        claimWinnerRewardAsync,
        claimSoloSupportAsync,
        claimReferralBonusAsync,
        isClaimingStreakReward,
        isClaimingWinnerReward,
        isClaimingSoloSupport,
        isClaimingReferralBonus,
    } = useRoyalPass();
    const [claimedWinner, setClaimedWinner] = useState(false);
    const [claimedStreak, setClaimedStreak] = useState(false);
    const [claimedSoloSupport, setClaimedSoloSupport] = useState(false);
    const [claimedReferralBonus, setClaimedReferralBonus] = useState(false);

    // Not signed in or no player - don't show real rewards
    if (!isSignedIn || !user?.playerId) {
        return null;
    }

    // Priority 1: Show winner reward first
    if (pendingWinner && !claimedWinner) {
        return (
            <WinnerRewardModal
                amount={pendingWinner.amount}
                position={pendingWinner.position || 1}
                tournament={pendingWinner.tournament || "Tournament"}
                playerName={user?.displayName || user?.userName || "Champion"}
                onClaim={async () => {
                    await claimWinnerRewardAsync();
                    confetti({
                        particleCount: 200,
                        spread: 100,
                        origin: { y: 0.3 },
                        colors: ['#ffd700', '#ffaa00', '#ff8c00', '#ff6b00'],
                    });
                    setClaimedWinner(true);
                    toast.success(`🏆 ${pendingWinner.amount} UC added to your balance!`, {
                        duration: 5000,
                    });
                }}
                isClaiming={isClaimingWinnerReward}
            />
        );
    }

    // Priority 2: Solo support (for losers against solo winners)
    if (pendingSoloSupport && !claimedSoloSupport) {
        return (
            <SoloSupportModal
                amount={pendingSoloSupport.amount}
                message={pendingSoloSupport.message || "Support from solo winner"}
                playerName={user?.displayName || user?.userName || "Player"}
                onClaim={async () => {
                    await claimSoloSupportAsync();
                    confetti({
                        particleCount: 100,
                        spread: 60,
                        origin: { y: 0.3 },
                        colors: ['#ec4899', '#f472b6', '#f9a8d4', '#ffd700'],
                    });
                    setClaimedSoloSupport(true);
                    toast.success(`💖 ${pendingSoloSupport.amount} UC support received!`, {
                        duration: 5000,
                    });
                }}
                isClaiming={isClaimingSoloSupport}
            />
        );
    }

    // Priority 3: Referral bonus
    if (pendingReferralBonus && !claimedReferralBonus) {
        return (
            <ReferralBonusModal
                amount={pendingReferralBonus.amount}
                message={pendingReferralBonus.message || "Referral bonus"}
                playerName={user?.displayName || user?.userName || "Promoter"}
                onClaim={async () => {
                    await claimReferralBonusAsync();
                    confetti({
                        particleCount: 120,
                        spread: 80,
                        origin: { y: 0.3 },
                        colors: ['#22c55e', '#4ade80', '#86efac', '#ffd700'],
                    });
                    setClaimedReferralBonus(true);
                    toast.success(`🎉 ${pendingReferralBonus.amount} UC referral bonus claimed!`, {
                        duration: 5000,
                    });
                }}
                isClaiming={isClaimingReferralBonus}
            />
        );
    }

    // Priority 4: Streak reward
    if (streak.pendingReward && !claimedStreak) {
        return (
            <StreakRewardModal
                amount={streak.pendingReward}
                playerName={user?.displayName || user?.userName || "Champion"}
                onClaim={async () => {
                    await claimStreakRewardAsync();
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.3 },
                        colors: ['#ff6b00', '#ffd700', '#ff8c00', '#ffaa00'],
                    });
                    setClaimedStreak(true);
                    toast.success(`🔥 ${streak.pendingReward} UC added to your balance!`, {
                        duration: 5000,
                    });
                }}
                isClaiming={isClaimingStreakReward}
            />
        );
    }

    return null;
}

function WinnerRewardModal({
    amount,
    position,
    tournament,
    playerName,
    onClaim,
    isClaiming,
}: {
    amount: number;
    position: number;
    tournament: string;
    playerName: string;
    onClaim: () => void;
    isClaiming: boolean;
}) {
    const getOrdinal = (n: number): string => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return (
        <DialogPrimitive.Root open={true}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" />
                <DialogPrimitive.Content
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogPrimitive.Title className="sr-only">Claim Your Prize</DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">You won a prize! Claim it now.</DialogPrimitive.Description>
                    <AnimatePresence>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="mx-4 w-full max-w-md"
                        >
                            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 p-[2px] sm:p-1">
                                <div className="rounded-[14px] sm:rounded-[22px] bg-zinc-950 p-4 sm:p-6">
                                    {/* Decorative elements */}
                                    <div className="absolute -top-10 -right-10 h-24 sm:h-32 w-24 sm:w-32 rounded-full bg-yellow-500/20 blur-3xl" />
                                    <div className="absolute -bottom-10 -left-10 h-24 sm:h-32 w-24 sm:w-32 rounded-full bg-amber-500/20 blur-3xl" />

                                    {/* Icon */}
                                    <div className="relative mb-4 sm:mb-6 flex justify-center">
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                rotate: [0, -3, 3, 0],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                            className="relative"
                                        >
                                            <div className="rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 p-4 sm:p-5 shadow-lg shadow-yellow-500/50">
                                                <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                                            </div>
                                            <motion.div
                                                animate={{ scale: [1, 1.3, 1] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                                className="absolute -right-1 -top-1"
                                            >
                                                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
                                            </motion.div>
                                        </motion.div>
                                    </div>

                                    {/* Text */}
                                    <div className="relative text-center">
                                        <motion.h2
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="mb-0 text-xl sm:text-2xl font-bold text-white"
                                        >
                                            🏆 Congratulations!
                                        </motion.h2>
                                        <motion.p
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.35 }}
                                            className="mb-1 sm:mb-2 text-lg sm:text-xl font-semibold text-yellow-400 line-clamp-1"
                                        >
                                            {playerName}
                                        </motion.p>
                                        <motion.p
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="mb-0.5 text-base sm:text-lg text-amber-200"
                                        >
                                            You placed <span className="font-bold text-white">{getOrdinal(position)}</span>
                                        </motion.p>
                                        <motion.p
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.45 }}
                                            className="mb-3 sm:mb-4 text-xs sm:text-sm text-zinc-400 line-clamp-1"
                                        >
                                            {tournament}
                                        </motion.p>
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="mb-4 sm:mb-6 flex items-center justify-center gap-2 text-2xl sm:text-3xl font-bold"
                                        >
                                            <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
                                            <span className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                                                {amount} UC
                                            </span>
                                        </motion.div>
                                    </div>

                                    {/* Claim Button */}
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        <Button
                                            onClick={onClaim}
                                            disabled={isClaiming}
                                            className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg shadow-yellow-500/30 transition-all hover:shadow-xl hover:shadow-yellow-500/40"
                                        >
                                            {isClaiming ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Claiming...
                                                </>
                                            ) : (
                                                <>
                                                    <Trophy className="mr-2 h-5 w-5" />
                                                    Claim Your Prize!
                                                </>
                                            )}
                                        </Button>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

// Streak Reward Modal
function StreakRewardModal({
    amount,
    playerName,
    onClaim,
    isClaiming,
}: {
    amount: number;
    playerName: string;
    onClaim: () => void;
    isClaiming: boolean;
}) {
    return (
        <DialogPrimitive.Root open={true}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" />
                <DialogPrimitive.Content
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogPrimitive.Title className="sr-only">Claim Your Reward</DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">You earned a streak reward! Claim it now.</DialogPrimitive.Description>
                    <AnimatePresence>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="mx-4 w-full max-w-md"
                        >
                            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-[2px] sm:p-1">
                                <div className="rounded-[14px] sm:rounded-[22px] bg-zinc-950 p-4 sm:p-6">
                                    {/* Decorative elements */}
                                    <div className="absolute -top-10 -right-10 h-24 sm:h-32 w-24 sm:w-32 rounded-full bg-orange-500/20 blur-3xl" />
                                    <div className="absolute -bottom-10 -left-10 h-24 sm:h-32 w-24 sm:w-32 rounded-full bg-amber-500/20 blur-3xl" />

                                    {/* Icon */}
                                    <div className="relative mb-4 sm:mb-6 flex justify-center">
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                rotate: [0, -5, 5, 0],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                            className="relative"
                                        >
                                            <div className="rounded-full bg-gradient-to-br from-orange-500 to-amber-500 p-4 sm:p-5 shadow-lg shadow-orange-500/50">
                                                <Flame className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                                            </div>
                                            <motion.div
                                                animate={{ scale: [1, 1.3, 1] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                                className="absolute -right-1 -top-1"
                                            >
                                                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
                                            </motion.div>
                                        </motion.div>
                                    </div>

                                    {/* Text */}
                                    <div className="relative text-center">
                                        <motion.h2
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="mb-0 text-xl sm:text-2xl font-bold text-white"
                                        >
                                            🔥 Great job!
                                        </motion.h2>
                                        <motion.p
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.35 }}
                                            className="mb-1 sm:mb-2 text-lg sm:text-xl font-semibold text-orange-400 line-clamp-1"
                                        >
                                            {playerName}
                                        </motion.p>
                                        <motion.p
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="mb-2 text-sm sm:text-base text-orange-200"
                                        >
                                            You hit <span className="font-bold text-white">8 consecutive tournaments!</span>
                                        </motion.p>
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="mb-4 sm:mb-6 flex items-center justify-center gap-2 text-2xl sm:text-3xl font-bold"
                                        >
                                            <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-amber-400" />
                                            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                                                {amount} UC
                                            </span>
                                        </motion.div>
                                    </div>

                                    {/* Claim Button */}
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        <Button
                                            onClick={onClaim}
                                            disabled={isClaiming}
                                            className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
                                        >
                                            {isClaiming ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Claiming...
                                                </>
                                            ) : (
                                                <>
                                                    <Gift className="mr-2 h-5 w-5" />
                                                    Claim Your Reward!
                                                </>
                                            )}
                                        </Button>
                                    </motion.div>

                                    {/* Note */}
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.8 }}
                                        className="mt-3 sm:mt-4 text-center text-[10px] sm:text-xs text-zinc-400"
                                    >
                                        Your streak has been reset. Keep playing to earn more rewards!
                                    </motion.p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

// Solo Support Modal (for losers who played against solo winners)
function SoloSupportModal({
    amount,
    message,
    playerName,
    onClaim,
    isClaiming,
}: {
    amount: number;
    message: string;
    playerName: string;
    onClaim: () => void;
    isClaiming: boolean;
}) {
    return (
        <DialogPrimitive.Root open={true}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" />
                <DialogPrimitive.Content
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogPrimitive.Title className="sr-only">Solo Winner Support</DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">You received support from a solo winner.</DialogPrimitive.Description>
                    <AnimatePresence>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="mx-4 w-full max-w-md"
                        >
                            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 p-[2px] sm:p-1">
                                <div className="rounded-[14px] sm:rounded-[22px] bg-zinc-950 p-4 sm:p-6">
                                    {/* Heart Icon */}
                                    <div className="flex justify-center mb-3 sm:mb-4">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.3, type: "spring" }}
                                            className="relative"
                                        >
                                            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                                                <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-white fill-white" />
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Text */}
                                    <div className="relative text-center">
                                        <motion.h2
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="mb-0 text-xl sm:text-2xl font-bold text-white"
                                        >
                                            💖 Solo Winner Support!
                                        </motion.h2>
                                        <motion.p
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.35 }}
                                            className="mb-1 sm:mb-2 text-lg sm:text-xl font-semibold text-pink-400 line-clamp-1"
                                        >
                                            {playerName}
                                        </motion.p>
                                        <motion.p
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="mb-2 text-sm sm:text-base text-pink-200"
                                        >
                                            {message}
                                        </motion.p>
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="my-3 sm:my-4 flex items-center justify-center gap-2"
                                        >
                                            <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-pink-400" />
                                            <span className="text-2xl sm:text-3xl font-bold text-pink-400">{amount} UC</span>
                                        </motion.div>
                                    </div>

                                    {/* Claim Button */}
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        <Button
                                            onClick={onClaim}
                                            disabled={isClaiming}
                                            className="w-full h-10 sm:h-12 text-base sm:text-lg font-bold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg"
                                        >
                                            {isClaiming ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                                    Claiming...
                                                </>
                                            ) : (
                                                <>
                                                    <Heart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                                    Claim Support
                                                </>
                                            )}
                                        </Button>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

// Referral Bonus Modal (for promoters)
function ReferralBonusModal({
    amount,
    message,
    playerName,
    onClaim,
    isClaiming,
}: {
    amount: number;
    message: string;
    playerName: string;
    onClaim: () => void;
    isClaiming: boolean;
}) {
    return (
        <DialogPrimitive.Root open={true}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" />
                <DialogPrimitive.Content
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogPrimitive.Title className="sr-only">Referral Bonus</DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">You earned a referral bonus! Claim it now.</DialogPrimitive.Description>
                    <AnimatePresence>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="mx-4 w-full max-w-md"
                        >
                            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-[2px] sm:p-1">
                                <div className="rounded-[14px] sm:rounded-[22px] bg-zinc-950 p-4 sm:p-6">
                                    {/* Users Icon */}
                                    <div className="flex justify-center mb-3 sm:mb-4">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.3, type: "spring" }}
                                            className="relative"
                                        >
                                            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Text */}
                                    <div className="relative text-center">
                                        <motion.h2
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="mb-0 text-xl sm:text-2xl font-bold text-white"
                                        >
                                            🎉 Referral Bonus!
                                        </motion.h2>
                                        <motion.p
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.35 }}
                                            className="mb-1 sm:mb-2 text-lg sm:text-xl font-semibold text-green-400 line-clamp-1"
                                        >
                                            {playerName}
                                        </motion.p>
                                        <motion.p
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="mb-2 text-sm sm:text-base text-green-200"
                                        >
                                            {message}
                                        </motion.p>
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="my-3 sm:my-4 flex items-center justify-center gap-2"
                                        >
                                            <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                                            <span className="text-2xl sm:text-3xl font-bold text-green-400">{amount} UC</span>
                                        </motion.div>
                                    </div>

                                    {/* Claim Button */}
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        <Button
                                            onClick={onClaim}
                                            disabled={isClaiming}
                                            className="w-full h-10 sm:h-12 text-base sm:text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                                        >
                                            {isClaiming ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                                    Claiming...
                                                </>
                                            ) : (
                                                <>
                                                    <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                                    Claim Bonus
                                                </>
                                            )}
                                        </Button>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
