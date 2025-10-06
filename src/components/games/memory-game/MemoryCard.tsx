"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface MemoryCardProps {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
  onClick: (id: number) => void;
  disabled: boolean;
  isHinted?: boolean;
}

export default function MemoryCard({ id, value, isFlipped, isMatched, onClick, disabled, isHinted = false }: MemoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!disabled && !isFlipped && !isMatched) {
      onClick(id);
    }
  };

  return (
    <motion.div
      className={`
        relative w-14 h-14 sm:w-16 sm:h-16 cursor-pointer select-none
        ${disabled ? 'cursor-default' : 'cursor-pointer'}
      `}
      whileHover={!disabled && !isMatched ? { scale: 1.05 } : {}}
      whileTap={!disabled && !isMatched ? { scale: 0.95 } : {}}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Card Back */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          backfaceVisibility: "hidden",
          transform: "rotateY(0deg)"
        }}
      >
        <motion.div
          className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg flex items-center justify-center border-2 border-white/20 relative"
        >
          <div className="w-6 h-6 bg-white/30 rounded-full"></div>
          {/* Hint indicator */}
          {isHinted && (
            <motion.div
              className="absolute inset-0 rounded-lg pointer-events-none"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(59, 130, 246, 0.8)',
                  '0 0 0 8px rgba(59, 130, 246, 0.4)',
                  '0 0 0 12px rgba(59, 130, 246, 0.1)',
                  '0 0 0 0 rgba(59, 130, 246, 0)'
                ],
                scale: [1, 1.02, 1.04, 1]
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut"
              }}
              style={{
                zIndex: 10
              }}
            />
          )}
        </motion.div>
      </motion.div>

      {/* Card Front */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)"
        }}
      >
        <div className={`
          w-full h-full rounded-lg shadow-lg flex items-center justify-center text-2xl font-bold
          ${isMatched
            ? 'bg-gradient-to-br from-green-400 to-green-600 border-2 border-green-300'
            : 'bg-gradient-to-br from-white to-gray-100 border-2 border-gray-300'
          }
        `}>
          <span className={isMatched ? 'text-white' : 'text-gray-800'}>
            {value}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
