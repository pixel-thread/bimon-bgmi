"use client";

import { PlayersTab } from "@/src/components/players";

const TournamentPlayersContent = () => {
  return <PlayersTab readOnly={false} hideCsvExport={true} />;
};

export default TournamentPlayersContent;
