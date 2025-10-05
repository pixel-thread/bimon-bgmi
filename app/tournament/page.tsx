"use client";

import TeamManagement from "@/components/TeamManagement";
import { useAuth } from "@/hooks/useAuth";
import { TournamentLayoutContent } from "@/components/TournamentLayoutContent";

const TournamentPageContent = () => {
  const { playerUser, authType, role } = useAuth();

  // Admin capabilities for different tabs:
  // Position tab: All admin types have admin privileges
  const isPositionAdmin =
    playerUser?.linkedRole === "teams_admin" ||
    (authType === "firebase" &&
      (role === "teams_admin" || role === "super_admin"));

  return (
    <TournamentLayoutContent 
      title="Positions" 
      description="View all tournament teams and their standings."
    >
      <TeamManagement readOnly={!isPositionAdmin} />
    </TournamentLayoutContent>
  );
};

export default TournamentPageContent;
