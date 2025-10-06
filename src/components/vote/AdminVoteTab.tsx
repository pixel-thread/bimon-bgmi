"use client";

import React from "react";
import PollVotingInterface from "./PollVotingInterface";
import { Poll } from "@/src/lib/types";

interface AdminVoteTabProps {
  onEditPoll?: (poll: Poll) => void;
  onDeletePoll?: (poll: Poll) => void;
  onTogglePollStatus?: (poll: Poll) => void;
}

const AdminVoteTab: React.FC<AdminVoteTabProps> = ({
  onEditPoll,
  onDeletePoll,
  onTogglePollStatus,
}) => {
  return (
    <PollVotingInterface
      readOnly={false}
      showAdminActions={true}
      showViewAllVotes={true}
      onEditPoll={onEditPoll}
      onDeletePoll={onDeletePoll}
      onTogglePollStatus={onTogglePollStatus}
      title="Poll Management"
      description="Manage tournament polls and view voting results"
    />
  );
};

export default AdminVoteTab;
