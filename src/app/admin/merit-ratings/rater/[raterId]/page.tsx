"use client";

import { useQuery } from "@tanstack/react-query";
import { Star, ArrowLeft, Calendar } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAuth } from "@clerk/nextjs";
import { useAuth as useAuthContext } from "@/src/hooks/context/auth/useAuth";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/src/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";

type RatingGiven = {
    id: string;
    ratedPlayer: { id: string; displayName: string; userName: string };
    rating: number;
    tournament: { id: string; name: string };
    createdAt: string;
};

type RaterDetail = {
    id: string;
    displayName: string;
    userName: string;
    totalRatingsGiven: number;
    averageRatingGiven: number;
    ratingsGiven: RatingGiven[];
};

type RaterDetailResponse = {
    data: {
        rater: RaterDetail;
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

export default function RaterDetailPage() {
    const params = useParams();
    const raterId = params.raterId as string;

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
        queryKey: ["rater-detail", raterId],
        queryFn: () => fetchWithAuth<RaterDetailResponse>(`/admin/merit-ratings/rater/${raterId}`),
        enabled: isSignedIn && !!user,
    });

    const rater = data?.data?.rater;
    const backUrl = "/admin/merit-ratings";

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-3xl mx-auto px-2 sm:px-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!rater) {
        return (
            <div className="space-y-6 max-w-3xl mx-auto px-2 sm:px-4 text-center py-12">
                <Star className="h-12 w-12 mx-auto opacity-50" />
                <p className="text-muted-foreground">Rater not found</p>
                <Link href={backUrl} className="text-primary hover:underline">
                    ← Back to Merit Ratings
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto px-2 sm:px-4 overflow-x-hidden">
            {/* Back button */}
            <Link
                href={backUrl}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Merit Ratings
            </Link>

            {/* Rater Header */}
            <div className="rounded-2xl p-6 bg-zinc-900 border border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl">
                        👤
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">{rater.displayName}</h1>
                        <p className="text-muted-foreground">@{rater.userName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-semibold">{rater.totalRatingsGiven} ratings given</p>
                        <p className="text-muted-foreground">Avg: {rater.averageRatingGiven} ⭐</p>
                    </div>
                </div>
            </div>

            {/* Ratings Given List */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span>📊</span> Ratings Given to Others
                </h2>

                {rater.ratingsGiven.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground rounded-xl bg-zinc-800/50 border border-zinc-700">
                        <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No ratings given yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {rater.ratingsGiven.map((rating) => (
                            <Link
                                key={rating.id}
                                href={`/admin/merit-ratings/${rating.ratedPlayer.id}`}
                            >
                                <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800 hover:border-zinc-600 transition-all cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <StarRating rating={rating.rating} />
                                        <div>
                                            <p className="font-medium">→ {rating.ratedPlayer.displayName}</p>
                                            <p className="text-xs text-muted-foreground">@{rating.ratedPlayer.userName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs">🏆</span>
                                            <span className="truncate max-w-[150px]">{rating.tournament.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 whitespace-nowrap">
                                            <Calendar className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
