"use client";

import React from "react";
import PollVotingInterface from "./PollVotingInterface";
import { VoteTabProps } from "./types";

const VoteTabComponent: React.FC<VoteTabProps> = ({ readOnly = false }) => {
  return (
    <PollVotingInterface
      readOnly={readOnly}
      showAdminActions={false}
      showViewAllVotes={true}
      title="Tournament Polls"
      description="Vote on active tournament polls"
    />
  );
};

export const VoteTab = React.memo(VoteTabComponent);

VoteTab.displayName = "VoteTab";
