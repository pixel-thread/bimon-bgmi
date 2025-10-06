"use client";

import { FiBarChart } from "react-icons/fi";
import { VoteTab } from "@/src/components/vote";
import { TournamentLayoutContent } from "@/src/components/TournamentLayoutContent";

const TournamentVoteContent = () => {
  return (
    <TournamentLayoutContent
      title="Vote"
      description="Cast your vote for tournament polls."
      icon={FiBarChart}
    >
      <VoteTab />
    </TournamentLayoutContent>
  );
};

export default TournamentVoteContent;
