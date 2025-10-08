"use client";

import TeamManagement from "@/src/components/TeamManagement";
import { useAuth } from "@/src/hooks/useAuth";

const TournamentPageContent = () => {
  const { user: playerUser } = useAuth();

  return <TeamManagement readOnly={playerUser?.role === "PLAYER" || true} />;
};

export default TournamentPageContent;
