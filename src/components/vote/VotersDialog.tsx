"use client";

import React, { useState } from "react";
import { FiUsers } from "react-icons/fi";
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

type PollT = Prisma.PollGetPayload<{ include: { options: true } }>;

type VotersDialogsProps = {
  isOpen: boolean;
  onClose: () => void;
  poll: PollT;
};

// get the enum from prisma
type VoteT = Prisma.PlayerPollVoteCreateInput["vote"];

export const VotersDialog: React.FC<VotersDialogsProps> = React.memo(
  ({ isOpen, onClose, poll: poll }) => {
    const [selectedGroup, setSelectedGroup] = useState<VoteT | null>(null);

    const pollId = poll.id;

    const { data: pollVoters } = usePlayerVote({ pollId, enabled: isOpen });

    const pollQuestion = poll?.question;

    const allVotes = pollVoters;

    const displayLimit = 0;

    const totalVotes = allVotes?.length || 0;

    const onCloseOnClick = () => {
      setSelectedGroup(null);
      onClose();
    };

    const filterPollVote = (vote: VoteT) => {
      return pollVoters?.filter((val) => val.vote === vote) || [];
    };

    return (
      <Dialog open={isOpen} onOpenChange={onCloseOnClick}>
        <DialogContent className="sm:max-w-lg mx-2 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <FiUsers className="w-4 h-4 text-white" />
              </div>
              <div>{pollQuestion}</div>
            </DialogTitle>
            <DialogDescription>
              {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[60vh] space-x-2 space-y-2 overflow-y-auto">
            <div className="gap-y-2 grid">
              {poll &&
                poll?.options?.map((option, index) => (
                  <div className="space-y-2 grid" key={index}>
                    {!selectedGroup && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
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
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3">
                          <Progress
                            value={filterPollVote(option.vote)?.length || 0}
                          />
                        </div>
                        <div className="flex justify-end">
                          {filterPollVote(option.vote).length >
                            displayLimit && (
                            <button
                              onClick={() => setSelectedGroup(option.vote)}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
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
                            <div className="border border-gray-200  dark:border-gray-700 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  Voters for "{option.name}"
                                </h4>
                                <button
                                  onClick={() => setSelectedGroup(null)}
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                >
                                  ← Back
                                </button>
                              </div>

                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {filterPollVote(option.vote)?.map((vote) => (
                                  <div
                                    key={vote.id}
                                    className="flex items-center space-x-3 p-3 rounded-lg bg-white dark:bg-gray-700"
                                  >
                                    <Avatar>
                                      <AvatarImage
                                        src={
                                          vote.player.characterImage?.publicUrl
                                        }
                                        alt={vote.playerId}
                                      />
                                      <AvatarFallback>
                                        {vote.player.user.userName
                                          .split(" ")
                                          .map((name) => name[0])}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {vote.player.user.userName}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(
                                          vote.createdAt,
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
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
                                      <AvatarImage src="" alt={vote.playerId} />
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
          </div>

          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

VotersDialog.displayName = "VotersDialog";
