import React, { useEffect, useState } from "react";
import { gameScoreService } from "@/lib/gameScoreService";
import { motion } from "framer-motion";
import Image from "next/image";

interface LeaderboardProps {
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ScoreEntry {
  playerName: string;
  score: number;
  timestamp?: Date;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
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
        <div className="w-6 h-6 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-none border-2 border-yellow-800 flex items-center justify-center">
          <span className="text-xs font-pixel text-gray-900">1</span>
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="w-6 h-6 bg-gradient-to-b from-gray-300 to-gray-500 rounded-none border-2 border-gray-700 flex items-center justify-center">
          <span className="text-xs font-pixel text-gray-900">2</span>
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="w-6 h-6 bg-gradient-to-b from-amber-600 to-amber-800 rounded-none border-2 border-amber-900 flex items-center justify-center">
          <span className="text-xs font-pixel text-white">3</span>
        </div>
      );
    }
    return (
      <div className="w-6 h-6 bg-gradient-to-b from-gray-600 to-gray-800 rounded-none border-2 border-gray-900 flex items-center justify-center">
        <span className="text-xs font-pixel text-white">{index + 1}</span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 touch-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => {
        // Close if clicking the backdrop
        if (e.target === e.currentTarget) {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <motion.div
        className="bg-gradient-to-b from-blue-600 to-blue-800 border-4 border-yellow-400 rounded-none shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
        initial={{ y: 20, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className="p-6 relative overflow-hidden">
          {/* Header with Flappy Bird styling */}
          <div className="relative mb-6">
            {/* Decorative pipes - full height */}
            <div className="absolute -top-6 -left-3 w-10 h-full">
              <Image
                src="/images/games/flappy-bird/flappybird-pipe.png"
                alt="Pipe"
                fill
                className="opacity-30"
                style={{ 
                  objectFit: 'fill',
                  imageRendering: 'pixelated'
                }}
              />
            </div>
            <div className="absolute -top-6 -right-3 w-10 h-full">
              <Image
                src="/images/games/flappy-bird/flappybird-pipe.png"
                alt="Pipe"
                fill
                className="opacity-30 transform rotate-180"
                style={{ 
                  objectFit: 'fill',
                  imageRendering: 'pixelated'
                }}
              />
            </div>
            
            {/* Close button positioned absolutely in top-right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClose();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClose();
              }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-b from-red-500 to-red-700 text-white font-pixel text-xs rounded-none border-2 border-red-800 hover:from-red-400 hover:to-red-600 transition-all duration-200 transform hover:scale-110 touch-manipulation select-none z-10 flex items-center justify-center retro-shadow"
              style={{ touchAction: 'manipulation' }}
              aria-label="Close leaderboard"
            >
              X
            </button>
            
            {/* Centered title */}
            <div className="text-center">
              <h2 className="text-2xl font-pixel text-yellow-400 retro-shadow">
                🏆 LEADERBOARD 🏆
              </h2>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative">
                <Image
                  src="/images/games/flappy-bird/flappy-bird2.png"
                  alt="Loading bird"
                  width={40}
                  height={30}
                  className="animate-bounce"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
              <p className="text-white font-pixel text-xs mt-4 retro-shadow">
                LOADING...
              </p>
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-8">
              <Image
                src="/images/games/flappy-bird/flappy-bird2.png"
                alt="Sad bird"
                width={60}
                height={45}
                className="mx-auto mb-4 opacity-50"
                style={{ imageRendering: "pixelated" }}
              />
              <p className="text-yellow-300 font-pixel text-xs retro-shadow">
                NO SCORES YET!
              </p>
              <p className="text-white font-pixel text-xs mt-2 retro-shadow">
                BE THE FIRST TO PLAY!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((entry, index) => (
                <div
                  key={`${entry.playerName}-${index}`}
                  className="flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-700 border-2 border-gray-600 rounded-none p-3 hover:from-gray-700 hover:to-gray-600 transition-all duration-200 transform hover:scale-[1.02]"
                  style={{
                    backgroundImage: index < 3 ? `linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)` : 'none',
                    backgroundSize: index < 3 ? '8px 8px' : 'auto',
                  }}
                >
                  <div className="flex items-center space-x-3">
                    {getMedal(index)}
                    <span className="font-pixel text-white text-xs retro-shadow">
                      {entry.playerName || "ANONYMOUS"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-pixel text-yellow-400 text-sm retro-shadow">
                      {entry.score}
                    </span>
                    {index < 3 && (
                      <Image
                        src="/images/games/flappy-bird/flappy-bird2.png"
                        alt="Top player bird"
                        width={20}
                        height={15}
                        style={{ imageRendering: "pixelated" }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t-2 border-yellow-400 border-dashed">
            <div className="flex items-center justify-center space-x-2">
              <Image
                src="/images/games/flappy-bird/flappy-bird2.png"
                alt="Motivational bird"
                width={24}
                height={18}
                style={{ imageRendering: "pixelated" }}
              />
              <p className="text-xs font-pixel text-yellow-300 retro-shadow text-center">
                PLAY MORE TO CLIMB!
              </p>
              <Image
                src="/images/games/flappy-bird/flappy-bird2.png"
                alt="Motivational bird"
                width={24}
                height={18}
                className="transform scale-x-[-1]"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
