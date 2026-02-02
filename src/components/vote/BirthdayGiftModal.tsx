"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, Gift, Sparkles, X, Share2, EyeOff } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import confetti from "canvas-confetti";
import { formatBirthday, getBirthdayStatus } from "@/src/utils/birthdayCheck";

const BIRTHDAY_PROMPT_KEY = "birthday_prompt_response";

type BirthdayPromptResponse = {
    pollId: string;
    response: "share" | "private";
    timestamp: number;
};

/**
 * Birthday Gift Modal - Shows when a player has a birthday within ±1 day
 * Asks if they want to share their birthday publicly on the poll
 * Persists until they make a choice (close = ask again next time)
 */
export function BirthdayGiftModal({
    isOpen,
    dateOfBirth,
    playerName,
    pollId,
    entryFee,
    onShare,
    onPrivate,
    onClose,
}: {
    isOpen: boolean;
    dateOfBirth: Date | string;
    playerName: string;
    pollId: string;
    entryFee: number;
    onShare: () => void;
    onPrivate: () => void;
    onClose: () => void;
}) {
    const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

    // Trigger confetti on mount
    useEffect(() => {
        if (isOpen && !hasTriggeredConfetti) {
            // Birthday cake themed confetti
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#ff69b4', '#ffd700', '#00bfff', '#ff6347', '#32cd32'],
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#ff69b4', '#ffd700', '#00bfff', '#ff6347', '#32cd32'],
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };

            frame();
            setHasTriggeredConfetti(true);
        }
    }, [isOpen, hasTriggeredConfetti]);

    // Reset confetti trigger when modal closes
    useEffect(() => {
        if (!isOpen) {
            setHasTriggeredConfetti(false);
        }
    }, [isOpen]);

    const birthdayStatus = getBirthdayStatus(dateOfBirth);
    const formattedBirthday = formatBirthday(dateOfBirth);

    const getBirthdayMessage = () => {
        switch (birthdayStatus) {
            case "today":
                return "It's your birthday today! 🎉";
            case "yesterday":
                return "Hope you had a great birthday yesterday! 🎂";
            case "tomorrow":
                return "Your birthday is tomorrow! 🎈";
            default:
                return "Happy Birthday Season! 🎂";
        }
    };

    const handleShare = () => {
        saveBirthdayResponse(pollId, "share");
        onShare();
    };

    const handlePrivate = () => {
        saveBirthdayResponse(pollId, "private");
        onPrivate();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 10 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        className="mx-4 w-full max-w-md relative"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute -top-2 -right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors shadow-lg"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 p-[2px] sm:p-1">
                            <div className="rounded-[14px] sm:rounded-[22px] bg-zinc-950 p-4 sm:p-6">
                                {/* Decorative elements */}
                                <div className="absolute -top-10 -right-10 h-24 sm:h-32 w-24 sm:w-32 rounded-full bg-pink-500/20 blur-3xl" />
                                <div className="absolute -bottom-10 -left-10 h-24 sm:h-32 w-24 sm:w-32 rounded-full bg-purple-500/20 blur-3xl" />

                                {/* Floating balloons */}
                                <div className="absolute top-4 left-6 text-2xl animate-bounce" style={{ animationDelay: '0s' }}>🎈</div>
                                <div className="absolute top-6 right-8 text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎈</div>
                                <div className="absolute top-8 left-1/3 text-xl animate-bounce" style={{ animationDelay: '0.6s' }}>🎊</div>

                                {/* Cake Icon */}
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
                                        <div className="rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-4 sm:p-5 shadow-lg shadow-pink-500/50">
                                            <Cake className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
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
                                        className="mb-1 text-xl sm:text-2xl font-bold text-white"
                                    >
                                        🎂 Birthday Gift!
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
                                        className="mb-2 text-base sm:text-lg text-purple-200"
                                    >
                                        {getBirthdayMessage()}
                                    </motion.p>
                                    {formattedBirthday && (
                                        <motion.p
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.45 }}
                                            className="mb-3 text-xs sm:text-sm text-zinc-400"
                                        >
                                            {formattedBirthday}
                                        </motion.p>
                                    )}

                                    {/* Free Entry Display */}
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="mb-4 sm:mb-6 flex items-center justify-center gap-2 text-xl sm:text-2xl font-bold"
                                    >
                                        <Gift className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-400" />
                                        <span className="text-white">Free Entry</span>
                                        {entryFee > 0 && (
                                            <span className="text-zinc-500 line-through text-lg">
                                                {entryFee} UC
                                            </span>
                                        )}
                                    </motion.div>

                                    {/* Share Prompt */}
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.55 }}
                                        className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10"
                                    >
                                        <p className="text-sm text-zinc-300 mb-3">
                                            Want to share your birthday with everyone on the poll?
                                        </p>
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={handleShare}
                                                className="flex-1 h-10 text-sm font-semibold bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg"
                                            >
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Yes, Show Everyone
                                            </Button>
                                            <Button
                                                onClick={handlePrivate}
                                                variant="outline"
                                                className="flex-1 h-10 text-sm font-semibold border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                            >
                                                <EyeOff className="w-4 h-4 mr-2" />
                                                Keep Private
                                            </Button>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Note */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="text-center text-[10px] sm:text-xs text-zinc-500"
                                >
                                    Your entry fee is on us! Enjoy your birthday 🎉
                                </motion.p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * Save user's response to the birthday prompt
 */
function saveBirthdayResponse(pollId: string, response: "share" | "private") {
    try {
        const existing = getBirthdayResponses();
        const updated = existing.filter(r => r.pollId !== pollId);
        updated.push({
            pollId,
            response,
            timestamp: Date.now(),
        });
        // Keep only last 10 responses to avoid localStorage bloat
        const trimmed = updated.slice(-10);
        localStorage.setItem(BIRTHDAY_PROMPT_KEY, JSON.stringify(trimmed));
    } catch (e) {
        console.error("Failed to save birthday response:", e);
    }
}

/**
 * Get all saved birthday responses
 */
function getBirthdayResponses(): BirthdayPromptResponse[] {
    try {
        const stored = localStorage.getItem(BIRTHDAY_PROMPT_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Check if user has already responded to the birthday prompt for a poll
 */
export function hasBirthdayPromptResponse(pollId: string): BirthdayPromptResponse | null {
    const responses = getBirthdayResponses();
    return responses.find(r => r.pollId === pollId) || null;
}

/**
 * Check if user chose to share their birthday publicly
 */
export function shouldShowBirthdayPublicly(pollId: string): boolean {
    const response = hasBirthdayPromptResponse(pollId);
    return response?.response === "share";
}
