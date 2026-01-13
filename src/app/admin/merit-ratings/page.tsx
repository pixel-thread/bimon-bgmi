"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Users, Filter, ChevronRight, AlertTriangle, Shield, ShieldOff } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Switch } from "@/src/components/ui/switch";
import { Button } from "@/src/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useAuth as useAuthContext } from "@/src/hooks/context/auth/useAuth";
import { cn } from "@/src/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

type Player = {
    id: string;
    displayName: string;
    userName: string;
    meritScore: number;
    isSoloRestricted: boolean;
    totalRatings: number;
    averageRating: number;
};

type Tournament = {
    id: string;
    name: string;
};

type MeritRatingsResponse = {
    data: {
        players: Player[];
        tournaments: Tournament[];
        summary: {
            totalPlayers: number;
            restrictedPlayers: number;
            totalRatings: number;
        };
    };
};

// Merit score badge with color coding
const MeritBadge = ({ score, isRestricted }: { score: number; isRestricted: boolean }) => {
    const getColor = () => {
        if (isRestricted) return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
        if (score < 50) return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
        if (score < 70) return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
        return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
    };

    return (
        <div className={cn("px-3 py-1 rounded-full border text-sm font-bold min-w-[50px] text-center", getColor())}>
            {score}%
        </div>
    );
};

// Player card with lift ban button
const PlayerCard = ({
    player,
    onLiftBan,
    isLifting,
    isSuperAdmin
}: {
    player: Player;
    onLiftBan: (playerId: string) => void;
    isLifting: boolean;
    isSuperAdmin: boolean;
}) => {
    return (
        <Link href={`/admin/merit-ratings/${player.id}`} className="block mb-4">
            <div className={cn(
                "rounded-xl border p-3 flex items-center gap-3 transition-all cursor-pointer",
                player.isSoloRestricted
                    ? "bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-900/50 hover:bg-red-200 dark:hover:bg-red-950/50"
                    : "bg-card border-border hover:bg-accent"
            )}>
                <MeritBadge score={player.meritScore} isRestricted={player.isSoloRestricted} />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{player.displayName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>@{player.userName}</span>
                        <span>•</span>
                        <span>{player.totalRatings}⭐</span>
                    </div>
                </div>
                {player.isSoloRestricted && isSuperAdmin ? (
                    <Button
                        size="sm"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onLiftBan(player.id);
                        }}
                        disabled={isLifting}
                        className="!bg-emerald-500 hover:!bg-emerald-400 !text-black font-bold shrink-0 ring-2 ring-emerald-400"
                    >
                        Lift Ban
                    </Button>
                ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
            </div>
        </Link>
    );
};

export default function MeritRatingsPage() {
    const [tournamentId, setTournamentId] = useState<string>("all");
    const [meritBanEnabled, setMeritBanEnabled] = useState<boolean>(true);
    const { getToken, isSignedIn } = useAuth();
    const { user } = useAuthContext();
    const queryClient = useQueryClient();
    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    const fetchWithAuth = async <T,>(url: string, options?: RequestInit): Promise<T | null> => {
        const token = await getToken({ template: "jwt" });
        if (!token) return null;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            ...options,
        });
        if (!response.ok) throw new Error("Failed to fetch");
        return response.json();
    };

    const { data, isLoading } = useQuery({
        queryKey: ["merit-ratings", tournamentId],
        queryFn: () =>
            fetchWithAuth<MeritRatingsResponse>(
                `/admin/merit-ratings${tournamentId !== "all" ? `?tournamentId=${tournamentId}` : ""}`
            ),
        enabled: isSignedIn && !!user,
    });

    // Fetch merit ban setting
    const { data: settingsData } = useQuery({
        queryKey: ["app-settings", "meritBanEnabled"],
        queryFn: () => fetchWithAuth<{ data: { meritBanEnabled: string | null } }>("/admin/settings?key=meritBanEnabled"),
        enabled: isSignedIn && !!user && isSuperAdmin,
    });

    useEffect(() => {
        if (settingsData?.data?.meritBanEnabled !== undefined) {
            setMeritBanEnabled(settingsData.data.meritBanEnabled !== "false");
        }
    }, [settingsData]);

    // Toggle mutation
    const toggleMutation = useMutation({
        mutationFn: async (enabled: boolean) => {
            return fetchWithAuth("/admin/settings", {
                method: "PATCH",
                body: JSON.stringify({ key: "meritBanEnabled", value: String(enabled) }),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["app-settings"] });
            toast.success(meritBanEnabled ? "Merit bans disabled" : "Merit bans enabled");
        },
        onError: () => {
            toast.error("Failed to update setting");
            setMeritBanEnabled(!meritBanEnabled); // Revert on error
        },
    });

    // Lift ban mutation
    const liftBanMutation = useMutation({
        mutationFn: async (playerId: string) => {
            return fetchWithAuth(`/admin/merit-ratings/${playerId}/lift`, {
                method: "POST",
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["merit-ratings"] });
            toast.success("Ban lifted successfully");
        },
        onError: () => {
            toast.error("Failed to lift ban");
        },
    });

    const handleToggle = (checked: boolean) => {
        setMeritBanEnabled(checked);
        toggleMutation.mutate(checked);
    };

    const handleLiftBan = (playerId: string) => {
        liftBanMutation.mutate(playerId);
    };

    const players = data?.data?.players || [];
    const tournaments = data?.data?.tournaments || [];
    const summary = data?.data?.summary;

    return (
        <div className="space-y-6 max-w-3xl mx-auto px-2 sm:px-4 overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
                            <Star className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">Merit Ratings</h1>
                    </div>
                    <p className="text-sm text-muted-foreground ml-13">
                        Players sorted by merit (lowest first)
                    </p>
                </div>
                <Select value={tournamentId} onValueChange={setTournamentId}>
                    <SelectTrigger className="w-[250px] rounded-xl">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by Tournament" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                        <SelectItem value="all">All Tournaments</SelectItem>
                        {tournaments.map((tournament) => (
                            <SelectItem key={tournament.id} value={tournament.id}>
                                {tournament.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Ban System Toggle (Super Admin Only) */}
            {isSuperAdmin && (
                <div className="rounded-2xl p-4 bg-card border border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center",
                                meritBanEnabled ? "bg-red-500/20" : "bg-green-500/20"
                            )}>
                                {meritBanEnabled ? (
                                    <Shield className="h-5 w-5 text-red-500" />
                                ) : (
                                    <ShieldOff className="h-5 w-5 text-green-500" />
                                )}
                            </div>
                            <div>
                                <p className="font-semibold">Merit Ban System</p>
                                <p className="text-xs text-muted-foreground">
                                    {meritBanEnabled
                                        ? "Low merit players forced to play solo"
                                        : "All players can team up freely"}
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={meritBanEnabled}
                            onCheckedChange={handleToggle}
                            disabled={toggleMutation.isPending}
                        />
                    </div>
                </div>
            )}

            {summary && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-card border border-border shrink-0">
                        <Users className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">Rated</span>
                        <span className="font-bold">{summary.totalPlayers}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-card border border-border shrink-0">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-xs text-muted-foreground">Banned</span>
                        <span className="font-bold">{summary.restrictedPlayers}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-card border border-border shrink-0">
                        <span className="text-sm">⭐</span>
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="font-bold">{summary.totalRatings}</span>
                    </div>
                </div>
            )}

            {/* Players List */}
            <div className="space-y-6">
                {isLoading || !data ? (
                    <div className="space-y-6">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-xl" />
                        ))}
                    </div>
                ) : players.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground rounded-2xl bg-card border border-border">
                        <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No merit ratings found</p>
                        <p className="text-sm mt-1">Ratings will appear here after players rate their teammates</p>
                    </div>
                ) : (
                    players.map((player) => (
                        <PlayerCard
                            key={player.id}
                            player={player}
                            onLiftBan={handleLiftBan}
                            isLifting={liftBanMutation.isPending}
                            isSuperAdmin={isSuperAdmin}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
