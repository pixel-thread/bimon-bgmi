"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
    Divider,
    Chip,
    Skeleton,
    Progress,
} from "@heroui/react";
import {
    Vote,
    AlertCircle,
    CheckCircle2,
    Users,
    Calendar,
    InboxIcon,
} from "lucide-react";
import { motion } from "motion/react";

interface PollDTO {
    id: string;
    question: string;
    teamType: string;
    days: number;
    isActive: boolean;
    inVotes: number;
    outVotes: number;
    soloVotes: number;
    totalVotes: number;
    createdAt: string;
}

/**
 * /dashboard/polls — Admin polls overview.
 */
export default function PollsAdminPage() {
    const { data, isLoading, error } = useQuery<PollDTO[]>({
        queryKey: ["admin-polls"],
        queryFn: async () => {
            const res = await fetch("/api/polls?all=true");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        staleTime: 30 * 1000,
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold">Polls</h1>
                <p className="text-sm text-foreground/50">
                    View all polls and voting results
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load polls.
                </div>
            )}

            {isLoading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-36 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {data && (
                <div className="space-y-3">
                    {data.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                            <InboxIcon className="h-10 w-10 text-foreground/20" />
                            <p className="text-sm text-foreground/50">No polls found</p>
                        </div>
                    ) : (
                        data.map((poll, i) => {
                            const total = poll.totalVotes || 1;
                            const inPct = Math.round((poll.inVotes / total) * 100);
                            const outPct = Math.round((poll.outVotes / total) * 100);
                            const soloPct = Math.round((poll.soloVotes / total) * 100);

                            return (
                                <motion.div
                                    key={poll.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                >
                                    <Card className="border border-divider">
                                        <CardHeader className="justify-between pb-1">
                                            <div className="flex items-center gap-2">
                                                <Vote className="h-4 w-4 text-primary" />
                                                <h3 className="text-sm font-semibold line-clamp-1">
                                                    {poll.question}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={poll.isActive ? "success" : "default"}
                                                    startContent={
                                                        poll.isActive ? (
                                                            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                                                        ) : (
                                                            <CheckCircle2 className="h-3 w-3" />
                                                        )
                                                    }
                                                >
                                                    {poll.isActive ? "Active" : "Closed"}
                                                </Chip>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    className="text-[10px]"
                                                >
                                                    {poll.teamType}
                                                </Chip>
                                            </div>
                                        </CardHeader>
                                        <Divider />
                                        <CardBody className="space-y-3 pt-3">
                                            {/* Vote distribution */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-success">IN {inPct}%</span>
                                                    <span className="text-warning">SOLO {soloPct}%</span>
                                                    <span className="text-danger">OUT {outPct}%</span>
                                                </div>
                                                <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
                                                    <div
                                                        className="bg-success transition-all"
                                                        style={{ width: `${inPct}%` }}
                                                    />
                                                    <div
                                                        className="bg-warning transition-all"
                                                        style={{ width: `${soloPct}%` }}
                                                    />
                                                    <div
                                                        className="bg-danger transition-all"
                                                        style={{ width: `${outPct}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Meta */}
                                            <div className="flex items-center gap-4 text-xs text-foreground/40">
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {poll.totalVotes} votes
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {poll.days} days
                                                </span>
                                                <span>
                                                    {new Date(poll.createdAt).toLocaleDateString()}
                                                </span>
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
