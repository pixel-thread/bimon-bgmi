"use client";

import { useState, useRef } from "react";

interface WinningWheelProps {
  participants: string[];
  onWinner: (winner: string) => void;
}

export function WinningWheel({ participants, onWinner }: WinningWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spinWheel = () => {
    if (isSpinning || participants.length === 0) return;

    setIsSpinning(true);
    setWinner(null);

    // Random spin duration between 3-5 seconds
    const spinDuration = 3000 + Math.random() * 2000;
    const randomWinner =
      participants[Math.floor(Math.random() * participants.length)];

    // Calculate rotation (multiple full rotations + random position)
    const rotations = 5 + Math.random() * 5; // 5-10 full rotations
    const finalRotation = rotations * 360;

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;
      wheelRef.current.style.transition = `transform ${spinDuration}ms cubic-bezier(0.23, 1, 0.32, 1)`;
    }

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(randomWinner);
      onWinner(randomWinner);
    }, spinDuration);
  };

  const segmentAngle = 360 / participants.length;

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative">
        {/* Wheel */}
        <div
          ref={wheelRef}
          className="relative w-80 h-80 rounded-full border-8 border-gray-800 overflow-hidden"
          style={{ transformOrigin: "center" }}
        >
          {participants.map((participant, index) => {
            const rotation = index * segmentAngle;
            const hue = (index * 360) / participants.length;

            return (
              <div
                key={participant}
                className="absolute w-full h-full flex items-center justify-center text-white font-semibold text-sm"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "center",
                  clipPath: `polygon(50% 50%, 50% 0%, ${
                    50 + 50 * Math.cos((segmentAngle * Math.PI) / 180)
                  }% ${50 - 50 * Math.sin((segmentAngle * Math.PI) / 180)}%)`,
                  backgroundColor: `hsl(${hue}, 70%, 50%)`,
                }}
              >
                <span
                  style={{
                    transform: `rotate(${
                      segmentAngle / 2
                    }deg) translateY(-120px)`,
                    transformOrigin: "center",
                  }}
                >
                  {participant}
                </span>
              </div>
            );
          })}
        </div>

        {/* Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-600"></div>
        </div>
      </div>

      {/* Controls */}
      <div className="text-center space-y-4">
        <button
          onClick={spinWheel}
          disabled={isSpinning || participants.length === 0}
          className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
            isSpinning || participants.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isSpinning ? "Spinning..." : "Spin the Wheel!"}
        </button>

        {winner && (
          <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
            <h3 className="text-lg font-bold text-green-800">🎉 Winner!</h3>
            <p className="text-green-700">{winner}</p>
          </div>
        )}

        {participants.length === 0 && (
          <p className="text-gray-500">No participants available</p>
        )}
      </div>
    </div>
  );
}
