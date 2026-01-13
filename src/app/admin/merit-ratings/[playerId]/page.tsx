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

// Star rating display - uses opacity for unfilled stars
const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={cn(
                        "text-lg transition-opacity",
                        star <= rating ? "opacity-100" : "opacity-20"
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
        <div className={cn("px-4 py-2 rounded-full border text-xl font-bold", getColor())}>
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
        <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 overflow-hidden">
            <button
                onClick={() => hasMultiple && setIsExpanded(!isExpanded)}
                className={cn(
                    "w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors",
                    hasMultiple && "hover:bg-zinc-800 cursor-pointer"
                )}
            >
                <div className="flex items-center gap-4">
                    <StarRating rating={Math.round(group.avgRating)} />
                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <p className="font-medium">{group.rater.displayName}</p>
                            {hasMultiple && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
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
                <div className="border-t border-zinc-700 bg-zinc-900/50 p-3 space-y-2">
                    {group.ratings.map((rating) => (
                        <div key={rating.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
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
            <div className="space-y-6 max-w-3xl mx-auto px-2 sm:px-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                </div>
            </div>
        );
    }

    if (!player) {
        return (
            <div className="space-y-6 max-w-3xl mx-auto px-2 sm:px-4 text-center py-12">
                <Star className="h-12 w-12 mx-auto opacity-50" />
                <p className="text-muted-foreground">Player not found</p>
                <Link href="/admin/merit-ratings" className="text-primary hover:underline">← Back to Merit Ratings</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto px-2 sm:px-4 overflow-x-hidden">
            <Link href="/admin/merit-ratings" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Merit Ratings
            </Link>

            <div className="rounded-2xl p-6 bg-zinc-900 border border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <MeritBadge score={player.meritScore} isRestricted={player.isSoloRestricted} />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{player.displayName}</h1>
                            {player.isSoloRestricted && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Solo Restricted
                                </span>
                            )}
                        </div>
                        <p className="text-muted-foreground">@{player.userName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-semibold">{player.totalRatings} ratings</p>
                        <p className="text-muted-foreground">Avg: {player.averageRating} ⭐</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span>📊</span> All Ratings Received
                </h2>
                {player.ratings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground rounded-xl bg-zinc-800/50 border border-zinc-700">
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
