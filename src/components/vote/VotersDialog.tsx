"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FiUsers } from "react-icons/fi";
import { Avatar } from "@/src/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { VotersDialogProps } from "./types";

export const VotersDialog: React.FC<VotersDialogProps> = React.memo(
  ({ isOpen, onClose, pollId, pollQuestion, option, allVotes, voteCounts }) => {
    const [showAll, setShowAll] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

    // Group votes by option
    const groupedVotes = useMemo(() => {
      const groups: Record<string, any[]> = {};
      allVotes.forEach((vote) => {
        if (!groups[vote.vote]) {
          groups[vote.vote] = [];
        }
        groups[vote.vote].push(vote);
      });

      // Sort votes within each group by time (newest first)
      Object.keys(groups).forEach((key) => {
        groups[key].sort(
          (a, b) =>
            new Date(b.votedAt).getTime() - new Date(a.votedAt).getTime(),
        );
      });

      return groups;
    }, [allVotes]);

    const totalVotes = allVotes.length;

    // Reset state when dialog opens/closes
    useEffect(() => {
      if (!isOpen) {
        setShowAll(false);
        setSelectedGroup(null);
      }
    }, [isOpen]);

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg mx-2 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <FiUsers className="w-4 h-4 text-white" />
              </div>
              <span>Poll Results</span>
            </DialogTitle>
            <DialogDescription>
              {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Question:
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {pollQuestion}
              </p>
            </div>

            {!selectedGroup ? (
              // Show grouped results
              <div className="space-y-3">
                {Object.entries(groupedVotes).map(([optionText, votes]) => {
                  const count = votes.length;
                  const percentage =
                    totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                  const displayLimit = 3;

                  return (
                    <div
                      key={optionText}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {optionText}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {count} vote{count !== 1 ? "s" : ""} (
                            {percentage.toFixed(0)}%)
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {/* Show first few voters */}
                      {votes.length > 0 && (
                        <div className="space-y-2">
                          {votes.slice(0, displayLimit).map((vote) => (
                            <div
                              key={vote.id}
                              className="flex items-center space-x-2"
                            >
                              <Avatar
                                src={
                                  (vote as any).avatarBase64 ||
                                  (vote as any).avatarUrl
                                }
                                alt={vote.playerName}
                                size="sm"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {vote.playerName}
                              </span>
                            </div>
                          ))}

                          {votes.length > displayLimit && (
                            <button
                              onClick={() => setSelectedGroup(optionText)}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                            >
                              See all {votes.length} voters
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Show detailed view for selected group
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Voters for "{selectedGroup}"
                  </h4>
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    ← Back to overview
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {groupedVotes[selectedGroup]?.map((vote) => (
                    <div
                      key={vote.id}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-white dark:bg-gray-700"
                    >
                      <Avatar
                        src={
                          (vote as any).avatarBase64 || (vote as any).avatarUrl
                        }
                        alt={vote.playerName}
                        size="md"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {vote.playerName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(vote.votedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
