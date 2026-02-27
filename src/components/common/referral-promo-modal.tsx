"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Users, Gift, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";

const PROMO_KEY = "referral-promo-v2-seen";

/**
 * One-time referral promo modal.
 * Shows on next visit to announce the 20 UC referral reward.
 * Dismisses permanently via localStorage.
 */
const SKIP_DELAY = 5; // seconds before skip is allowed

export function ReferralPromoModal() {
    const [show, setShow] = useState(false);
    const [countdown, setCountdown] = useState(SKIP_DELAY);
    const [navigating, setNavigating] = useState(false);
    const canSkip = countdown <= 0;
    const router = useRouter();

    useEffect(() => {
        // Small delay so it doesn't flash on initial render
        const timer = setTimeout(() => {
            if (!localStorage.getItem(PROMO_KEY)) {
                setShow(true);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    // Countdown timer
    useEffect(() => {
        if (!show || countdown <= 0) return;
        const interval = setInterval(() => {
            setCountdown((c) => c - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [show, countdown]);

    const dismiss = () => {
        setShow(false);
        localStorage.setItem(PROMO_KEY, "1");
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        onClick={dismiss}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 40 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-green-500/30 bg-gradient-to-b from-green-950/95 via-emerald-950/95 to-background/95 shadow-2xl shadow-green-500/20 backdrop-blur-xl"
                    >
                        {/* Close button with countdown ring */}
                        <button
                            onClick={canSkip ? dismiss : undefined}
                            className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors ${canSkip
                                ? "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white cursor-pointer"
                                : "bg-white/5 text-white/20 cursor-not-allowed"
                                }`}
                        >
                            {canSkip ? (
                                <X className="h-4 w-4" />
                            ) : (
                                <span className="text-[10px] font-bold text-white/40">{countdown}</span>
                            )}
                            {/* Circular countdown */}
                            {!canSkip && (
                                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                                    <circle
                                        cx="18" cy="18" r="15"
                                        fill="none" stroke="currentColor"
                                        strokeWidth="2" className="text-white/10"
                                    />
                                    <circle
                                        cx="18" cy="18" r="15"
                                        fill="none" stroke="currentColor"
                                        strokeWidth="2" className="text-green-400/60"
                                        strokeDasharray={`${(1 - countdown / SKIP_DELAY) * 94.2} 94.2`}
                                        strokeLinecap="round"
                                        style={{ transition: "stroke-dasharray 1s linear" }}
                                    />
                                </svg>
                            )}
                        </button>

                        {/* Animated sparkles background */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[
                                { x1: "10%", y1: "15%", x2: "80%", y2: "70%" },
                                { x1: "85%", y1: "20%", x2: "20%", y2: "85%" },
                                { x1: "50%", y1: "5%", x2: "30%", y2: "60%" },
                                { x1: "15%", y1: "75%", x2: "70%", y2: "25%" },
                                { x1: "70%", y1: "50%", x2: "10%", y2: "40%" },
                                { x1: "40%", y1: "90%", x2: "90%", y2: "10%" },
                            ].map((pos, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute"
                                    style={{ left: pos.x1, top: pos.y1 }}
                                    animate={{
                                        left: [pos.x1, pos.x2, pos.x1],
                                        top: [pos.y1, pos.y2, pos.y1],
                                        opacity: [0, 0.8, 0],
                                        scale: [0, 1.2, 0],
                                        rotate: [0, 180, 360],
                                    }}
                                    transition={{
                                        duration: 3 + i * 0.5,
                                        repeat: Infinity,
                                        delay: i * 0.6,
                                        ease: "easeInOut",
                                    }}
                                >
                                    <Sparkles className="h-4 w-4 text-green-400/50" />
                                </motion.div>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="relative px-6 pt-8 pb-6 text-center space-y-5">
                            {/* Badge */}
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-500 text-white text-xs font-bold shadow-lg shadow-green-500/40 animate-pulse">
                                    🎁 NEW REWARD
                                </span>
                            </motion.div>

                            {/* FREE text */}
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, type: "spring", damping: 12 }}
                                className="space-y-1"
                            >
                                <div className="text-6xl font-black tracking-tight bg-gradient-to-b from-green-300 via-emerald-400 to-green-500 bg-clip-text text-transparent drop-shadow-lg leading-none">
                                    FREE
                                </div>
                                <div className="text-4xl font-black text-white">
                                    20 UC
                                </div>
                            </motion.div>

                            {/* Description */}
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.45 }}
                                className="space-y-3"
                            >
                                <p className="text-lg font-semibold text-green-300">
                                    Refer a friend & earn!
                                </p>
                                <p className="text-xs text-amber-400/80 animate-pulse">
                                    ⏳ Limited time only — don't miss out!
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-left">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                                            <Users className="h-5 w-5 text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">Invite your friend</p>
                                            <p className="text-xs text-white/50">Share your referral code</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-left">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                                            <Gift className="h-5 w-5 text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">They play 5 tournaments</p>
                                            <p className="text-xs text-white/50">You get <span className="font-bold text-green-400">20 UC</span> automatically!</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* CTA */}
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="space-y-2 pt-1"
                            >
                                <Button
                                    fullWidth
                                    size="lg"
                                    isLoading={navigating}
                                    className="h-14 text-lg font-bold text-white bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-shadow"
                                    onPress={() => {
                                        setNavigating(true);
                                        dismiss();
                                        router.push("/refer");
                                    }}
                                >
                                    🚀 Start Referring
                                </Button>
                                <button
                                    onClick={canSkip ? dismiss : undefined}
                                    className={`text-xs transition-colors ${canSkip
                                        ? "text-white/40 hover:text-white/60 cursor-pointer"
                                        : "text-white/20 cursor-not-allowed"
                                        }`}
                                >
                                    {canSkip ? "Maybe later" : `Wait ${countdown}s...`}
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
