"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Phone, ChevronLeft, ChevronRight, X, ThumbsUp, ThumbsDown, CheckCircle, MapPin, Clock, ExternalLink } from "lucide-react";
import { useJobListings, useReactToListing, JobListing, EXPERIENCE_OPTIONS, TIME_OPTIONS } from "@/src/hooks/jobListing/useJobListings";
import { PlayerAvatar } from "@/src/components/ui/player-avatar";
import { getDisplayName } from "@/src/utils/displayName";
import { Skeleton } from "@/src/components/ui/skeleton";
import Link from "next/link";

const AUTO_SCROLL_INTERVAL = 3000; // 3 seconds
const BANNER_HIDDEN_KEY = "jobBannerHiddenUntil";
const HIDE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Type for optimistic reaction state per listing
type OptimisticReaction = {
    likeCount: number;
    dislikeCount: number;
    userReaction: "like" | "dislike" | null;
};

export function JobBoardBanner() {
    const { data: listings, isLoading } = useJobListings();
    const { mutate: reactToListing } = useReactToListing();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isClosed, setIsClosed] = useState(() => {
        if (typeof window === "undefined") return false;
        try {
            const hiddenUntil = localStorage.getItem(BANNER_HIDDEN_KEY);
            if (hiddenUntil && Date.now() < parseInt(hiddenUntil)) {
                return true;
            }
            localStorage.removeItem(BANNER_HIDDEN_KEY);
            return false;
        } catch {
            return false;
        }
    });

    // Local optimistic state for reactions (keyed by listing ID)
    const [optimisticReactions, setOptimisticReactions] = useState<Record<string, OptimisticReaction>>({});

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

    // Get current reaction state (optimistic or from server)
    const getReactionState = (listing: JobListing): OptimisticReaction => {
        if (optimisticReactions[listing.id]) {
            return optimisticReactions[listing.id];
        }
        return {
            likeCount: listing.likeCount,
            dislikeCount: listing.dislikeCount,
            userReaction: listing.userReaction || null,
        };
    };

    // Handle like/dislike reaction with optimistic update
    const handleReact = (reactionType: "like" | "dislike") => {
        if (activeListings.length === 0 || currentIndex >= activeListings.length) return;

        const listing = activeListings[currentIndex];
        const listingId = listing.id;
        const current = getReactionState(listing);

        // Calculate optimistic new state
        let newLikeCount = current.likeCount;
        let newDislikeCount = current.dislikeCount;
        let newUserReaction: "like" | "dislike" | null = reactionType;

        // If clicking the same reaction, toggle it off
        if (current.userReaction === reactionType) {
            newUserReaction = null;
            if (reactionType === "like") newLikeCount--;
            else newDislikeCount--;
        } else {
            // Remove previous reaction if exists
            if (current.userReaction === "like") newLikeCount--;
            else if (current.userReaction === "dislike") newDislikeCount--;

            // Add new reaction
            if (reactionType === "like") newLikeCount++;
            else newDislikeCount++;
        }

        // Apply optimistic update immediately
        setOptimisticReactions(prev => ({
            ...prev,
            [listingId]: {
                likeCount: Math.max(0, newLikeCount),
                dislikeCount: Math.max(0, newDislikeCount),
                userReaction: newUserReaction,
            },
        }));

        // Call API (will sync on success, revert handled by clearing optimistic state on error)
        reactToListing({ listingId, reactionType });
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
    const reactionState = getReactionState(currentListing);
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
            <div className="px-3 py-2.5 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border-b border-amber-200 dark:border-amber-800/50">
                <div className="flex items-start justify-between gap-2">
                    {/* User Info Row */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <PlayerAvatar
                            characterImageUrl={currentListing.player?.customProfileImageUrl}
                            imageUrl={currentListing.player?.imageUrl}
                            displayName={currentListing.player?.user.displayName || ""}
                            userName={currentListing.player?.user.userName || "User"}
                            size="sm"
                            showUserIcon
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-semibold text-amber-800 dark:text-amber-200 truncate flex items-center gap-1">
                                    {getDisplayName(
                                        currentListing.player?.user.displayName || null,
                                        currentListing.player?.user.userName || "User"
                                    )}
                                    {reactionState.likeCount >= 10 && (
                                        <span title="Verified - 10+ likes">
                                            <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                                        </span>
                                    )}
                                </span>
                                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
                                    {displayCategory1}{displayCategory2 && ` • ${displayCategory2}`}
                                </span>
                            </div>
                            {/* Experience & Location Row */}
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] text-amber-600 dark:text-amber-400">
                                {currentListing.experience && (
                                    <span>
                                        {EXPERIENCE_OPTIONS.find(o => o.value === currentListing.experience)?.label || currentListing.experience} exp
                                    </span>
                                )}
                                {currentListing.availability && currentListing.availability.includes("-") && (
                                    <span className="flex items-center gap-0.5">
                                        <Clock className="h-2.5 w-2.5" />
                                        {currentListing.availability.split("-").map(t => TIME_OPTIONS.find(o => o.value === t)?.label || t).join(" - ")}
                                    </span>
                                )}
                                {currentListing.location && (
                                    <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                                        <MapPin className="h-2.5 w-2.5" />
                                        {currentListing.location}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Close Button */}
                    <button
                        onClick={() => {
                            localStorage.setItem(BANNER_HIDDEN_KEY, String(Date.now() + HIDE_DURATION_MS));
                            setIsClosed(true);
                        }}
                        className="p-1 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors shrink-0"
                        aria-label="Close banner"
                    >
                        <X className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                    </button>
                </div>
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

                    {/* Action Row - All buttons on one line */}
                    <div className="flex items-center gap-2">
                        {/* Like Button */}
                        <button
                            onClick={() => handleReact("like")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${reactionState.userReaction === 'like' ? 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900'}`}
                        >
                            <ThumbsUp className="h-3.5 w-3.5" fill={reactionState.userReaction === 'like' ? 'currentColor' : 'none'} />
                            {reactionState.likeCount}
                        </button>
                        {/* Dislike Button - no counter shown */}
                        <button
                            onClick={() => handleReact("dislike")}
                            className={`flex items-center justify-center p-1.5 rounded-full text-xs font-medium transition-colors ${reactionState.userReaction === 'dislike' ? 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900'}`}
                        >
                            <ThumbsDown className="h-3.5 w-3.5" fill={reactionState.userReaction === 'dislike' ? 'currentColor' : 'none'} />
                        </button>

                        {/* Call & More buttons */}
                        <a
                            href={`tel:${currentListing.phoneNumber}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors ml-auto"
                        >
                            <Phone className="h-3 w-3" />
                            Call
                        </a>
                        <Link
                            href={`/jobs/${currentListing.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                        >
                            <ExternalLink className="h-3 w-3" />
                            More
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
