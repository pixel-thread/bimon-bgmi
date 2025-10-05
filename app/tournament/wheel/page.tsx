"use client";

import { Gift } from "lucide-react";
import { RevealTab } from "@/components/RevealTab";
import { useAuth } from "@/hooks/useAuth";
import { TournamentLayoutContent } from "@/components/TournamentLayoutContent";

const TournamentWheelContent = () => {
  const { playerUser, authType, role } = useAuth();

  // Winners and Claim tabs: Only Firebase admins without linked players have admin privileges
  // Teams_admin with linked players are treated as regular players for these tabs
  const isWinnersClaimAdmin =
    authType === "firebase" &&
    (role === "teams_admin" || role === "super_admin") &&
    !playerUser; // Only if they don't have a linked player (not logged in as player)

  return (
    <TournamentLayoutContent 
      title="Claim" 
      description="Claim your prize if you're a winner!"
      icon={Gift}
    >
      <RevealTab readOnly={!isWinnersClaimAdmin} hideSelectors={true} />
    </TournamentLayoutContent>
  );
};

export default TournamentWheelContent;
