"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useAuth } from "@/src/hooks/useAuth";
import { useTournaments } from "@/src/hooks/tournament/useTournaments";
import {
  calculateRemainingBanDuration,
  formatRemainingBanDuration,
} from "@/src/utils/banUtils";
import { Poll, PollVote } from "@/src/lib/types";
import { FiClock, FiUsers, FiUserX } from "react-icons/fi";
import { VotersDialog } from "./VotersDialog";
import { WhatsAppPollCard } from "./WhatsAppPollCard";
import { LoaderFive } from "@/src/components/ui/loader";
import { usePolls } from "@/src/hooks/poll/usePolls";
import { useActiveSeason } from "@/src/hooks/season/useActiveSeason";

export interface PollVotingInterfaceProps {
  readOnly?: boolean;
  showAdminActions?: boolean;
  showViewAllVotes?: boolean;
  title?: string;
  description?: string;
}

const PollVotingInterface: React.FC<PollVotingInterfaceProps> = ({
  readOnly = false,
  showAdminActions = false,
  showViewAllVotes = false,
  title = "Tournament Polls",
  description = "Vote on active tournament polls",
}) => {
  const { user: user } = useAuth();
  const isPlayer = user?.role === "PLAYER";
  const { data: polls, isFetching: loading, refetch, error } = usePolls();
  const [userVotes, setUserVotes] = useState<Record<string, PollVote>>({});
  const [voteCounts, setVoteCounts] = useState<
    Record<string, Record<string, number>>
  >({});
  const [allVotes, setAllVotes] = useState<Record<string, PollVote[]>>({});

  const [optimisticVoteCounts, setOptimisticVoteCounts] = useState<
    Record<string, Record<string, number>>
  >({});
  const [optimisticAllVotes, setOptimisticAllVotes] = useState<
    Record<string, PollVote[]>
  >({});
  const [showVotersDialog, setShowVotersDialog] = useState<{
    isOpen: boolean;
    pollId: string;
    pollQuestion: string;
    option: string;
  }>({
    isOpen: false,
    pollId: "",
    pollQuestion: "",
    option: "",
  });

  // Loading state for viewing votes
  const [loadingVotesForPoll, setLoadingVotesForPoll] = useState<string | null>(
    null,
  );

  // Notifications removed

  // Get optimistic vote counts (combines real data with optimistic updates)
  const getOptimisticVoteCounts = useCallback(
    (pollId: string) => {
      const realCounts = voteCounts[pollId] || {};
      const optimisticCounts = optimisticVoteCounts[pollId];
      return optimisticCounts || realCounts;
    },
    [voteCounts, optimisticVoteCounts],
  );

  // Get optimistic all votes (combines real data with optimistic updates)
  const getOptimisticAllVotes = useCallback(
    (pollId: string) => {
      const realVotes = allVotes[pollId] || [];
      const optimisticVotes = optimisticAllVotes[pollId];
      return optimisticVotes || realVotes;
    },
    [allVotes, optimisticAllVotes],
  );

  // Handle vote selection with validation - now allows switching votes

  // Show voters dialog
  const showVoters = useCallback(
    (pollId: string, pollQuestion: string, option: string) => {
      // Set loading state for this poll
      setLoadingVotesForPoll(pollId);

      // Small delay to show loading state, then open dialog
      setTimeout(() => {
        setShowVotersDialog({
          isOpen: true,
          pollId,
          pollQuestion,
          option,
        });
        setLoadingVotesForPoll(null);
      }, 300);
    },
    [],
  );

  // Close voters dialog
  const closeVotersDialog = useCallback(() => {
    setShowVotersDialog({
      isOpen: false,
      pollId: "",
      pollQuestion: "",
      option: "",
    });
  }, []);

  // Sort polls ascending (oldest first) for player view

  // Render content based on state - all hooks must be called before any returns
  const renderContent = () => {
    // Only require player login for voting, not for viewing
    if (!isPlayer && !showViewAllVotes && !showAdminActions) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <FiUsers className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Player Login Required
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Please log in as a player to participate in tournament voting.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (loading) {
      return (
        <div className="min-h-[400px] bg-background flex items-center justify-center">
          <LoaderFive text="Loading Polls..." />
        </div>
      );
    }

    if (error) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg
                className="h-12 w-12 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Failed to Load Polls
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {error.message}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (polls?.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[200px] w-full">
          <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm p-6 max-w-sm w-full transition-all duration-300 hover:shadow-md">
            <div className="flex flex-col items-center text-center">
              <FiClock className="h-10 w-10 text-gray-500 dark:text-gray-400 mb-3 animate-pulse" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                No Active Polls
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Sa check next tournament.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 flex-shrink-0 ml-2">
            <FiUsers className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">{polls?.length} Active</span>
            <span className="sm:hidden">{polls?.length}</span>
          </Badge>
        </div>

        {/* Banned Player Warning */}
        {user?.player?.isBanned && !showAdminActions && <BanBanner />}

        <div className="space-y-4">
          {polls?.map((poll) => (
            <WhatsAppPollCard
              key={poll.id}
              poll={poll}
              userVote={userVotes[poll.id]}
              isDisabled={
                Boolean(readOnly) || !user || Boolean(user?.player?.isBanned)
              }
              readOnly={readOnly}
              showViewAllVotes={showViewAllVotes}
              showAvatars={false} // Disable avatars for performance
              showAdminActions={showAdminActions}
              voteCounts={getOptimisticVoteCounts(poll.id)}
              allVotes={getOptimisticAllVotes(poll.id)}
              onShowVoters={showVoters}
              isLoadingVotes={loadingVotesForPoll === poll.id}
            />
          ))}
        </div>

        {/* Voters Dialog */}
        <VotersDialog
          isOpen={showVotersDialog.isOpen}
          onClose={closeVotersDialog}
          pollId={showVotersDialog.pollId}
          pollQuestion={showVotersDialog.pollQuestion}
          option={showVotersDialog.option}
          allVotes={getOptimisticAllVotes(showVotersDialog.pollId)}
          voteCounts={getOptimisticVoteCounts(showVotersDialog.pollId)}
        />
      </div>
    );
  };

  return renderContent();
};

export default PollVotingInterface;

const BanBanner = () => {
  const { user: auth } = useAuth();
  const { data: activeSeason } = useActiveSeason();
  const { data: tournaments } = useTournaments({
    seasonId: activeSeason?.id,
  });
  const user = auth?.player;

  return (
    <Card className="border-red-300 bg-red-50/80 shadow-sm shadow-red-200/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <FiUserX className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 mb-1">
              You are currently banned from voting
            </h3>
            <p className="text-sm text-red-700 mb-2">
              <strong>Reason:</strong> {user?.banReason}
            </p>
            <p className="text-sm text-red-700 mb-2">
              <strong>Duration:</strong> {user?.banDuration} tournaments
            </p>
            <p className="text-sm text-red-700 mb-2">
              <strong>Remaining:</strong>{" "}
              {(() => {
                const banInfo = calculateRemainingBanDuration(
                  {
                    isBanned: user?.isBanned,
                    banDuration: user?.banDuration,
                    bannedAt: user?.bannedAt?.toString(),
                  },
                  tournaments || [],
                );
                if (banInfo.isExpired) {
                  return (
                    <span className="text-green-600 font-medium">
                      Ban has expired
                    </span>
                  );
                }
                return formatRemainingBanDuration(
                  banInfo.remainingDuration || 0,
                );
              })()}
            </p>
            {user?.bannedAt && (
              <p className="text-sm text-red-700">
                <strong>Banned on:</strong>{" "}
                {new Date(user?.bannedAt).toLocaleDateString()}
              </p>
            )}
            <p className="text-xs text-red-600 mt-2 italic">
              You can view polls but cannot vote until your ban is lifted.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
