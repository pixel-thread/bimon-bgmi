"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Phone, ChevronLeft, ChevronRight, X, ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";
import { useJobListings, useReactToListing, JobListing, EXPERIENCE_OPTIONS } from "@/src/hooks/jobListing/useJobListings";
import { PlayerAvatar } from "@/src/components/ui/player-avatar";
import { getDisplayName } from "@/src/utils/bgmiDisplay";
import { Skeleton } from "@/src/components/ui/skeleton";

const AUTO_SCROLL_INTERVAL = 3000; // 3 seconds

export function JobBoardBanner() {
    const { data: listings, isLoading } = useJobListings();
    const { mutate: reactToListing, isPending: isReacting } = useReactToListing();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isClosed, setIsClosed] = useState(false);

    // Get active listings only
    const baseListings = listings?.filter((l) => l.isActive) || [];

    const SEEN_STORAGE_KEY = "seenJobListings";

    // Get seen listings from localStorage
    const getSeenListings = (): Set<string> => {
        try {
            const stored = localStorage.getItem(SEEN_STORAGE_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    };

    // Save seen listings to localStorage
    const saveSeenListings = (seen: Set<string>) => {
        localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...seen]));
    };

    // Prioritize unseen listings, then seen ones (all shuffled)
    const [orderedListings, setOrderedListings] = useState<JobListing[]>([]);
    const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (baseListings.length === 0) return;

        const seen = getSeenListings();
        setSeenIds(seen);

        // Separate unseen and seen listings
        const unseen = baseListings.filter((l) => !seen.has(l.id));
        const seenListings = baseListings.filter((l) => seen.has(l.id));

        // If all are seen, reset and reshuffle
        if (unseen.length === 0) {
            localStorage.removeItem(SEEN_STORAGE_KEY);
            setSeenIds(new Set());
            // Shuffle all
            const shuffled = [...baseListings];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            setOrderedListings(shuffled);
        } else {
            // Shuffle unseen first, then seen
            const shuffleArray = (arr: JobListing[]) => {
                const copy = [...arr];
                for (let i = copy.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [copy[i], copy[j]] = [copy[j], copy[i]];
                }
                return copy;
            };
            setOrderedListings([...shuffleArray(unseen), ...shuffleArray(seenListings)]);
        }
    }, [baseListings.length]);

    const activeListings = orderedListings.length > 0 ? orderedListings : baseListings;

    // Mark current listing as seen (skip demo listings)
    useEffect(() => {
        if (activeListings.length > 0 && currentIndex < activeListings.length) {
            const currentId = activeListings[currentIndex].id;
            if (!currentId.startsWith("demo-") && !seenIds.has(currentId)) {
                const newSeen = new Set(seenIds);
                newSeen.add(currentId);
                setSeenIds(newSeen);
                saveSeenListings(newSeen);
            }
        }
    }, [currentIndex, activeListings, seenIds]);

    // Auto-scroll effect - cycles through ALL listings before repeating
    useEffect(() => {
        if (activeListings.length <= 1 || isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activeListings.length);
        }, AUTO_SCROLL_INTERVAL);

        return () => clearInterval(interval);
    }, [activeListings.length, isPaused]);

    // Reset index when listings change
    useEffect(() => {
        if (currentIndex >= activeListings.length) {
            setCurrentIndex(0);
        }
    }, [activeListings.length, currentIndex]);

    const goToPrev = useCallback(() => {
        setCurrentIndex((prev) =>
            prev === 0 ? activeListings.length - 1 : prev - 1
        );
    }, [activeListings.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % activeListings.length);
    }, [activeListings.length]);

    // Handle like/dislike reaction
    const handleReact = (reactionType: "like" | "dislike") => {
        if (activeListings.length > 0 && currentIndex < activeListings.length) {
            const listingId = activeListings[currentIndex].id;
            reactToListing({ listingId, reactionType });
        }
    };

    // Hidden if closed
    if (isClosed) {
        return null;
    }

    // No listings exist
    if (baseListings.length === 0 && !isLoading) {
        return null;
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="mb-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50 p-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
            </div>
        );
    }

    const currentListing = activeListings[currentIndex];
    const displayCategory1 =
        currentListing.category === "Other"
            ? currentListing.customCategory || "Other"
            : currentListing.category;
    const displayCategory2 = currentListing.category2 || null;

    return (
        <div
            className="mb-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50 overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
        >
            {/* Header */}
            <div className="px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border-b border-amber-200 dark:border-amber-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <PlayerAvatar
                        characterImageUrl={currentListing.player?.characterImage?.publicUrl}
                        displayName={currentListing.player?.user.displayName || ""}
                        userName={currentListing.player?.user.userName || "User"}
                        size="sm"
                    />
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-amber-800 dark:text-amber-200 truncate flex items-center gap-1">
                            {getDisplayName(
                                currentListing.player?.user.displayName || null,
                                currentListing.player?.user.userName || "User"
                            )}
                            {currentListing.likeCount >= 10 && (
                                <span title="Verified - 10+ likes">
                                    <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                                </span>
                            )}
                        </span>
                        {currentListing.experience && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                {EXPERIENCE_OPTIONS.find(o => o.value === currentListing.experience)?.label || currentListing.experience} exp
                            </span>
                        )}
                    </div>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 shrink-0">
                        {displayCategory1}{displayCategory2 && ` • ${displayCategory2}`}
                    </span>
                </div>
                {/* Close Button */}
                <button
                    onClick={() => setIsClosed(true)}
                    className="p-1 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
                    aria-label="Close banner"
                >
                    <X className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                </button>
            </div>

            {/* Content */}
            <div className="p-5 relative">
                {/* Navigation Buttons */}
                {activeListings.length > 1 && (
                    <>
                        <button
                            onClick={goToPrev}
                            className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-sm hover:bg-white dark:hover:bg-gray-700 transition-colors"
                            aria-label="Previous listing"
                        >
                            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-sm hover:bg-white dark:hover:bg-gray-700 transition-colors"
                            aria-label="Next listing"
                        >
                            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </button>
                    </>
                )}

                {/* Listing Card */}
                <div className="px-6 space-y-3">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {currentListing.title}
                        </p>

                        {currentListing.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {currentListing.description}
                            </p>
                        )}
                    </div>

                    {/* Action Row - Like/Dislike & Phone */}
                    <div className="flex items-center justify-between gap-3">
                        {/* Like/Dislike Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleReact("like")}
                                disabled={isReacting}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${currentListing.userReaction === 'like' ? 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900'}`}
                            >
                                <ThumbsUp className="h-3.5 w-3.5" />
                                {currentListing.likeCount > 0 && currentListing.likeCount}
                            </button>
                            <button
                                onClick={() => handleReact("dislike")}
                                disabled={isReacting}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${currentListing.userReaction === 'dislike' ? 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900'}`}
                            >
                                <ThumbsDown className="h-3.5 w-3.5" />
                                {currentListing.dislikeCount > 0 && currentListing.dislikeCount}
                            </button>
                        </div>

                        {/* Phone Number */}
                        <a
                            href={`tel:${currentListing.phoneNumber}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                        >
                            <Phone className="h-3 w-3" />
                            {currentListing.phoneNumber}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
