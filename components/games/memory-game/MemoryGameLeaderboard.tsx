import React, { useEffect, useState } from "react";
import { gameScoreService } from "@/lib/gameScoreService";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardProps {
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ScoreEntry {
  playerName: string;
  score: number;
  timestamp?: Date;
  moves?: number;
  time?: number;
}

export const MemoryGameLeaderboard: React.FC<LeaderboardProps> = ({
  gameId,
  isOpen,
  onClose,
}) => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadScores = async () => {
      if (!isOpen) return;

      setIsLoading(true);
      try {
        const leaderboard = await gameScoreService.getLeaderboard(gameId, 10);
        setScores(leaderboard);
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScores();
  }, [gameId, isOpen]);

  const getMedal = (index: number) => {
    if (index === 0) {
      return (
        <div className="w-6 h-6 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg border-2 border-yellow-800 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-900">1</span>
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="w-6 h-6 bg-gradient-to-b from-gray-300 to-gray-500 rounded-lg border-2 border-gray-700 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-900">2</span>
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="w-6 h-6 bg-gradient-to-b from-amber-600 to-amber-800 rounded-lg border-2 border-amber-900 flex items-center justify-center">
          <span className="text-xs font-bold text-white">3</span>
        </div>
      );
    }
    return (
      <div className="w-6 h-6 bg-gradient-to-b from-gray-600 to-gray-800 rounded-lg border-2 border-gray-900 flex items-center justify-center">
        <span className="text-xs font-bold text-white">{index + 1}</span>
      </div>
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          className="bg-gradient-to-b from-purple-600 to-blue-800 dark:from-purple-800 dark:to-blue-900 border-4 border-purple-400 dark:border-purple-300 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
          initial={{ y: 20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6 relative">
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center text-sm font-bold transition-colors shadow-lg"
              aria-label="Close leaderboard"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-white mb-2">
              🧠 MEMORY GAME 🧠
            </h2>
            <p className="text-purple-200 text-sm">TOP SCORES</p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-transparent rounded-full mb-4"></div>
              <p className="text-white text-sm">Loading scores...</p>
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-purple-200 text-lg font-semibold mb-2">
                No Scores Yet!
              </p>
              <p className="text-white text-sm">
                Be the first to play and set a record!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scores.map((entry, index) => (
                <div
                  key={`${entry.playerName}-${index}`}
                  className="flex items-center justify-between bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-purple-300/30 dark:border-purple-400/30 rounded-lg p-4 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    {getMedal(index)}
                    <div>
                      <span className="font-semibold text-white text-sm block">
                        {entry.playerName || "Anonymous"}
                      </span>
                      {entry.moves && entry.time && (
                        <span className="text-xs text-purple-200">
                          {entry.moves} moves • {formatTime(entry.time)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-yellow-300 text-lg">
                      {entry.score}
                    </span>
                    <div className="text-xs text-purple-200">pts</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-purple-300/30 dark:border-purple-400/30">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">🎯</span>
              <p className="text-sm text-purple-200 text-center">
                Match pairs to climb the ranks!
              </p>
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
    </AnimatePresence>
  );
};
