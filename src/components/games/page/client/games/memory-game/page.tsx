"use client";

import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { TournamentLoader } from "@/src/components/tournaments/TournamentLoader";
import MemoryGame from "@/src/components/games/memory-game/MemoryGame";

const MemoryGameContent = () => {
  const { isAuthLoading: isLoading } = useAuth();

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
  return <MemoryGameContent />;
};

export default MemoryGamePage;
