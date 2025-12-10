"use client";

import { useState } from "react";
import { PollT } from "@/src/types/poll";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Switch } from "@/src/components/ui/switch";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
    Pencil,
    Eye,
    Users,
    Trash2,
    MoreVertical,
    ChevronRight,
    Loader2,
} from "lucide-react";
import Link from "next/link";

interface PollCardProps {
    poll: PollT;
    onToggleStatus: (id: string) => void;
    onDelete: (id: string) => void;
    onDeleteTeams: (tournamentId: string) => void;
    onPreviewTeams: (pollId: string, size: number) => void;
    isToggling: boolean;
    isDeleting: boolean;
    isTeamsDeleting: boolean;
    isPreviewLoading: boolean;
}

export function PollCard({
    poll,
    onToggleStatus,
    onDelete,
    onDeleteTeams,
    onPreviewTeams,
    isToggling,
    isDeleting,
    isTeamsDeleting,
    isPreviewLoading,
}: PollCardProps) {
    const [showTeamOptions, setShowTeamOptions] = useState(false);

    // Count votes from playersVotes relation
    const playersVotes = poll.playersVotes || [];
    const totalVotes = playersVotes.length;

    // Count votes per option type
    const getVoteCountForOption = (optionVote: string) => {
        return playersVotes.filter((pv) => pv.vote === optionVote).length;
    };

    // Find leading option
    const voteCounts = poll.options.map((opt) => ({
        name: opt.name,
        vote: opt.vote,
        count: getVoteCountForOption(opt.vote),
    }));
    const sortedByCount = [...voteCounts].sort((a, b) => b.count - a.count);
    const leadingOption = sortedByCount[0];

    const getVotePercentage = (optionVote: string) => {
        if (totalVotes === 0) return 0;
        const count = getVoteCountForOption(optionVote);
        return Math.round((count / totalVotes) * 100);
    };

    return (
        <Card className="border bg-card hover:shadow-sm transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge
                                variant={poll.isActive ? "default" : "secondary"}
                                className="shrink-0"
                            >
                                {poll.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline" className="shrink-0">
                                {poll.tournament?.name || "No Tournament"}
                            </Badge>
                            {poll.days && (
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                    {poll.days}
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-base font-medium line-clamp-2">
                            {poll.question}
                        </CardTitle>
                    </div>

                    <div className="flex items-center gap-2">
                        {isToggling && (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        )}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center">
                                        <Switch
                                            checked={poll.isActive}
                                            onCheckedChange={() => onToggleStatus(poll.id)}
                                            disabled={isToggling}
                                            className="data-[state=checked]:bg-emerald-500"
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{poll.isActive ? "Deactivate poll" : "Activate poll"}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Vote statistics */}
                <div className="text-sm text-muted-foreground">
                    {totalVotes} votes
                </div>

                {/* Options with vote bars */}
                <div className="space-y-3">
                    {poll.options.map((option, index) => {
                        const count = getVoteCountForOption(option.vote);
                        const percentage = getVotePercentage(option.vote);
                        const isLeading = option.vote === leadingOption?.vote && totalVotes > 0 && leadingOption.count > 0;

                        return (
                            <div key={option.id} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-foreground">
                                        {option.name}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                        {count} ({percentage}%)
                                    </span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isLeading
                                            ? "bg-emerald-500"
                                            : "bg-primary/50"
                                            }`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/polls?update=${poll.id}`}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                Edit
                            </Button>
                        </Link>
                        <Link href={`/admin/polls?view=${poll.id}`}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                Voters
                            </Button>
                        </Link>

                        {/* Team creation dropdown */}
                        <DropdownMenu
                            open={showTeamOptions}
                            onOpenChange={setShowTeamOptions}
                        >
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                    disabled={isPreviewLoading}
                                >
                                    {isPreviewLoading ? (
                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                        <Users className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    Create Teams
                                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Select Team Size</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {[1, 2, 3, 4].map((size) => (
                                    <DropdownMenuItem
                                        key={size}
                                        onClick={() => {
                                            onPreviewTeams(poll.id, size);
                                            setShowTeamOptions(false);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        {size === 1 ? "Solo" : `${size} Players per Team`}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Danger actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                                onClick={() => onDeleteTeams(poll.tournamentId)}
                                disabled={isTeamsDeleting}
                                className="text-orange-600 dark:text-orange-400 focus:text-orange-600 dark:focus:text-orange-400 cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove All Teams
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(poll.id)}
                                disabled={isDeleting}
                                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Poll
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );
}
