"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
    Chip,
    Image,
    Skeleton,
} from "@heroui/react";
import {
    Trophy,
    Gamepad2,
    Map,
    Coins,
    ImageIcon,
    AlertCircle,
} from "lucide-react";
import { motion } from "motion/react";

interface MatchImage {
    id: string;
    url: string;
    matchNumber: number;
}

interface MatchGroup {
    id: string;
    tournament: {
        id: string;
        name: string;
        mode: string;
        map: string;
        fee: number;
    };
    images: MatchImage[];
    createdAt: string;
}

/**
 * /recent-matches — Public scoreboard gallery.
 * Shows scoreboard screenshots grouped by tournament.
 */
export default function RecentMatchesPage() {
    const { data, isLoading, error } = useQuery<MatchGroup[]>({
        queryKey: ["recent-matches"],
        queryFn: async () => {
            const res = await fetch("/api/recent-matches");
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            return json.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    return (
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
            {/* Header */}
            <div className="mb-6 space-y-1">
                <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-bold">Recent Matches</h1>
                </div>
                <p className="text-sm text-foreground/50">
                    Scoreboards from recent tournaments
                </p>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="border border-divider">
                            <CardHeader className="pb-2">
                                <Skeleton className="h-5 w-1/2 rounded" />
                            </CardHeader>
                            <CardBody className="gap-3">
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {[1, 2, 3].map((j) => (
                                        <Skeleton
                                            key={j}
                                            className="aspect-[4/3] w-full rounded-lg"
                                        />
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Failed to load matches. Please try again later.
                </div>
            )}

            {/* Match groups */}
            {data && (
                <div className="space-y-6">
                    {data.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                            <ImageIcon className="h-10 w-10 text-foreground/20" />
                            <div>
                                <p className="font-medium text-foreground/60">
                                    No scoreboards yet
                                </p>
                                <p className="text-sm text-foreground/40">
                                    Match results will appear here after tournaments
                                </p>
                            </div>
                        </div>
                    ) : (
                        data.map((group, index) => (
                            <motion.div
                                key={group.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="border border-divider bg-background/80 backdrop-blur-sm">
                                    <CardHeader className="flex-col items-start gap-1 pb-2">
                                        <h3 className="text-base font-semibold">
                                            {group.tournament.name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/50">
                                            <span className="flex items-center gap-1">
                                                <Gamepad2 className="h-3 w-3" />
                                                {group.tournament.mode}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Map className="h-3 w-3" />
                                                {group.tournament.map}
                                            </span>
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color="warning"
                                                startContent={<Coins className="h-3 w-3" />}
                                            >
                                                {group.tournament.fee} UC
                                            </Chip>
                                        </div>
                                    </CardHeader>
                                    <CardBody className="gap-3 pt-0">
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                            {group.images.map((img) => (
                                                <div key={img.id} className="relative">
                                                    <Image
                                                        src={img.url}
                                                        alt={`Match ${img.matchNumber}`}
                                                        className="aspect-[4/3] w-full rounded-lg object-cover"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                                                        Match {img.matchNumber}
                                                    </div>
                                                </div>
                                            ))}
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
