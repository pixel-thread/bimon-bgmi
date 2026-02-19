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
import { Trophy, Medal, Crown, AlertCircle, Coins } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

interface WinnerDTO {
    id: string;
    position: number;
    amount: number;
    isDistributed: boolean;
    teamName: string;
    teamNumber: number;
    players: {
        id: string;
        displayName: string | null;
        username: string;
        imageUrl: string | null;
    }[];
}

/**
 * /dashboard/winners — View tournament winners.
 */
export default function WinnersPage() {
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

    const { data: winners, isLoading, error } = useQuery<WinnerDTO[]>({
        queryKey: ["winners", tournamentId],
        queryFn: async () => {
            const res = await fetch(`/api/winners?tournamentId=${tournamentId}`);
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        enabled: !!tournamentId,
        staleTime: 30 * 1000,
    });

    const positionColors: Record<number, string> = {
        1: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
        2: "from-gray-400/20 to-gray-400/5 border-gray-400/30",
        3: "from-amber-700/20 to-amber-700/5 border-amber-700/30",
    };

    const positionIcons: Record<number, typeof Crown> = {
        1: Crown,
        2: Medal,
        3: Medal,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold">Winners</h1>
                <p className="text-sm text-foreground/50">
                    View tournament winners and prize distribution
                </p>
            </div>

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
                    <Trophy className="h-10 w-10 text-foreground/20" />
                    <p className="text-sm text-foreground/50">
                        Select a tournament to view winners
                    </p>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load winners.
                </div>
            )}

            {isLoading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {winners && (
                <div className="space-y-3">
                    {winners.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                            <Trophy className="h-10 w-10 text-foreground/20" />
                            <p className="text-sm text-foreground/50">
                                No winners declared yet
                            </p>
                        </div>
                    ) : (
                        winners.map((w, i) => {
                            const Icon = positionIcons[w.position] ?? Medal;
                            return (
                                <motion.div
                                    key={w.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Card
                                        className={`border bg-gradient-to-r ${positionColors[w.position] ?? "border-divider"
                                            }`}
                                    >
                                        <CardHeader className="justify-between pb-1">
                                            <div className="flex items-center gap-2">
                                                <Icon
                                                    className={`h-5 w-5 ${w.position === 1
                                                            ? "text-yellow-500"
                                                            : w.position === 2
                                                                ? "text-gray-400"
                                                                : "text-amber-700"
                                                        }`}
                                                />
                                                <h3 className="text-sm font-bold">
                                                    #{w.position} — {w.teamName}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color="warning"
                                                    startContent={
                                                        <Coins className="h-3 w-3" />
                                                    }
                                                >
                                                    {w.amount} UC
                                                </Chip>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={w.isDistributed ? "success" : "warning"}
                                                >
                                                    {w.isDistributed ? "Paid" : "Pending"}
                                                </Chip>
                                            </div>
                                        </CardHeader>
                                        <Divider />
                                        <CardBody className="pt-2">
                                            <div className="flex flex-wrap gap-3">
                                                {w.players.map((p) => (
                                                    <div
                                                        key={p.id}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Avatar
                                                            src={p.imageUrl || undefined}
                                                            name={p.displayName || p.username}
                                                            size="sm"
                                                            className="h-7 w-7"
                                                        />
                                                        <span className="text-sm">
                                                            {p.displayName || p.username}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardBody>
                                    </Card>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
