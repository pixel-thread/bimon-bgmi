"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { TournamentLayoutContent } from "@/src/components/TournamentLayoutContent";
import { PlayersTab } from "@/src/components/players";

const TournamentPlayersContent = () => {
  const { playerUser, authType, role } = useAuth();

  // Winners and Claim tabs: Only Firebase admins without linked players have admin privileges
  // Teams_admin with linked players are treated as regular players for these tabs
  const isWinnersClaimAdmin =
    authType === "firebase" &&
    (role === "teams_admin" || role === "super_admin") &&
    !playerUser; // Only if they don't have a linked player (not logged in as player)

  return (
    <TournamentLayoutContent
      title="Balance"
      description="Browse all tournament players and their balances."
    >
      <PlayersTab readOnly={!isWinnersClaimAdmin} hideCsvExport={true} />
    </TournamentLayoutContent>
  );
};

export default TournamentPlayersContent;
