"use client";

import { FiAward } from "react-icons/fi";
import { WinnersTab } from "@/src/components/WinnersTab";
import { useAuth } from "@/src/hooks/useAuth";
import { TournamentLayoutContent } from "@/src/components/TournamentLayoutContent";

const TournamentWinnersContent = () => {
  const { playerUser, authType, role } = useAuth();

  // Winners and Claim tabs: Only Firebase admins without linked players have admin privileges
  // Teams_admin with linked players are treated as regular players for these tabs
  const isWinnersClaimAdmin =
    authType === "firebase" &&
    (role === "teams_admin" || role === "super_admin") &&
    !playerUser; // Only if they don't have a linked player (not logged in as player)

  return (
    <TournamentLayoutContent
      title="Winners"
      description="View tournament winners and results."
      icon={FiAward}
    >
      <WinnersTab readOnly={!isWinnersClaimAdmin} />
    </TournamentLayoutContent>
  );
};

export default TournamentWinnersContent;
