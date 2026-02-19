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
    Select,
    SelectItem,
} from "@heroui/react";
import {
    Gamepad2,
    Swords,
    Skull,
    Target,
    AlertCircle,
    Medal,
} from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

interface MatchPlayer {
    id: string;
    displayName: string | null;
    username: string;
    imageUrl: string | null;
    kills: number;
    deaths: number;
}

interface MatchTeam {
    teamId: string;
    teamName: string;
    teamNumber: number;
    position: number;
    players: MatchPlayer[];
}

interface MatchDTO {
    id: string;
    matchNumber: number;
    createdAt: string;
    teams: MatchTeam[];
}

const positionBg: Record<number, string> = {
    1: "bg-yellow-500/10 border-yellow-500/30",
    2: "bg-gray-400/10 border-gray-400/30",
    3: "bg-amber-700/10 border-amber-700/30",
};

/**
 * /dashboard/matches — Admin match viewer by tournament.
 * Shows scoreboard per match with team positions and player K/D.
 */
export default function MatchesPage() {
    const [tournamentId, setTournamentId] = useState("");

    const { data: tournaments } = useQuery<{ id: string; name: string }[]>({
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

    const { data: matches, isLoading, error } = useQuery<MatchDTO[]>({
        queryKey: ["matches", tournamentId],
        queryFn: async () => {
            const res = await fetch(`/api/matches?tournamentId=${tournamentId}`);
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        enabled: !!tournamentId,
        staleTime: 30 * 1000,
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold">Matches</h1>
                <p className="text-sm text-foreground/50">
                    View match scoreboards by tournament
                </p>
            </div>

            {/* Tournament selector */}
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

            {!tournamentId && (
                <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                    <Gamepad2 className="h-10 w-10 text-foreground/20" />
                    <p className="text-sm text-foreground/50">
                        Select a tournament to view matches
                    </p>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load matches.
                </div>
            )}

            {isLoading && (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {/* Match cards */}
            {matches && (
                <div className="space-y-4">
                    {matches.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                            <Swords className="h-10 w-10 text-foreground/20" />
                            <p className="text-sm text-foreground/50">
                                No matches recorded yet
                            </p>
                        </div>
                    ) : (
                        matches.map((match, i) => (
                            <motion.div
                                key={match.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <Card className="border border-divider">
                                    <CardHeader className="gap-2 pb-2">
                                        <Gamepad2 className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-semibold">
                                            Match {match.matchNumber}
                                        </h3>
                                        <span className="ml-auto text-xs text-foreground/30">
                                            {new Date(match.createdAt).toLocaleDateString()}
                                        </span>
                                    </CardHeader>
                                    <Divider />
                                    <CardBody className="space-y-3 pt-3">
                                        {match.teams.map((team) => (
                                            <div
                                                key={team.teamId}
                                                className={`rounded-lg border p-3 ${positionBg[team.position] ??
                                                    "border-divider bg-default-50"
                                                    }`}
                                            >
                                                {/* Team header */}
                                                <div className="mb-2 flex items-center gap-2">
                                                    {team.position <= 3 && (
                                                        <Medal
                                                            className={`h-3.5 w-3.5 ${team.position === 1
                                                                    ? "text-yellow-500"
                                                                    : team.position === 2
                                                                        ? "text-gray-400"
                                                                        : "text-amber-700"
                                                                }`}
                                                        />
                                                    )}
                                                    <span className="text-xs font-semibold">
                                                        #{team.position} {team.teamName}
                                                    </span>
                                                </div>

                                                {/* Players */}
                                                <div className="space-y-1">
                                                    {team.players.map((p) => (
                                                        <div
                                                            key={p.id}
                                                            className="flex items-center gap-2 text-xs"
                                                        >
                                                            <Avatar
                                                                src={p.imageUrl || undefined}
                                                                name={p.displayName || p.username}
                                                                size="sm"
                                                                className="h-5 w-5"
                                                            />
                                                            <span className="flex-1 truncate">
                                                                {p.displayName || p.username}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-success">
                                                                <Target className="h-3 w-3" />
                                                                {p.kills}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-danger">
                                                                <Skull className="h-3 w-3" />
                                                                {p.deaths}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
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
