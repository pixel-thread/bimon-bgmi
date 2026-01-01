"use client";

import React from "react";
import PollVotingInterface from "./PollVotingInterface";
import { VoteTabProps } from "./types";
import { NotificationPromptBanner } from "@/src/components/common/NotificationPromptBanner";

const VoteTabComponent: React.FC<VoteTabProps> = ({ readOnly = false }) => {
  return (
    <div>
      <NotificationPromptBanner />
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

