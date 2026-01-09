"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { useTournaments } from "@/src/hooks/tournament/useTournaments";
import {
  calculateRemainingBanDuration,
  formatRemainingBanDuration,
} from "@/src/utils/banUtils";
import { FiClock, FiUsers, FiUserX } from "react-icons/fi";
import { VotersDialog } from "./VotersDialog";
import { WhatsAppPollCard } from "./WhatsAppPollCard";
import { LoaderFive } from "@/src/components/ui/loader";
import { PollCardSkeleton } from "./PollCardSkeleton";
import { Skeleton } from "../ui/skeleton";
import { usePolls } from "@/src/hooks/poll/usePolls";
import { PollT } from "@/src/types/poll";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { useSearchParams } from "next/navigation";

export interface PollVotingInterfaceProps {
  readOnly?: boolean;
  showAdminActions?: boolean;
  showViewAllVotes?: boolean;
  title?: string;
  description?: string;
  forcePublic?: boolean;
}

const PollVotingInterface: React.FC<PollVotingInterfaceProps> = ({
  showAdminActions = true,
  showViewAllVotes = true,
  title = "Tournament Polls",
  description = "Vote on active tournament polls",
  forcePublic = false,
}) => {
  const { user: user } = useAuth();

  const isPlayer = user?.role === "PLAYER";
  const searchQuery = useSearchParams();
  const pollId = searchQuery.get("view") || "";
  const { data: polls, isFetching: loading, isError, refetch } = usePolls({ forcePublic });

  const [showVotersDialog, setShowVotersDialog] = useState<PollT | null>(null);
  const [refetchingPollId, setRefetchingPollId] = useState<string | null>(null);

  // Show voters dialog
  const showVoters = useCallback((poll: PollT) => {
    setShowVotersDialog(poll);
  }, []);

  // Handle per-poll refetch
  const handlePollRefetch = useCallback(async (id: string) => {
    setRefetchingPollId(id);
    await refetch();
    setRefetchingPollId(null);
  }, [refetch]);

  // Render content based on state - all hooks must be called before any returns
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
      <div className="space-y-4">
        <PollCardSkeleton />
        <PollCardSkeleton />
      </div>
    );
  }

  // Error state - API failed
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[200px] w-full">
        <div className="bg-white dark:bg-black border border-red-200 dark:border-red-800 rounded-lg shadow-sm p-6 max-w-sm w-full transition-all duration-300">
          <div className="flex flex-col items-center text-center">
            <FiClock className="h-10 w-10 text-red-500 dark:text-red-400 mb-3" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Failed to Load Polls
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              Something went wrong. Please try again.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!polls?.length) {
    return (
      <div className="flex items-center justify-center py-12 w-full">
        <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm p-6 max-w-sm w-full transition-all duration-300 hover:shadow-md">
          <div className="flex flex-col items-center text-center">
            <FiClock className="h-10 w-10 text-gray-500 dark:text-gray-400 mb-3 animate-pulse" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              No Active Polls
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              Please refresh later or check back soon.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Poll Count - only show if more than 1 poll */}
      {polls && polls.length > 1 && (
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              {polls?.length}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</span>
              <span className="text-sm font-semibold text-foreground">Polls</span>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <span className="text-xs text-muted-foreground">Vote below</span>
        </div>
      )}



      <div className="space-y-4">
        {polls?.map((poll) => (
          <WhatsAppPollCard
            key={poll.id}
            poll={poll}
            onShowVoters={showVoters}
            readOnly={false}
            isRefetching={refetchingPollId === poll.id}
            onRefetch={() => handlePollRefetch(poll.id)}
          />
        ))}
      </div>
      {/* Voters Dialog */}
      <VotersDialog
        isOpen={!!showVotersDialog}
        id={showVotersDialog?.id || ""}
        onClose={() => setShowVotersDialog(null)}
        poll={showVotersDialog}
      />
    </div>
  );
};

export default PollVotingInterface;

const BanBanner = () => {
  const { user: auth } = useAuth();
  const { data: tournaments } = useTournaments();
  const user = auth?.player;
  const banned = user?.playerBanned;
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
              <strong>Reason:</strong> {banned?.banReason}
            </p>
            <p className="text-sm text-red-700 mb-2">
              <strong>Duration:</strong> {banned?.banDuration} tournaments
            </p>
            <p className="text-sm text-red-700 mb-2">
              <strong>Remaining:</strong>{" "}
              {(() => {
                const banInfo = calculateRemainingBanDuration(
                  {
                    isBanned: user?.isBanned,
                    banDuration: banned?.banDuration,
                    bannedAt: banned?.bannedAt?.toString(),
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
            {banned?.bannedAt && (
              <p className="text-sm text-red-700">
                <strong>Banned on:</strong>{" "}
                {new Date(banned?.bannedAt).toLocaleDateString()}
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
