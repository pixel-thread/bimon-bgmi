"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/src/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/src/lib/utils";

interface PendingRating {
    playerId: string;
    displayName: string;
}

interface MeritRatingModalProps {
    pendingRatings: PendingRating[];
    tournamentId: string;
    onComplete: () => void;
}

const MERIT_EMOJIS = [
    { value: 1, emoji: "🤡", color: "from-red-600 to-red-800" },
    { value: 2, emoji: "😠", color: "from-orange-500 to-orange-700" },
    { value: 3, emoji: "😐", color: "from-yellow-500 to-yellow-600" },
    { value: 4, emoji: "😊", color: "from-green-500 to-green-600" },
    { value: 5, emoji: "🔥", color: "from-blue-500 to-purple-600" },
];

export function MeritRatingModal({
    pendingRatings,
    tournamentId,
    onComplete,
}: MeritRatingModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const { getToken } = useAuth();

    const currentPlayer = pendingRatings[currentIndex];
    const isLastPlayer = currentIndex >= pendingRatings.length - 1;

    const handleRating = async (rating: number) => {
        const playerToRate = currentPlayer;

        // Immediately move to next or close modal
        if (isLastPlayer) {
            onComplete();
        } else {
            setCurrentIndex((prev) => prev + 1);
        }

        // Save in background - fire and forget
        try {
            const token = await getToken({ template: "jwt" });
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/merit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    toPlayerId: playerToRate.playerId,
                    rating,
                    tournamentId,
                }),
            }).catch(() => {
                // Silently fail - will show again on next visit if still pending
            });
        } catch {
            // Silently fail
        }
    };

    if (pendingRatings.length === 0) {
        return null;
    }

    return (
        <Dialog open={true}>
            <DialogContent
                className="w-[calc(100%-2rem)] max-w-sm mx-auto bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl [&>button]:hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <VisuallyHidden>
                    <DialogTitle>Rate your teammate</DialogTitle>
                    <DialogDescription>Select an emoji to rate your teammate</DialogDescription>
                </VisuallyHidden>

                <div className="flex flex-col items-center py-6 px-4">
                    {/* Player info */}
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center truncate max-w-full">
                        {currentPlayer?.displayName}
                    </h2>
                    <p className="text-sm text-zinc-400 mb-6">Good teammate?</p>

                    {/* Emoji buttons - single row */}
                    <div className="flex justify-center gap-1.5 sm:gap-3">
                        {MERIT_EMOJIS.map(({ value, emoji, color }) => (
                            <button
                                key={value}
                                onClick={() => handleRating(value)}
                                className={cn(
                                    "text-xl sm:text-3xl p-2.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200",
                                    "hover:scale-110 active:scale-95 focus:outline-none",
                                    "bg-zinc-800/60 hover:bg-zinc-700/60"
                                )}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
