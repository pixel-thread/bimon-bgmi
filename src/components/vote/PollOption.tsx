"use client";

import React from "react";
import { Progress } from "../ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { User } from "lucide-react";

type RecentVoter = {
  id: string;
  imageUrl?: string | null;
  characterImageUrl?: string | null;
  displayName?: string | null;
  userName?: string;
};

export interface PollOptionProps {
  option: string;
  isSelected: boolean;
  isDisabled: boolean;
  isLoading?: boolean;
  showResults: boolean;
  totalVoters?: number;
  totalVotes?: number;
  showAvatars?: boolean;
  recentVoters?: RecentVoter[];
  onClick: () => void;
}

export const PollOption: React.FC<PollOptionProps> = React.memo(
  ({
    option,
    isSelected,
    isDisabled,
    isLoading = false,
    showResults = true,
    totalVotes = 0,
    totalVoters = 0,
    recentVoters = [],
    onClick,
  }) => {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={onClick}
          disabled={isLoading || isDisabled}
          className={`
            w-full text-left relative overflow-hidden group py-4 px-4 rounded-xl border-2 
            transition-all duration-150 transform hover:scale-[1.01] active:scale-[0.99]
            ${isSelected
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm"
            }
            ${isLoading ? "cursor-wait opacity-80" : "cursor-pointer"}
            ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          <div className="flex items-center justify-between">
            {/* Left side - Enhanced radio button and option text */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0
                  ${isSelected
                    ? "border-blue-500 bg-blue-500 shadow-sm"
                    : "border-gray-300 dark:border-gray-600 group-hover:border-blue-400"
                  }
                `}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-in zoom-in-50 duration-200" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={`
                  font-medium text-base truncate block
                  ${isSelected
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-900 dark:text-white"
                    }
                `}
                >
                  {option}
                </span>
              </div>
              {isLoading && (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>

            {/* Right side - Recent voters avatars and count */}
            {showResults && totalVoters > 0 && (
              <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                {/* Recent voter avatars */}
                {recentVoters.length > 0 && (
                  <div className="flex -space-x-2">
                    {recentVoters.slice(0, 2).map((voter, index) => (
                      <Avatar
                        key={voter.id}
                        className={`w-6 h-6 border-2 border-white dark:border-gray-800 ${index === 0 ? 'z-10' : 'z-0'}`}
                      >
                        <AvatarImage
                          src={voter.imageUrl || voter.characterImageUrl || ''}
                          alt={voter.displayName || voter.userName || 'Voter'}
                        />
                        <AvatarFallback className="text-xs">
                          <User className="w-3 h-3 text-gray-400" />
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                )}
                {/* Vote count */}
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {totalVoters}
                </span>
              </div>
            )}
          </div>

          {/* Enhanced progress bar with smooth animation */}
          {showResults && (
            <div className="mt-3">
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <Progress value={totalVotes} />
              </div>
            </div>
          )}
        </button>
      </div>
    );
  },
);

PollOption.displayName = "PollOption";
