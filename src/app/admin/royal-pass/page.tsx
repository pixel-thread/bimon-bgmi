"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Crown,
    Users,
    Coins,
    Gift,
    Sparkles,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Badge } from "@/src/components/ui/badge";
import { useAuth } from "@clerk/nextjs";
import { useAuth as useAuthContext } from "@/src/hooks/context/auth/useAuth";
import { format } from "date-fns";

type RPStats = {
    summary: {
        totalPurchases: number;
        freePurchases: number;
        paidPurchases: number;
        totalUCCollected: number;
        freeSlotsRemaining: number;
        rpPrice: number;
        freeLimit: number;
    };
    subscribers: Array<{
        id: string;
        playerName: string;
        playerId: string;
        amount: number;
        displayValue: number;
        pricePaid: number;
        wasFree: boolean;
        purchasedAt: string;
    }>;
};

type ApiResponse<T> = {
    data: T;
};

export default function RoyalPassAdminPage() {
    const { getToken, isSignedIn } = useAuth();
    const { user } = useAuthContext();

    const fetchWithAuth = async <T,>(url: string): Promise<ApiResponse<T> | null> => {
        const token = await getToken({ template: "jwt" });
        if (!token) return null;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch");
        return response.json();
    };

    const { data: response, isLoading } = useQuery({
        queryKey: ["royal-pass-stats"],
        queryFn: () => fetchWithAuth<RPStats>("/admin/royal-pass"),
        enabled: isSignedIn && user?.role === "SUPER_ADMIN",
    });

    const stats = response?.data;

    if (user?.role !== "SUPER_ADMIN") {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Crown className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Super Admin access required</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Royal Pass Tracker</h1>
                    <p className="text-sm text-muted-foreground">
                        {stats?.summary?.freeSlotsRemaining !== undefined
                            ? `${stats.summary.freeSlotsRemaining} free slots remaining`
                            : "Purchase analytics"}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            {isLoading ? (
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Purchases</p>
                            <p className="text-xl sm:text-2xl font-bold">{stats?.summary?.totalPurchases || 0}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">UC Collected</p>
                            <p className="text-xl sm:text-2xl font-bold text-green-500">{stats?.summary?.totalUCCollected || 0} UC</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">Free Claims</p>
                            <p className="text-xl sm:text-2xl font-bold">{stats?.summary?.freePurchases || 0}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">Paid Purchases</p>
                            <p className="text-xl sm:text-2xl font-bold">{stats?.summary?.paidPurchases || 0}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Subscribers List */}
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6">
                <h2 className="text-lg font-bold mb-4">All Purchases</h2>
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : stats?.subscribers && stats.subscribers.length > 0 ? (
                    <>
                        {/* Mobile Card Layout */}
                        <div className="space-y-3 md:hidden">
                            {stats.subscribers.map((sub) => (
                                <div key={sub.id} className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white">{sub.playerName}</span>
                                        <Badge
                                            variant="outline"
                                            className={sub.wasFree
                                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                            }
                                        >
                                            {sub.wasFree ? "🎁 Free" : `${sub.amount} UC`}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-zinc-900/50 rounded-lg p-2">
                                            <p className="text-muted-foreground text-xs">Purchased</p>
                                            <p className="font-medium">{format(new Date(sub.purchasedAt), "MMM d, yy")}</p>
                                        </div>
                                        <div className="bg-zinc-900/50 rounded-lg p-2">
                                            <p className="text-muted-foreground text-xs">Display Value</p>
                                            <p className="font-medium">{sub.displayValue} UC</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table Layout */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800">
                                        <TableHead>Player</TableHead>
                                        <TableHead>Purchased</TableHead>
                                        <TableHead className="text-center">Type</TableHead>
                                        <TableHead className="text-right">UC Paid</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.subscribers.map((sub) => (
                                        <TableRow key={sub.id} className="border-zinc-800">
                                            <TableCell className="font-semibold">{sub.playerName}</TableCell>
                                            <TableCell>{format(new Date(sub.purchasedAt), "MMM d, yyyy")}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={sub.wasFree
                                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                                    }
                                                >
                                                    {sub.wasFree ? "🎁 Free" : "Paid"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-bold ${sub.wasFree ? "text-emerald-500" : "text-amber-400"}`}>
                                                {sub.amount} UC
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <Crown className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No Royal Pass purchases yet</p>
                        <p className="text-xs mt-1">Players can claim from the Royal Pass page</p>
                    </div>
                )}
            </div>
        </div>
    );
}
