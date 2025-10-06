"use client";

import { FiFileText } from "react-icons/fi";
// import { RulesTab } from "@/src/components/rules";
import { useAuth } from "@/src/hooks/useAuth";
import { TournamentLayoutContent } from "@/src/components/TournamentLayoutContent";
import { RulesTab } from "@/src/components/RulesTab";

const TournamentRulesContent = () => {
  const { playerUser, authType, role } = useAuth();

  // Winners and Claim tabs: Only Firebase admins without linked players have admin privileges
  // Teams_admin with linked players are treated as regular players for these tabs
  const isWinnersClaimAdmin =
    authType === "firebase" &&
    (role === "teams_admin" || role === "super_admin") &&
    !playerUser; // Only if they don't have a linked player (not logged in as player)

  return (
    <TournamentLayoutContent
      title="Rules"
      description="View tournament rules and regulations."
      icon={FiFileText}
    >
      <RulesTab readOnly={!isWinnersClaimAdmin} />
    </TournamentLayoutContent>
  );
};

export default TournamentRulesContent;
