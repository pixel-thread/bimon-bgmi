"use client";

import { FiBarChart } from "react-icons/fi";
import { VoteTab } from "@/components/vote";
import { TournamentLayoutContent } from "@/components/TournamentLayoutContent";

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
