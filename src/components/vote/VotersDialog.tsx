"use client";

import React, { useState, useMemo } from "react";
import { FiUsers } from "react-icons/fi";
import { User, Crown, ArrowLeft, Clock } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { PlayerAvatar } from "@/src/components/ui/player-avatar";
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
import { getDisplayName } from "@/src/utils/displayName";
import { getPollTheme, calculateParticipantCount } from "./pollTheme";
import { useDialogBackHandler } from "@/src/hooks/useDialogBackHandler";


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

    // Calculate waiting players (leftover players who don't form a complete team)
    const waitingPlayerIds = useMemo(() => {
      if (!pollVoters || !poll?.teamType) return new Set<string>();

      // Get team size based on teamType
      const teamSizeMap: Record<string, number> = {
        SOLO: 1,
        DUO: 2,
        TRIO: 3,
        SQUAD: 4,
        DYNAMIC: 2, // Default to duo for dynamic
      };
      const teamSize = teamSizeMap[poll.teamType] || 2;

      // If solo mode, no one is waiting
      if (teamSize === 1) return new Set<string>();

      // Get all IN/SOLO voters sorted by vote time (oldest first)
      const inSoloVoters = pollVoters
        .filter(v => v.vote === "IN" || v.vote === "SOLO")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const totalVoters = inSoloVoters.length;
      const leftoverCount = totalVoters % teamSize;

      // No leftovers = no one waiting
      if (leftoverCount === 0) return new Set<string>();

      // The last N voters are waiting (most recent voters)
      const waitingIds = new Set<string>();
      for (let i = totalVoters - leftoverCount; i < totalVoters; i++) {
        waitingIds.add(inSoloVoters[i].playerId);
      }

      return waitingIds;
    }, [pollVoters, poll?.teamType]);

    // Use the back button handler hook
    const handleOpenChange = useDialogBackHandler(isOpen, (open) => {
      if (!open) {
        setSelectedGroup(null);
        onClose();
      }
    }, "votersDialog");

    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className={`sm:max-w-lg ${theme ? `border-2 ${theme.dialogBorder}` : ''}`} hideCloseButton>
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

          <div className="py-4 max-h-[60vh] space-y-2 overflow-y-auto">
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
                                <div className="mb-4">
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    Voters for &quot;{option.name}&quot;
                                  </h4>
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {isLoading ? (
                                    <VotersListSkeleton />
                                  ) : (
                                    filterPollVote(option.vote)?.map((vote) => (
                                      <div
                                        key={vote.id}
                                        className={`flex items-center space-x-3 p-3 rounded-lg ${(vote.player as any)?.hasRoyalPass
                                          ? 'bg-gradient-to-r from-amber-400/30 via-yellow-300/25 to-amber-400/30 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                          : theme ? theme.voterCard : 'bg-white dark:bg-gray-700'
                                          }`}
                                      >
                                        <PlayerAvatar
                                          characterImageUrl={vote.player?.customProfileImageUrl || vote.player?.characterImage?.publicUrl}
                                          imageUrl={(vote.player as any)?.imageUrl}
                                          displayName={vote.player.user.displayName}
                                          userName={vote.player.user.userName}
                                          size="md"
                                          showUserIcon
                                        />
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                                            {getDisplayName(vote.player.user.displayName, vote.player.user.userName)}
                                            {(vote.player as any)?.hasRoyalPass && (
                                              <Crown className="w-4 h-4 text-amber-500 crown-glow flex-shrink-0" />
                                            )}
                                            {(option.vote === "IN" || option.vote === "SOLO") && waitingPlayerIds.has(vote.playerId) && (
                                              <span title="Waiting for more players">
                                                <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                              </span>
                                            )}
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
                                      <PlayerAvatar
                                        characterImageUrl={vote.player?.customProfileImageUrl || vote.player?.characterImage?.publicUrl}
                                        imageUrl={(vote.player as any)?.imageUrl}
                                        displayName={vote.player.user.displayName}
                                        userName={vote.player.user.userName}
                                        size="md"
                                        showUserIcon
                                      />
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
            {selectedGroup ? (
              <Button
                onClick={() => setSelectedGroup(null)}
                className={`w-full flex items-center justify-center gap-2 ${theme ? `${theme.dialogIcon} hover:opacity-90` : ''}`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <Button
                onClick={() => onClose()}
                className={`w-full ${theme ? `${theme.dialogIcon} hover:opacity-90` : ''}`}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

VotersDialog.displayName = "VotersDialog";
