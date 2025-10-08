"use client";

import { RevealTab } from "@/src/components/RevealTab";
import { useAuth } from "@/src/hooks/useAuth";

const TournamentWheelContent = () => {
  const { user: playerUser } = useAuth();
  const role = playerUser?.role || "PLAYER";
  // Winners and Claim tabs: Only Firebase admins without linked players have admin privileges
  // Teams_admin with linked players are treated as regular players for these tabs
  const isWinnersClaimAdmin =
    (role === "ADMIN" || role === "SUPER_ADMIN") && !playerUser; // Only if they don't have a linked player (not logged in as player)

  return <RevealTab readOnly={!isWinnersClaimAdmin} hideSelectors={true} />;
};

export default TournamentWheelContent;
