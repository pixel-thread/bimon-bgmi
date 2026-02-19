"use client";

import { Card, CardBody, CardFooter, Button, Chip } from "@heroui/react";
import {
    Users,
    Coins,
    CheckCircle,
    UserPlus,
    UserMinus,
    User,
    Calendar,
    Swords,
} from "lucide-react";
import { motion } from "motion/react";
import type { PollDTO } from "@/hooks/use-polls";

interface PollCardProps {
    poll: PollDTO;
    onVote: (pollId: string, vote: "IN" | "OUT" | "SOLO") => void;
    isVoting: boolean;
}

/**
 * Poll card showing tournament question, vote breakdown bar, and IN/OUT/SOLO buttons.
 */
export function PollCard({ poll, onVote, isVoting }: PollCardProps) {
    const { tournament } = poll;
    const total = poll.totalVotes || 1;
    const inPct = Math.round((poll.inVotes / total) * 100);
    const outPct = Math.round((poll.outVotes / total) * 100);
    const soloPct = 100 - inPct - outPct;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <Card
                className="border border-divider bg-background/80 backdrop-blur-sm"
                shadow="sm"
            >
                <CardBody className="space-y-4 p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-base font-semibold">{poll.question}</h3>
                            <p className="mt-0.5 text-xs text-foreground/50">
                                {tournament.name}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-foreground/40">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {poll.days}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Swords className="h-3 w-3" />
                                    {poll.teamType}
                                </span>
                            </div>
                        </div>
                        {tournament.fee != null && (
                            <Chip
                                size="sm"
                                variant="flat"
                                color="warning"
                                startContent={<Coins className="h-3 w-3" />}
                            >
                                {tournament.fee} UC
                            </Chip>
                        )}
                    </div>

                    {/* Vote breakdown */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-medium">
                            <span className="text-success">IN {poll.inVotes}</span>
                            <span className="text-foreground/40">
                                {poll.totalVotes} votes
                            </span>
                            <span className="text-warning">SOLO {poll.soloVotes}</span>
                            <span className="text-danger">OUT {poll.outVotes}</span>
                        </div>

                        {/* Tri-color bar */}
                        <div className="flex h-2 overflow-hidden rounded-full bg-default-100">
                            <div
                                className="bg-success transition-all duration-500"
                                style={{ width: `${inPct}%` }}
                            />
                            <div
                                className="bg-warning transition-all duration-500"
                                style={{ width: `${soloPct}%` }}
                            />
                            <div
                                className="bg-danger transition-all duration-500"
                                style={{ width: `${outPct}%` }}
                            />
                        </div>
                    </div>
                </CardBody>

                {/* Vote actions */}
                <CardFooter className="gap-2 px-4 pb-4 pt-0">
                    {poll.hasVoted ? (
                        <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-default-100 px-3 py-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span className="text-foreground/60">
                                You voted{" "}
                                <span
                                    className={`font-semibold ${poll.userVote === "IN"
                                            ? "text-success"
                                            : poll.userVote === "SOLO"
                                                ? "text-warning"
                                                : "text-danger"
                                        }`}
                                >
                                    {poll.userVote}
                                </span>
                            </span>
                        </div>
                    ) : (
                        <>
                            <Button
                                color="success"
                                variant="flat"
                                className="flex-1"
                                size="sm"
                                startContent={<UserPlus className="h-4 w-4" />}
                                isLoading={isVoting}
                                onPress={() => onVote(poll.id, "IN")}
                            >
                                I&apos;m In
                            </Button>
                            <Button
                                color="warning"
                                variant="flat"
                                className="flex-1"
                                size="sm"
                                startContent={<User className="h-4 w-4" />}
                                isLoading={isVoting}
                                onPress={() => onVote(poll.id, "SOLO")}
                            >
                                Solo
                            </Button>
                            <Button
                                color="danger"
                                variant="flat"
                                className="flex-1"
                                size="sm"
                                startContent={<UserMinus className="h-4 w-4" />}
                                isLoading={isVoting}
                                onPress={() => onVote(poll.id, "OUT")}
                            >
                                Out
                            </Button>
                        </>
                    )}
                </CardFooter>
            </Card>
        </motion.div>
    );
}
