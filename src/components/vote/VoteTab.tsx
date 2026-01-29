"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import PollVotingInterface from "./PollVotingInterface";
import { VoteTabProps } from "./types";
import { NotificationPromptBanner } from "@/src/components/common/NotificationPromptBanner";
import { JobBoardBanner } from "./JobBoardBanner";
import { MeritRatingModal } from "./MeritRatingModal";
import { PollCardSkeleton } from "./PollCardSkeleton";

interface PendingRating {
  playerId: string;
  displayName: string;
}

interface MeritData {
  pendingRatings: PendingRating[];
  tournament: { id: string; name: string } | null;
}

const VoteTabComponent: React.FC<VoteTabProps> = ({ readOnly = false }) => {
  const [meritData, setMeritData] = useState<MeritData | null>(null);
  const [isLoadingMerit, setIsLoadingMerit] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showPollsBehindModal, setShowPollsBehindModal] = useState(false);
  const { getToken, isSignedIn } = useAuth();

  // Check if user has pending ratings that block voting
  const hasPendingRatings = meritData?.pendingRatings && meritData.pendingRatings.length > 0;

  useEffect(() => {
    if (!isSignedIn) {
      setIsLoadingMerit(false);
      return;
    }

    const fetchMeritData = async () => {
      try {
        const token = await getToken({ template: "jwt" });
        if (!token) {
          setIsLoadingMerit(false);
          return;
        }

        const res = await fetch(`/api/player/merit`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (res.ok) {
          const response = await res.json();
          const data = response.data;
          setMeritData(data);
          // Show modal if there are pending ratings
          if (data?.pendingRatings?.length > 0) {
            setShowRatingModal(true);
            // After 1 second, reveal the polls behind the modal
            setTimeout(() => {
              setShowPollsBehindModal(true);
            }, 1000);
          }
        }
      } catch (error) {
        console.error("Failed to fetch merit data:", error);
      } finally {
        setIsLoadingMerit(false);
      }
    };

    fetchMeritData();
  }, [isSignedIn, getToken]);

  const handleRatingComplete = () => {
    setShowRatingModal(false);
    setShowPollsBehindModal(false);
    setMeritData((prev) =>
      prev ? { ...prev, pendingRatings: [] } : null
    );
  };

  // Show skeleton only during initial loading, or when modal is shown but polls aren't revealed yet
  const shouldShowSkeleton = isSignedIn && (isLoadingMerit || (hasPendingRatings && !showPollsBehindModal));

  // Show polls when: not signed in, no pending ratings, OR polls revealed behind modal
  const shouldShowPolls = !isSignedIn || !hasPendingRatings || showPollsBehindModal;

  return (
    <div className="min-h-[calc(100vh-200px)]">
      {/* Merit Rating Modal - shows when pending ratings exist */}
      {showRatingModal && meritData?.pendingRatings && meritData.tournament && (
        <MeritRatingModal
          pendingRatings={meritData.pendingRatings}
          tournamentId={meritData.tournament.id}
          tournamentName={meritData.tournament.name}
          onComplete={handleRatingComplete}
        />
      )}

      {/* Show skeleton while loading or before polls are revealed */}
      {shouldShowSkeleton && (
        <div className="space-y-4 px-4 py-4">
          <PollCardSkeleton />
          <PollCardSkeleton />
        </div>
      )}

      {/* Show actual polls - either normally or behind the modal */}
      {shouldShowPolls && !shouldShowSkeleton && (
        <>
          <NotificationPromptBanner />
          <JobBoardBanner />
          <PollVotingInterface
            readOnly={readOnly}
            showAdminActions={false}
            showViewAllVotes={true}
            title="Tournament Polls"
            description="Vote on active tournament polls"
            forcePublic={true}
          />
        </>
      )}
    </div>
  );
};

export const VoteTab = React.memo(VoteTabComponent);

VoteTab.displayName = "VoteTab";

