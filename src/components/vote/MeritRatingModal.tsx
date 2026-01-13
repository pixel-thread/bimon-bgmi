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

interface PendingRating {
    playerId: string;
    displayName: string;
}

interface MeritRatingModalProps {
    pendingRatings: PendingRating[];
    tournamentId: string;
    onComplete: () => void;
}

const STAR_LABELS: Record<number, string> = {
    1: "sngewbang rei",
    3: "chu bieng",
    5: "sngew bang bha",
};

export function MeritRatingModal({
    pendingRatings,
    tournamentId,
    onComplete,
}: MeritRatingModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
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
            setHoverRating(0);
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
                    <DialogDescription>Select stars to rate your teammate</DialogDescription>
                </VisuallyHidden>

                <div className="flex flex-col items-center py-6 px-4">
                    {/* Player info */}
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center truncate max-w-full">
                        {currentPlayer?.displayName}
                    </h2>
                    <p className="text-sm text-zinc-400 mb-6">Good teammate?</p>

                    {/* 5 Star Rating */}
                    <div className="flex flex-col items-center w-full">
                        <div
                            className="flex gap-3 sm:gap-4"
                            onMouseLeave={() => setHoverRating(0)}
                        >
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => handleRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    className="text-3xl sm:text-4xl p-1 transition-all duration-150 hover:scale-110 active:scale-95 focus:outline-none"
                                >
                                    ⭐
                                </button>
                            ))}
                        </div>

                        {/* Labels */}
                        <div className="flex justify-between w-full mt-3">
                            <span className="text-[10px] sm:text-xs text-zinc-500">{STAR_LABELS[1]}</span>
                            <span className="text-[10px] sm:text-xs text-zinc-500">{STAR_LABELS[3]}</span>
                            <span className="text-[10px] sm:text-xs text-zinc-500">{STAR_LABELS[5]}</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
