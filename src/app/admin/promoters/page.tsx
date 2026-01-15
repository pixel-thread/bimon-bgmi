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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                        <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <Users className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Promoters</p>
                            <p className="text-2xl font-bold">{stats?.summary?.totalPromoters || 0}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Referrals</p>
                            <p className="text-2xl font-bold">
                                {stats?.summary?.totalReferrals || 0}
                                <span className="text-sm text-muted-foreground ml-1">
                                    ({stats?.summary?.pendingReferrals || 0} pending)
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                        <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <Coins className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Paid Out</p>
                            <p className="text-2xl font-bold text-green-500">{stats?.summary?.totalEarnings || 0} UC</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                        <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Conversion Rate</p>
                            <p className="text-2xl font-bold">{stats?.summary?.conversionRate || 0}%</p>
                            <p className="text-xs text-muted-foreground">
                                {stats?.summary?.qualifiedReferrals || 0} qualified
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Promoters Table */}
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6">
                <h2 className="text-lg font-bold mb-4">All Promoters</h2>
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : stats?.promoters && stats.promoters.length > 0 ? (
                    <div className="overflow-x-auto">
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
