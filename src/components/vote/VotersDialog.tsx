"use client";

import React, { useState } from "react";
import { FiUsers } from "react-icons/fi";
import { User } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Ternary } from "../common/Ternary";
import { Progress } from "../ui/progress";
import { usePlayerVote } from "@/src/hooks/poll/usePlayerVote";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { VotersListSkeleton, VotersSkeleton } from "./VotersSkeleton";

import { PollT } from "@/src/types/poll";
import { getDisplayName } from "@/src/utils/bgmiDisplay";
import { getPollTheme, calculateParticipantCount } from "./pollTheme";

type VotersDialogsProps = {
  isOpen: boolean;
  id: string;
  onClose: () => void;
  poll?: Partial<PollT> | null;
};

// get the enum from prisma
type VoteT = Prisma.PlayerPollVoteCreateInput["vote"];

export const VotersDialog: React.FC<VotersDialogsProps> = React.memo(
  ({ isOpen, id, onClose, poll }) => {
    const [selectedGroup, setSelectedGroup] = useState<VoteT | null>(null);

    const { data: fetchedVotes, isLoading } = usePlayerVote({
      pollId: id,
      enabled: !poll?.playersVotes,
    });

    const pollVoters = poll?.playersVotes || fetchedVotes;

    const pollQuestion = poll?.question;

    const allVotes = pollVoters;

    const displayLimit = 0;

    const totalVotes = allVotes?.length || 0;

    const filterPollVote = (vote: VoteT) => {
      return (pollVoters?.filter((val) => val.vote === vote) || [])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    // Collect all unique votes
    const allUniqueVotes = [...new Set(pollVoters?.map((v) => v.vote))];

    // Count votes for each option
    const voteCounts = allUniqueVotes.map((vote) => ({
      vote,
      count: filterPollVote(vote).length,
    }));

    // Find the highest vote count for normalization
    const maxVoteCount = Math.max(...voteCounts.map((vc) => vc.count), 1); // Use 1 to avoid division by zero

    // Calculate percentages
    const votePercentages = voteCounts.map((vc) => ({
      vote: vc.vote,
      count: vc.count,
      percentage: Math.round((vc.count / maxVoteCount) * 100),
    }));

    // Calculate theme based on participant count
    const participantCount = calculateParticipantCount(pollVoters as { vote: string }[] | undefined);
    const theme = getPollTheme(participantCount);

    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className={`sm:max-w-lg mx-2 sm:mx-0 ${theme ? `border-2 ${theme.dialogBorder}` : ''}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme ? theme.dialogIcon : 'bg-blue-500'}`}>
                <FiUsers className="w-4 h-4 text-white" />
              </div>
              <div>{pollQuestion}</div>
            </DialogTitle>
            <DialogDescription>
              {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[60vh] space-x-2 space-y-2 overflow-y-auto">
            {isLoading ? (
              <VotersSkeleton />
            ) : (
              <div className="gap-y-2 grid">
                {poll &&
                  poll?.options?.map((option, index) => (
                    <div className="space-y-2 grid" key={index}>
                      {!selectedGroup && (
                        <div className={`border rounded-lg p-4 ${theme ? theme.dialogBorder : 'border-gray-200 dark:border-gray-700'}`}>
                          <div className="flex items-center space-x-2 justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {option.name}
                              </h4>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {filterPollVote(option.vote)?.length || 0}
                                &nbsp;vote
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${theme ? theme.progressBar : 'bg-blue-500'}`}
                              style={{ width: `${votePercentages.find((val) => val.vote === option.vote)?.percentage || 0}%` }}
                            />
                          </div>
                          <div className="flex justify-end">
                            {filterPollVote(option.vote).length >
                              displayLimit && (
                                <button
                                  onClick={() => setSelectedGroup(option.vote)}
                                  className={`text-sm font-medium ${theme ? theme.button : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'}`}
                                >
                                  See all {filterPollVote(option.vote).length}{" "}
                                  voters
                                </button>
                              )}
                          </div>
                        </div>
                      )}

                      {/* Show first few voters */}
                      {filterPollVote &&
                        filterPollVote(option.vote)?.length > displayLimit && (
                          <Ternary
                            condition={selectedGroup === option.vote}
                            trueComponent={
                              <div className={`border rounded-lg p-4 ${theme ? theme.dialogBorder : 'border-gray-200 dark:border-gray-700'}`}>
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    Voters for &quot;{option.name}&quot;
                                  </h4>
                                  <button
                                    onClick={() => setSelectedGroup(null)}
                                    className={`text-sm ${theme ? theme.button : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'}`}
                                  >
                                    ← Back
                                  </button>
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {isLoading ? (
                                    <VotersListSkeleton />
                                  ) : (
                                    filterPollVote(option.vote)?.map((vote) => (
                                      <div
                                        key={vote.id}
                                        className={`flex items-center space-x-3 p-3 rounded-lg ${theme ? theme.voterCard : 'bg-white dark:bg-gray-700'}`}
                                      >
                                        <Avatar>
                                          <AvatarImage
                                            src={
                                              vote.player?.characterImage?.publicUrl ||
                                              (vote.player as any)?.imageUrl ||
                                              ''
                                            }
                                            alt={vote.playerId}
                                          />
                                          <AvatarFallback>
                                            <User className="w-5 h-5 text-gray-400" />
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900 dark:text-white">
                                            {getDisplayName(vote.player.user.displayName, vote.player.user.userName)}
                                          </p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(
                                              vote.createdAt,
                                            ).toLocaleString('en-US', {
                                              hour: 'numeric',
                                              minute: '2-digit',
                                              second: '2-digit',
                                              hour12: true,
                                              day: 'numeric',
                                              month: 'short',
                                            })}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            }
                            falseComponent={
                              <div className="grid  grid-cols-2 space-y-2">
                                {filterPollVote(option.vote)
                                  ?.slice(0, displayLimit)
                                  .map((vote) => (
                                    <div
                                      key={vote.id}
                                      className="flex items-center space-x-2"
                                    >
                                      <Avatar>
                                        <AvatarImage
                                          src={vote.player?.characterImage?.publicUrl || (vote.player as any)?.imageUrl || ''}
                                          alt={vote.playerId}
                                        />
                                        <AvatarFallback>
                                          <User className="w-5 h-5 text-gray-400" />
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {vote.player.userId}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            }
                          />
                        )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => onClose()}
              className={theme ? `${theme.dialogIcon} hover:opacity-90` : ''}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

VotersDialog.displayName = "VotersDialog";
