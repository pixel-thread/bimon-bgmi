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
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import { HelpCircle, Loader2 } from "lucide-react";

interface PendingRating {
    playerId: string;
    displayName: string;
}

interface MeritRatingModalProps {
    pendingRatings: PendingRating[];
    tournamentId: string;
    tournamentName?: string;
    onComplete: () => void;
}

export function MeritRatingModal({
    pendingRatings,
    tournamentId,
    tournamentName,
    onComplete,
}: MeritRatingModalProps) {
    // Track ratings for all players: playerId -> rating (1-5) or null
    const [ratings, setRatings] = useState<Record<string, number | null>>(
        Object.fromEntries(pendingRatings.map(p => [p.playerId, null]))
    );
    const [hoverRatings, setHoverRatings] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuth();

    // Check if all players have been rated
    const allRated = pendingRatings.every(p => ratings[p.playerId] !== null);

    const handleStarClick = (playerId: string, rating: number) => {
        setRatings(prev => ({ ...prev, [playerId]: rating }));
        setError(null);
    };

    const handleStarHover = (playerId: string, rating: number) => {
        setHoverRatings(prev => ({ ...prev, [playerId]: rating }));
    };

    const handleStarLeave = (playerId: string) => {
        setHoverRatings(prev => {
            const updated = { ...prev };
            delete updated[playerId];
            return updated;
        });
    };

    const handleSaveAll = async () => {
        if (!allRated) return;

        setIsSubmitting(true);
        setError(null);



        try {
            const token = await getToken({ template: "jwt" });

            // Submit all ratings in parallel
            const submissions = pendingRatings.map(player =>
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/merit`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        toPlayerId: player.playerId,
                        rating: ratings[player.playerId],
                        tournamentId,
                    }),
                })
            );

            const results = await Promise.all(submissions);

            // Check if all succeeded
            const allSucceeded = results.every(res => res.ok);

            if (!allSucceeded) {
                throw new Error("Some ratings failed to submit");
            }

            // Success - close modal
            onComplete();
        } catch (err) {
            console.error("Failed to submit ratings:", err);
            setError("Failed to save ratings. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (pendingRatings.length === 0) {
        return null;
    }

    return (
        <Dialog open={true}>
            <DialogContent
                className="w-[calc(100%-2rem)] max-w-md mx-auto bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl [&>button]:hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <VisuallyHidden>
                    <DialogTitle>Rate your teammates</DialogTitle>
                    <DialogDescription>Rate all your teammates from the tournament</DialogDescription>
                </VisuallyHidden>

                <div className="flex flex-col py-4 px-4 sm:px-6">
                    {/* Header */}
                    <div className="mb-4 text-center">
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                            Rate Your Teammates
                        </h2>
                        {tournamentName && (
                            <p className="text-xs sm:text-sm text-zinc-400">
                                {tournamentName}
                            </p>
                        )}
                    </div>

                    {/* Scrollable player list */}
                    <div className="max-h-[60vh] overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                        {pendingRatings.map((player, index) => {
                            const playerRating = ratings[player.playerId];
                            const playerHover = hoverRatings[player.playerId] || 0;
                            const displayRating = playerHover || playerRating || 0;

                            return (
                                <div
                                    key={player.playerId}
                                    className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50"
                                >
                                    {/* Player name */}
                                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 truncate">
                                        {player.displayName}
                                    </h3>

                                    {/* Star rating */}
                                    <div className="flex flex-col items-center">
                                        <div
                                            className="flex gap-2 sm:gap-3 mb-2"
                                            onMouseLeave={() => handleStarLeave(player.playerId)}
                                        >
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => handleStarClick(player.playerId, star)}
                                                    onMouseEnter={() => handleStarHover(player.playerId, star)}
                                                    disabled={isSubmitting}
                                                    className={`text-2xl sm:text-3xl p-1 transition-all duration-150 hover:scale-110 active:scale-95 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${star <= displayRating ? 'opacity-100' : 'opacity-30'
                                                        }`}
                                                    aria-label={`Rate ${star} stars`}
                                                >
                                                    ⭐
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Divider (not for last item) */}
                                    {index < pendingRatings.length - 1 && (
                                        <div className="mt-3 border-b border-zinc-700/30" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Help button */}
                    <div className="flex items-center justify-center mb-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                                    <HelpCircle className="w-4 h-4" />
                                    <span>Nuksa ban vote?</span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-3 bg-zinc-800 border-zinc-700 text-xs">
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-semibold text-red-400 mb-1">⭐ Sngewbang bha rei:</p>
                                        <p className="text-zinc-300">Mar ia iap, ialade exit noh, ym ju kren, um da join bha ki match baroh, kiwei²</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-400 mb-1">⭐⭐⭐⭐⭐ Sngewtynnad bha:</p>
                                        <p className="text-zinc-300">I iakren sngewtynnad bha, sngewthuh jingmut bha da noob ruh, da ym bha kren ruh i pyntip, kiwei²</p>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-xs text-red-400 text-center">{error}</p>
                        </div>
                    )}

                    {/* Save button */}
                    <button
                        onClick={handleSaveAll}
                        disabled={!allRated || isSubmitting}
                        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${allRated && !isSubmitting
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/20'
                            : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                            }`}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </span>
                        ) : (
                            `Save All Ratings (${Object.values(ratings).filter(r => r !== null).length}/${pendingRatings.length})`
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog >
    );
}
