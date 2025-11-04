"use client";

import { useAuth } from "@/src/hooks/context/auth/useAuth";

const TournamentWinnersContent = () => {
  const { user: playerUser } = useAuth();
  const role = playerUser?.role;
  // Winners and Claim tabs: Only Firebase admins without linked players have admin privileges
  // Teams_admin with linked players are treated as regular players for these tabs
  const isWinnersClaimAdmin =
    (role === "ADMIN" || role === "SUPER_ADMIN") && !playerUser; // Only if they don't have a linked player (not logged in as player)

  return <div>winnder tab</div>;
  // <WinnersTab readOnly={!isWinnersClaimAdmin} />;
};

export default TournamentWinnersContent;
