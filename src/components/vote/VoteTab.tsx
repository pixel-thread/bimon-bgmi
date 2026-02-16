"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import PollVotingInterface from "./PollVotingInterface";
import { VoteTabProps } from "./types";
import { NotificationPromptBanner } from "@/src/components/common/NotificationPromptBanner";
import { JobBoardBanner } from "./JobBoardBanner";
import { MeritRatingModal } from "./MeritRatingModal";
import { PollCardSkeleton } from "./PollCardSkeleton";
import { BirthdayGiftModal, hasBirthdayPromptResponse, shouldShowBirthdayPublicly } from "./BirthdayGiftModal";
import { usePolls } from "@/src/hooks/poll/usePolls";
import { useAuth as useAuthContext } from "@/src/hooks/context/auth/useAuth";
import { BirthdayBanner } from "./BirthdayBanner";
import { useRoyalPass } from "@/src/hooks/royal-pass/useRoyalPass";

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
  const { user } = useAuthContext();
  const { pendingWinner, pendingSoloSupport, pendingReferralBonus, streak } = useRoyalPass();

  // Hide rating modal when any claim modal is active to prevent accidental star presses
  const hasActiveClaimModal = !!(pendingWinner || pendingSoloSupport || pendingReferralBonus || streak.pendingReward);

  // Birthday modal state
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [birthdayShareChoice, setBirthdayShareChoice] = useState<"share" | "private" | null>(null);

  // Get birthday info from polls hook
  const { isBirthdayPlayer, userDateOfBirth, data: polls } = usePolls({});
  const activePollId = polls?.[0]?.id || "";
  const entryFee = polls?.[0]?.tournament?.fee || 0;

  // Check if user has already responded to birthday prompt
  useEffect(() => {
    if (isBirthdayPlayer && activePollId) {
      const existingResponse = hasBirthdayPromptResponse(activePollId);
      if (existingResponse) {
        setBirthdayShareChoice(existingResponse.response);
      } else {
        // Show birthday modal if no response yet
        setShowBirthdayModal(true);
      }
    }
  }, [isBirthdayPlayer, activePollId]);

  const hasPendingRatings = meritData?.pendingRatings && meritData.pendingRatings.length > 0;

  const fetchMeritData = useCallback(async () => {
    if (!isSignedIn) {
      setIsLoadingMerit(false);
      return;
    }

    try {
      const token = await getToken({ template: "jwt" });
      if (!token) {
        setIsLoadingMerit(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`/api/player/merit`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const response = await res.json();
        const data = response.data;
        setMeritData(data);

        if (data?.pendingRatings?.length > 0 && data?.tournament) {
          setShowRatingModal(true);
          setTimeout(() => setShowPollsBehindModal(true), 1000);
        }
      }
    } catch (error) {
      // Silently handle timeout/abort errors
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Failed to fetch merit data:", error);
      }
    } finally {
      setIsLoadingMerit(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    fetchMeritData();
  }, [fetchMeritData]);

  const handleRatingComplete = () => {
    setShowRatingModal(false);
    setShowPollsBehindModal(false);
    setMeritData((prev) => prev ? { ...prev, pendingRatings: [] } : null);
  };

  const handleBirthdayShare = () => {
    setBirthdayShareChoice("share");
    setShowBirthdayModal(false);
  };

  const handleBirthdayPrivate = () => {
    setBirthdayShareChoice("private");
    setShowBirthdayModal(false);
  };

  const handleBirthdayClose = () => {
    // Just close modal without saving - will ask again next time
    setShowBirthdayModal(false);
  };

  const shouldShowSkeleton = isSignedIn && (isLoadingMerit || (hasPendingRatings && !showPollsBehindModal));
  const shouldShowPolls = !isSignedIn || !hasPendingRatings || showPollsBehindModal;

  // Determine if we should show birthday banner instead of job board banner
  const showBirthdayBanner = isBirthdayPlayer && birthdayShareChoice === "share";

  return (
    <div className="min-h-[calc(100vh-200px)]">
      {/* Birthday Gift Modal - shows on load if birthday player */}
      {showBirthdayModal && userDateOfBirth && (
        <BirthdayGiftModal
          isOpen={showBirthdayModal}
          dateOfBirth={userDateOfBirth}
          playerName={user?.displayName || user?.userName || "Player"}
          pollId={activePollId}
          entryFee={entryFee}
          onShare={handleBirthdayShare}
          onPrivate={handleBirthdayPrivate}
          onClose={handleBirthdayClose}
        />
      )}

      {showRatingModal && !hasActiveClaimModal && meritData?.pendingRatings && meritData.tournament && (
        <MeritRatingModal
          pendingRatings={meritData.pendingRatings}
          tournamentId={meritData.tournament.id}
          tournamentName={meritData.tournament.name}
          onComplete={handleRatingComplete}
        />
      )}

      {shouldShowSkeleton && (
        <div className="space-y-4 px-4 py-4">
          <PollCardSkeleton />
          <PollCardSkeleton />
        </div>
      )}

      {shouldShowPolls && !shouldShowSkeleton && (
        <>
          <NotificationPromptBanner />
          <PollVotingInterface
            readOnly={readOnly}
            showAdminActions={false}
            showViewAllVotes={true}
            title="Tournament Polls"
            description="Vote on active tournament polls"
            forcePublic={true}
          />
          {/* Banners below polls to prevent layout shift from skeleton → full height */}
          <div className="mt-6">
            {showBirthdayBanner ? (
              <BirthdayBanner
                dateOfBirth={userDateOfBirth!}
                playerName={user?.displayName || user?.userName || "Player"}
              />
            ) : (
              <JobBoardBanner />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const VoteTab = React.memo(VoteTabComponent);

VoteTab.displayName = "VoteTab";
