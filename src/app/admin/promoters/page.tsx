"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Gift,
    Users,
    Coins,
    TrendingUp,
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

type PromoterStats = {
    summary: {
        totalPromoters: number;
        totalReferrals: number;
        totalEarnings: number;
        qualifiedReferrals: number;
        pendingReferrals: number;
        averageReferralsPerPromoter: number;
        conversionRate: number;
    };
    promoters: Array<{
        id: string;
        name: string;
        referralCode: string;
        earnings: number;
        totalReferrals: number;
        pendingCount: number;
        paidCount: number;
        referrals: Array<{
            id: string;
            playerName: string;
            status: string;
            tournamentsCompleted: number;
            createdAt: string;
        }>;
    }>;
};

type ApiResponse<T> = {
    data: T;
};

export default function PromotersPage() {
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
        queryKey: ["promoter-stats"],
        queryFn: () => fetchWithAuth<PromoterStats>("/admin/analytics/promoter-stats"),
        enabled: isSignedIn && user?.role === "SUPER_ADMIN",
    });

    // Extract the actual data from the response wrapper
    const stats = response?.data;

    if (user?.role !== "SUPER_ADMIN") {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Super Admin access required</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Gift className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Promoter Management</h1>
                    <p className="text-sm text-muted-foreground">Referral system analytics and management</p>
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
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">Promoters</p>
                            <p className="text-xl sm:text-2xl font-bold">{stats?.summary?.totalPromoters || 0}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">Referrals</p>
                            <p className="text-xl sm:text-2xl font-bold">
                                {stats?.summary?.totalReferrals || 0}
                                <span className="text-xs sm:text-sm text-muted-foreground ml-1">
                                    ({stats?.summary?.pendingReferrals || 0})
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">Paid Out</p>
                            <p className="text-xl sm:text-2xl font-bold text-green-500">{stats?.summary?.totalEarnings || 0} UC</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">Conversion</p>
                            <p className="text-xl sm:text-2xl font-bold">{stats?.summary?.conversionRate || 0}%</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Promoters List */}
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6">
                <h2 className="text-lg font-bold mb-4">All Promoters</h2>
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : stats?.promoters && stats.promoters.length > 0 ? (
                    <>
                        {/* Mobile Card Layout */}
                        <div className="space-y-3 md:hidden">
                            {stats.promoters.map((p) => (
                                <div key={p.id} className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white">{p.name}</span>
                                        <Badge variant="outline" className="font-mono text-amber-500 border-amber-500/30 text-xs">
                                            {p.referralCode}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-zinc-900/50 rounded-lg p-2">
                                            <p className="text-lg font-bold">{p.totalReferrals}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">Referrals</p>
                                        </div>
                                        <div className="bg-zinc-900/50 rounded-lg p-2">
                                            <p className={`text-lg font-bold ${p.pendingCount > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                                                {p.pendingCount}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
                                        </div>
                                        <div className="bg-zinc-900/50 rounded-lg p-2">
                                            <p className={`text-lg font-bold ${p.paidCount > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                                                {p.paidCount}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase">Paid</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-zinc-700/50">
                                        <span className="text-sm text-muted-foreground">Earnings</span>
                                        <span className="font-bold text-green-500">{p.earnings} UC</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table Layout */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800">
                                        <TableHead>Promoter</TableHead>
                                        <TableHead>Referral Code</TableHead>
                                        <TableHead className="text-center">Referrals</TableHead>
                                        <TableHead className="text-center">Pending</TableHead>
                                        <TableHead className="text-center">Paid</TableHead>
                                        <TableHead className="text-right">Earnings</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.promoters.map((p) => (
                                        <TableRow key={p.id} className="border-zinc-800">
                                            <TableCell className="font-semibold">{p.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-amber-500 border-amber-500/30">
                                                    {p.referralCode}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">{p.totalReferrals}</TableCell>
                                            <TableCell className="text-center">
                                                {p.pendingCount > 0 ? (
                                                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                                                        {p.pendingCount}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">0</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {p.paidCount > 0 ? (
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                                                        {p.paidCount}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">0</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-green-500">
                                                {p.earnings} UC
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No promoters yet</p>
                        <p className="text-xs mt-1">Users can become promoters from their profile page</p>
                    </div>
                )}
            </div>
        </div>
    );
}
