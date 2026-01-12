"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import PollVotingInterface from "./PollVotingInterface";
import { VoteTabProps } from "./types";
import { NotificationPromptBanner } from "@/src/components/common/NotificationPromptBanner";
import { JobBoardBanner } from "./JobBoardBanner";
import { MeritRatingModal } from "./MeritRatingModal";

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
  const [isLoading, setIsLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    const fetchMeritData = async () => {
      try {
        const token = await getToken({ template: "jwt" });
        if (!token) {
          setIsLoading(false);
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/merit`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const response = await res.json();
          const data = response.data;
          setMeritData(data);
          // Show modal if there are pending ratings
          if (data?.pendingRatings?.length > 0) {
            setShowRatingModal(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch merit data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeritData();
  }, [isSignedIn, getToken]);

  const handleRatingComplete = () => {
    setShowRatingModal(false);
    setMeritData((prev) =>
      prev ? { ...prev, pendingRatings: [] } : null
    );
  };

  return (
    <div className="min-h-[calc(100vh-200px)]">
      {/* Merit Rating Modal - shows when pending ratings exist */}
      {showRatingModal && meritData?.pendingRatings && meritData.tournament && (
        <MeritRatingModal
          pendingRatings={meritData.pendingRatings}
          tournamentId={meritData.tournament.id}
          onComplete={handleRatingComplete}
        />
      )}

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
    </div>
  );
};

export const VoteTab = React.memo(VoteTabComponent);

VoteTab.displayName = "VoteTab";
