"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { PlayerAvatar } from "@/src/components/ui/player-avatar";
import { getDisplayName } from "@/src/utils/displayName";
import {
    ArrowLeft, Phone, MapPin, Clock, ThumbsUp, ThumbsDown,
    CheckCircle, Calendar, ExternalLink, Image as ImageIcon
} from "lucide-react";
import { JobListing, EXPERIENCE_OPTIONS, TIME_OPTIONS, useReactToListing } from "@/src/hooks/jobListing/useJobListings";

// Day order for display
const DAYS = [
    { key: "mon", label: "Monday" },
    { key: "tue", label: "Tuesday" },
    { key: "wed", label: "Wednesday" },
    { key: "thu", label: "Thursday" },
    { key: "fri", label: "Friday" },
    { key: "sat", label: "Saturday" },
    { key: "sun", label: "Sunday" },
];

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { mutate: reactToListing } = useReactToListing();

    const { data, isLoading, error } = useQuery({
        queryKey: ["job-listing", id],
        queryFn: () => http.get<JobListing>(`/jobs/${id}`),
        enabled: !!id,
    });

    const listing = data?.data;

    // Format time range for display
    const formatTimeRange = (availability: string | null) => {
        if (!availability || !availability.includes("-")) return null;
        const [start, end] = availability.split("-");
        const startLabel = TIME_OPTIONS.find(o => o.value === start)?.label || start;
        const endLabel = TIME_OPTIONS.find(o => o.value === end)?.label || end;
        return `${startLabel} - ${endLabel}`;
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <Skeleton className="h-8 w-24 mb-6" />
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <div className="text-center py-12 text-muted-foreground">
                    Job listing not found
                </div>
            </div>
        );
    }

    const displayCategory = listing.category === "Other"
        ? listing.customCategory || "Other"
        : listing.category;
    const workingHours = listing.workingHours as Record<string, string> | null;
    const imageUrls = listing.imageUrls || [];

    return (
        <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button>

            {/* Header Card */}
            <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 dark:from-amber-600/20 dark:via-orange-600/20 dark:to-rose-600/20" />
                <div className="absolute inset-0 backdrop-blur-3xl" />

                <div className="relative p-5 space-y-4">
                    {/* Profile */}
                    <div className="flex items-center gap-4">
                        <PlayerAvatar
                            profileImageUrl={(listing.player as any)?.customProfileImageUrl}
                            imageUrl={listing.player?.imageUrl}
                            displayName={listing.player?.user.displayName || ""}
                            userName={listing.player?.user.userName || "User"}
                            size="lg"
                            showUserIcon
                        />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold truncate">
                                    {getDisplayName(
                                        listing.player?.user.displayName || null,
                                        listing.player?.user.userName || "User"
                                    )}
                                </h1>
                                {listing.likeCount >= 10 && (
                                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">@{listing.player?.user.userName}</p>
                        </div>
                    </div>

                    {/* Title & Categories */}
                    <div>
                        <h2 className="text-lg font-semibold">{listing.title}</h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-3 py-1 text-sm font-medium rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
                                {displayCategory}
                            </span>
                            {listing.category2 && (
                                <span className="px-3 py-1 text-sm font-medium rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                                    {listing.category2}
                                </span>
                            )}
                            {listing.experience && (
                                <span className="px-3 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                    {EXPERIENCE_OPTIONS.find(o => o.value === listing.experience)?.label} exp
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {listing.description && (
                        <p className="text-sm text-muted-foreground">{listing.description}</p>
                    )}

                    {/* Location & Availability */}
                    <div className="flex flex-wrap gap-3">
                        {listing.location && (
                            <div className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400">
                                <MapPin className="h-4 w-4" />
                                {listing.location}
                            </div>
                        )}
                        {listing.availability && formatTimeRange(listing.availability) && (
                            <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                                <Clock className="h-4 w-4" />
                                {formatTimeRange(listing.availability)}
                            </div>
                        )}
                    </div>

                    {/* Like/Dislike & Contact */}
                    <div className="flex items-center justify-between pt-2 border-t border-amber-200/50 dark:border-amber-800/30">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => reactToListing({ listingId: listing.id, reactionType: "like" })}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${listing.userReaction === 'like'
                                    ? 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900'
                                    }`}
                            >
                                <ThumbsUp className="h-4 w-4" fill={listing.userReaction === 'like' ? 'currentColor' : 'none'} />
                                {listing.likeCount}
                            </button>
                            <button
                                onClick={() => reactToListing({ listingId: listing.id, reactionType: "dislike" })}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${listing.userReaction === 'dislike'
                                    ? 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900'
                                    }`}
                            >
                                <ThumbsDown className="h-4 w-4" fill={listing.userReaction === 'dislike' ? 'currentColor' : 'none'} />
                                {listing.dislikeCount}
                            </button>
                        </div>
                        <a
                            href={`tel:${listing.phoneNumber}`}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                        >
                            <Phone className="h-4 w-4" />
                            Call Now
                        </a>
                    </div>
                </div>
            </div>

            {/* Working Hours */}
            {workingHours && Object.keys(workingHours).length > 0 && (
                <div className="relative rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 dark:from-blue-600/15 dark:via-cyan-600/15 dark:to-teal-600/15" />
                    <div className="absolute inset-0 backdrop-blur-3xl" />

                    <div className="relative p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            <h3 className="font-semibold">Working Hours</h3>
                        </div>
                        <div className="space-y-2">
                            {DAYS.map(({ key, label }) => {
                                const hours = workingHours[key];
                                if (!hours) return null;
                                const isClosed = hours.toUpperCase() === "CLOSED";

                                return (
                                    <div key={key} className="flex items-center justify-between py-2 border-b border-slate-200/30 dark:border-slate-700/30 last:border-0">
                                        <span className="text-sm font-medium">{label}</span>
                                        <span className={`text-sm ${isClosed ? "text-red-500" : "text-muted-foreground"}`}>
                                            {isClosed ? "Closed" : hours}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Images */}
            {imageUrls.length > 0 && (
                <div className="relative rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 dark:from-purple-600/15 dark:via-pink-600/15 dark:to-rose-600/15" />
                    <div className="absolute inset-0 backdrop-blur-3xl" />

                    <div className="relative p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <ImageIcon className="h-5 w-5 text-purple-500" />
                            <h3 className="font-semibold">Gallery</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {imageUrls.map((url, index) => (
                                <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 group"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={url}
                                        alt={`Work sample ${index + 1}`}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23334155" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="12">Image</text></svg>';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
