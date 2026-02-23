"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";

export interface PollDTO {
    id: string;
    question: string;
    days: string;
    teamType: string;
    tournament: {
        id: string;
        name: string;
        fee: number | null;
        seasonId: string | null;
    };
    luckyVoterId: string | null;
    isActive: boolean;
    createdAt: string;
    totalVotes: number;
    inVotes: number;
    outVotes: number;
    soloVotes: number;
    inPercentage: number;
    userVote: "IN" | "OUT" | "SOLO" | null;
    hasVoted: boolean;
    playersVotes: {
        playerId: string;
        vote: string;
        createdAt: string;
        displayName: string;
        imageUrl: string;
    }[];
    options: {
        id: string;
        name: string;
        vote: string;
    }[];
}

/**
 * Fetch active polls with vote data.
 */
export function usePolls() {
    return useQuery<{ polls: PollDTO[]; currentPlayerId: string | null }>({
        queryKey: ["polls"],
        queryFn: async () => {
            const res = await fetch(`/api/polls?_t=${Date.now()}`);
            if (!res.ok) throw new Error("Failed to fetch polls");
            const json = await res.json();
            return json.data;
        },
        staleTime: 30 * 1000,
    });
}

/**
 * Cast a vote on a poll (IN/OUT/SOLO).
 * Optimistically updates vote counts AND the playersVotes list.
 * Exposes `variables` so callers can check which poll/vote is pending.
 */
export function useVote() {
    const queryClient = useQueryClient();
    const { user: clerkUser } = useUser();

    return useMutation({
        mutationFn: async ({
            pollId,
            vote,
        }: {
            pollId: string;
            vote: "IN" | "OUT" | "SOLO";
        }) => {
            const res = await fetch("/api/polls/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pollId, vote }),
            });
            if (!res.ok) throw new Error("Failed to cast vote");
            return res.json();
        },
        onMutate: async ({ pollId, vote }) => {
            await queryClient.cancelQueries({ queryKey: ["polls"] });
            const previous = queryClient.getQueryData<{ polls: PollDTO[]; currentPlayerId: string | null }>(["polls"]);

            queryClient.setQueryData<{ polls: PollDTO[]; currentPlayerId: string | null }>(["polls"], (old) => {
                if (!old) return old;
                const currentPlayerId = old.currentPlayerId;
                return {
                    ...old,
                    polls: old.polls.map((poll) => {
                        if (poll.id !== pollId) return poll;

                        let { inVotes, outVotes, soloVotes } = poll;

                        // Remove previous vote
                        if (poll.hasVoted) {
                            if (poll.userVote === "IN") inVotes--;
                            if (poll.userVote === "OUT") outVotes--;
                            if (poll.userVote === "SOLO") soloVotes--;
                        }

                        // Add new vote
                        if (vote === "IN") inVotes++;
                        else if (vote === "OUT") outVotes++;
                        else soloVotes++;

                        const totalVotes = inVotes + outVotes + soloVotes;

                        // Optimistically update playersVotes array
                        let playersVotes = [...poll.playersVotes];
                        if (currentPlayerId) {
                            playersVotes = playersVotes.filter(
                                (v) => v.playerId !== currentPlayerId
                            );
                            playersVotes.push({
                                playerId: currentPlayerId,
                                vote,
                                createdAt: new Date().toISOString(),
                                displayName:
                                    clerkUser?.fullName ||
                                    clerkUser?.username ||
                                    "You",
                                imageUrl: clerkUser?.imageUrl || "",
                            });
                        }

                        return {
                            ...poll,
                            userVote: vote,
                            hasVoted: true,
                            inVotes,
                            outVotes,
                            soloVotes,
                            totalVotes,
                            playersVotes,
                            inPercentage:
                                totalVotes > 0
                                    ? Math.round((inVotes / totalVotes) * 100)
                                    : 0,
                        };
                    }),
                };
            });

            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["polls"], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["polls"] });
        },
    });
}
