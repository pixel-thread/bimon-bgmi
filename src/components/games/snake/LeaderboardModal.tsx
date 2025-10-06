"use client";

import { useEffect, useState } from "react";
import { gameScoreService } from "@/src/lib/gameScoreService";

interface ScoreEntry {
  playerName: string;
  score: number;
  timestamp?: Date;
}

export default function LeaderboardModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadScores = async () => {
      if (!isOpen) return;

      setIsLoading(true);
      try {
        const leaderboard = await gameScoreService.getLeaderboard(
          "snake-game",
          10
        );
        setScores(leaderboard);
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
        setScores([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadScores();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 overflow-hidden">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* glass panel */}
      <div className="relative w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl max-h-[70vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-2xl font-bold">Leaderboard</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <p className="text-white/60 text-center">Loading leaderboard...</p>
        ) : scores.length === 0 ? (
          <p className="text-white/60 text-center">
            No scores yet. Be the first!
          </p>
        ) : (
          <ul className="space-y-2">
            {scores.map((entry, idx) => (
              <li
                key={`${entry.playerName}-${idx}`}
                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                  idx === 0
                    ? "bg-yellow-500/20 border border-yellow-400/50"
                    : "bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-white/70 font-semibold w-6">
                    #{idx + 1}
                  </span>
                  <span className="text-white font-medium">
                    {entry.playerName || "Anonymous"}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">{entry.score}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
