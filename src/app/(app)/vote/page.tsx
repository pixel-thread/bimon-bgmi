"use client";

import { usePolls, useVote } from "@/hooks/use-polls";
import { PollCard } from "@/components/vote/poll-card";
import { Skeleton, Card, CardBody } from "@heroui/react";
import { Vote, AlertCircle } from "lucide-react";

/**
 * /vote — Tournament voting page.
 * Shows active polls, lets users vote IN/OUT/SOLO.
 */
export default function VotePage() {
    const { data, isLoading, error, refetch } = usePolls();
    const voteMutation = useVote();

    const polls = data?.polls;
    const currentPlayerId = data?.currentPlayerId ?? undefined;

    function handleVote(pollId: string, vote: "IN" | "OUT" | "SOLO") {
        voteMutation.mutate({ pollId, vote });
    }

    return (
        <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
            <div className="mb-6 space-y-1">
                <div className="flex items-center gap-2">
                    <Vote className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-bold">Tournament Polls</h1>
                </div>
                <p className="text-sm text-foreground/50">
                    Vote on upcoming tournaments to secure your spot
                </p>
            </div>

            {isLoading && (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <Card key={i} className="border border-divider">
                            <CardBody className="space-y-4 p-4">
                                <Skeleton className="h-5 w-2/3 rounded" />
                                <Skeleton className="h-3 w-1/3 rounded" />
                                <Skeleton className="h-2 w-full rounded-full" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 flex-1 rounded-lg" />
                                    <Skeleton className="h-8 flex-1 rounded-lg" />
                                    <Skeleton className="h-8 flex-1 rounded-lg" />
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Failed to load polls. Please try again later.
                </div>
            )}

            {polls && (
                <div className="space-y-4">
                    {polls.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                            <Vote className="h-10 w-10 text-foreground/20" />
                            <div>
                                <p className="font-medium text-foreground/60">No active polls</p>
                                <p className="text-sm text-foreground/40">
                                    Check back later for upcoming tournaments
                                </p>
                            </div>
                        </div>
                    ) : (
                        polls.map((poll) => (
                            <PollCard
                                key={poll.id}
                                poll={poll}
                                onVote={handleVote}
                                isVoting={voteMutation.isPending}
                                currentPlayerId={currentPlayerId}
                                onRefetch={() => refetch()}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
