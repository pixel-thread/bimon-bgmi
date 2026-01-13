"use client";

import { useQuery } from "@tanstack/react-query";
import { Star, ArrowLeft, AlertTriangle, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAuth } from "@clerk/nextjs";
import { useAuth as useAuthContext } from "@/src/hooks/context/auth/useAuth";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/src/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

type Rating = {
    id: string;
    rater: { id: string; displayName: string; userName: string };
    rating: number;
    tournament: { id: string; name: string };
    createdAt: string;
};

type PlayerDetail = {
    id: string;
    displayName: string;
    userName: string;
    meritScore: number;
    isSoloRestricted: boolean;
    totalRatings: number;
    averageRating: number;
    ratings: Rating[];
};

type PlayerDetailResponse = {
    data: {
        player: PlayerDetail;
    };
};

// Star rating display - uses grayscale for unfilled stars (visible on both themes)
const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={cn(
                        "text-lg transition-all",
                        star <= rating ? "" : "grayscale opacity-40"
                    )}
                >
                    ⭐
                </span>
            ))}
        </div>
    );
};

// Merit score badge
const MeritBadge = ({ score, isRestricted }: { score: number; isRestricted: boolean }) => {
    const getColor = () => {
        if (isRestricted) return "bg-red-500/20 text-red-400 border-red-500/30";
        if (score < 50) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
        if (score < 70) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
        return "bg-green-500/20 text-green-400 border-green-500/30";
    };

    return (
        <div className={cn("px-4 py-2 rounded-full border text-xl font-bold w-fit", getColor())}>
            {score}%
        </div>
    );
};

// Group ratings by rater
type RaterGroup = {
    rater: { id: string; displayName: string; userName: string };
    ratings: Rating[];
    avgRating: number;
};

const groupRatingsByRater = (ratings: Rating[]): RaterGroup[] => {
    const groups: Map<string, RaterGroup> = new Map();

    for (const rating of ratings) {
        const existing = groups.get(rating.rater.id);
        if (existing) {
            existing.ratings.push(rating);
            existing.avgRating = existing.ratings.reduce((sum, r) => sum + r.rating, 0) / existing.ratings.length;
        } else {
            groups.set(rating.rater.id, {
                rater: rating.rater,
                ratings: [rating],
                avgRating: rating.rating,
            });
        }
    }

    return Array.from(groups.values());
};

// Expandable rater row component
const RaterRow = ({ group }: { group: RaterGroup }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasMultiple = group.ratings.length > 1;

    return (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
            <button
                onClick={() => hasMultiple && setIsExpanded(!isExpanded)}
                className={cn(
                    "w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors",
                    hasMultiple && "hover:bg-accent cursor-pointer"
                )}
            >
                <div className="flex items-center gap-4">
                    <StarRating rating={Math.round(group.avgRating)} />
                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <p className="font-medium">{group.rater.displayName}</p>
                            {hasMultiple && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                    {group.ratings.length}x
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">@{group.rater.userName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {!hasMultiple && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <span className="text-xs">🏆</span>
                                <span className="truncate max-w-[150px]">{group.ratings[0].tournament.name}</span>
                            </div>
                            <div className="flex items-center gap-1 whitespace-nowrap">
                                <Calendar className="h-3 w-3" />
                                {formatDistanceToNow(new Date(group.ratings[0].createdAt), { addSuffix: true })}
                            </div>
                        </div>
                    )}
                    {hasMultiple && (
                        isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                </div>
            </button>

            {isExpanded && hasMultiple && (
                <div className="border-t border-border bg-muted/50 p-3 space-y-2">
                    {group.ratings.map((rating) => (
                        <div key={rating.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                            <div className="flex items-center gap-3">
                                <StarRating rating={rating.rating} />
                                <div className="flex items-center gap-1 text-sm">
                                    <span className="text-xs">🏆</span>
                                    <span className="text-muted-foreground">{rating.tournament.name}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                <Calendar className="h-3 w-3" />
                                {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Ratings list grouped by rater
const RatingsList = ({ ratings }: { ratings: Rating[] }) => {
    const groups = groupRatingsByRater(ratings);
    return (
        <div className="space-y-2">
            {groups.map((group) => <RaterRow key={group.rater.id} group={group} />)}
        </div>
    );
};

export default function PlayerMeritDetailPage() {
    const params = useParams();
    const playerId = params.playerId as string;
    const { getToken, isSignedIn } = useAuth();
    const { user } = useAuthContext();

    const fetchWithAuth = async <T,>(url: string): Promise<T | null> => {
        const token = await getToken({ template: "jwt" });
        if (!token) return null;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch");
        return response.json();
    };

    const { data, isLoading } = useQuery({
        queryKey: ["merit-ratings-detail", playerId],
        queryFn: () => fetchWithAuth<PlayerDetailResponse>(`/admin/merit-ratings/${playerId}`),
        enabled: isSignedIn && !!user,
    });

    const player = data?.data?.player;

    if (isLoading) {
        return (
            <div className="space-y-4 max-w-3xl mx-auto px-2 sm:px-4">
                <Skeleton className="h-5 w-36" />
                {/* Header card skeleton */}
                <div className="rounded-2xl p-4 bg-card border border-border">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-14 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <div className="text-right space-y-2">
                            <Skeleton className="h-4 w-16 ml-auto" />
                            <Skeleton className="h-3 w-12 ml-auto" />
                        </div>
                    </div>
                </div>
                {/* Section title */}
                <Skeleton className="h-5 w-40" />
                {/* Ratings list skeleton */}
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-xl p-4 bg-card border border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!player && !isLoading && data !== undefined) {
        return (
            <div className="space-y-6 max-w-3xl mx-auto px-2 sm:px-4 text-center py-12">
                <Star className="h-12 w-12 mx-auto opacity-50" />
                <p className="text-muted-foreground">Player not found</p>
                <Link href="/admin/merit-ratings" className="text-primary hover:underline">← Back to Merit Ratings</Link>
            </div>
        );
    }

    if (!player) {
        // Still loading or waiting for auth
        return (
            <div className="space-y-4 max-w-3xl mx-auto px-2 sm:px-4">
                <Skeleton className="h-5 w-36" />
                <div className="rounded-2xl p-4 bg-card border border-border">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-14 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <div className="text-right space-y-2">
                            <Skeleton className="h-4 w-16 ml-auto" />
                            <Skeleton className="h-3 w-12 ml-auto" />
                        </div>
                    </div>
                </div>
                <Skeleton className="h-5 w-40" />
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-xl p-4 bg-card border border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto px-2 sm:px-4 overflow-x-hidden">
            <Link href="/admin/merit-ratings" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Merit Ratings
            </Link>

            <div className="rounded-2xl p-4 bg-card border border-border">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <MeritBadge score={player.meritScore} isRestricted={player.isSoloRestricted} />
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold">{player.displayName}</h1>
                                {player.isSoloRestricted && (
                                    <AlertTriangle className="h-4 w-4 text-red-400" />
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">@{player.userName}</p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="font-semibold">{player.totalRatings} ratings</p>
                        <p className="text-sm text-muted-foreground">Avg: {player.averageRating} ⭐</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span>📊</span> All Ratings Received
                </h2>
                {player.ratings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground rounded-xl bg-card border border-border">
                        <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No ratings received yet</p>
                    </div>
                ) : (
                    <RatingsList ratings={player.ratings} />
                )}
            </div>
        </div>
    );
}
