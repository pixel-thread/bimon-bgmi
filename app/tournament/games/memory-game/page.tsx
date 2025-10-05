"use client";

import { useAuth } from "@/hooks/useAuth";
import { PlayerAuthGuard } from "@/components/AuthGuard";
import { TournamentLoader } from "@/components/TournamentLoader";
import MemoryGame from "@/components/games/memory-game/MemoryGame";

const MemoryGameContent = () => {
  const { isLoading } = useAuth();

  // Show loading state while auth is being checked
  if (isLoading) {
    return <TournamentLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <MemoryGame />
    </div>
  );
};

const MemoryGamePage = () => {
  return (
    <PlayerAuthGuard>
      <MemoryGameContent />
    </PlayerAuthGuard>
  );
};

export default MemoryGamePage;
