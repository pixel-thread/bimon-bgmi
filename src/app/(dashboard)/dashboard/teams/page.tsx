"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
    Divider,
    Avatar,
    Chip,
    Skeleton,
    Input,
    Select,
    SelectItem,
} from "@heroui/react";
import {
    Users,
    Search,
    Trophy,
    Swords,
    Medal,
    Crown,
    AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

interface TeamPlayer {
    id: string;
    displayName: string | null;
    username: string;
    imageUrl: string | null;
    category: string;
}

interface TeamDTO {
    id: string;
    name: string;
    teamNumber: number;
    matchCount: number;
    winner: {
        position: number;
        amount: number;
        isDistributed: boolean;
    } | null;
    players: TeamPlayer[];
}

interface TournamentOption {
    id: string;
    name: string;
}

const categoryColors: Record<string, "warning" | "primary" | "success" | "secondary" | "danger" | "default"> = {
    LEGEND: "warning",
    ULTRA_PRO: "primary",
    PRO: "success",
    NOOB: "secondary",
    ULTRA_NOOB: "danger",
    BOT: "default",
};

const positionLabels: Record<number, { label: string; color: string }> = {
    1: { label: "🥇 1st", color: "text-yellow-500" },
    2: { label: "🥈 2nd", color: "text-gray-400" },
    3: { label: "🥉 3rd", color: "text-amber-700" },
};

/**
 * /dashboard/teams — Admin teams viewer by tournament.
 */
export default function TeamsPage() {
    const [tournamentId, setTournamentId] = useState("");
    const [search, setSearch] = useState("");

    // Fetch tournaments for selector
    const { data: tournaments } = useQuery<TournamentOption[]>({
        queryKey: ["tournament-list-brief"],
        queryFn: async () => {
            const res = await fetch("/api/tournaments?limit=50");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data.map((t: { id: string; name: string }) => ({
                id: t.id,
                name: t.name,
            }));
        },
        staleTime: 60 * 1000,
    });

    // Fetch teams for selected tournament
    const { data: teams, isLoading, error } = useQuery<TeamDTO[]>({
        queryKey: ["teams", tournamentId],
        queryFn: async () => {
            const res = await fetch(`/api/teams?tournamentId=${tournamentId}`);
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        enabled: !!tournamentId,
        staleTime: 30 * 1000,
    });

    const filteredTeams = teams?.filter((t) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            t.name.toLowerCase().includes(q) ||
            t.players.some(
                (p) =>
                    (p.displayName?.toLowerCase().includes(q)) ||
                    p.username.toLowerCase().includes(q)
            )
        );
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold">Teams</h1>
                <p className="text-sm text-foreground/50">
                    View team compositions by tournament
                </p>
            </div>

            {/* Tournament selector */}
            <div className="flex flex-wrap items-center gap-2">
                <Select
                    placeholder="Select tournament"
                    selectedKeys={tournamentId ? [tournamentId] : []}
                    onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as string;
                        setTournamentId(val || "");
                    }}
                    classNames={{
                        trigger: "bg-default-100 border-none shadow-none max-w-xs",
                    }}
                    size="sm"
                >
                    {(tournaments ?? []).map((t) => (
                        <SelectItem key={t.id}>{t.name}</SelectItem>
                    ))}
                </Select>
                {tournamentId && (
                    <Input
                        placeholder="Search teams or players..."
                        value={search}
                        onValueChange={setSearch}
                        startContent={<Search className="h-4 w-4 text-default-400" />}
                        classNames={{
                            inputWrapper: "bg-default-100 border-none shadow-none max-w-xs",
                        }}
                        size="sm"
                        isClearable
                        onClear={() => setSearch("")}
                    />
                )}
            </div>

            {/* No tournament selected */}
            {!tournamentId && (
                <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                    <Swords className="h-10 w-10 text-foreground/20" />
                    <p className="text-sm text-foreground/50">
                        Select a tournament to view teams
                    </p>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load teams.
                </div>
            )}

            {isLoading && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-40 rounded-xl" />
                    ))}
                </div>
            )}

            {/* Team cards */}
            {filteredTeams && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTeams.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                            <Users className="h-10 w-10 text-foreground/20" />
                            <p className="text-sm text-foreground/50">No teams found</p>
                        </div>
                    ) : (
                        filteredTeams.map((team, i) => (
                            <motion.div
                                key={team.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.02 }}
                            >
                                <Card className="border border-divider">
                                    <CardHeader className="justify-between pb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                {team.teamNumber}
                                            </span>
                                            <h3 className="text-sm font-semibold">{team.name}</h3>
                                        </div>
                                        {team.winner && (
                                            <div className="flex items-center gap-1">
                                                <Medal className="h-3.5 w-3.5 text-warning" />
                                                <span
                                                    className={`text-xs font-semibold ${positionLabels[team.winner.position]?.color ?? ""
                                                        }`}
                                                >
                                                    {positionLabels[team.winner.position]?.label ??
                                                        `#${team.winner.position}`}
                                                </span>
                                                {team.winner.amount > 0 && (
                                                    <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        color="warning"
                                                        className="ml-1"
                                                    >
                                                        {team.winner.amount} UC
                                                    </Chip>
                                                )}
                                            </div>
                                        )}
                                    </CardHeader>
                                    <Divider />
                                    <CardBody className="space-y-2 pt-2">
                                        {team.players.map((player) => (
                                            <div
                                                key={player.id}
                                                className="flex items-center gap-2"
                                            >
                                                <Avatar
                                                    src={player.imageUrl || undefined}
                                                    name={player.displayName || player.username}
                                                    size="sm"
                                                    className="h-7 w-7"
                                                />
                                                <span className="flex-1 truncate text-sm">
                                                    {player.displayName || player.username}
                                                </span>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={
                                                        categoryColors[player.category] ?? "default"
                                                    }
                                                    className="text-[10px]"
                                                >
                                                    {player.category.replace("_", " ")}
                                                </Chip>
                                            </div>
                                        ))}
                                        <div className="text-xs text-foreground/30">
                                            {team.matchCount} matches played
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
