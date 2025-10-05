"use client";

import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { PollOptionProps } from "./types";

export const PollOption: React.FC<PollOptionProps> = React.memo(
  ({
    option,
    isSelected,
    isDisabled,
    showResults,
    isLoading = false,
    recentVoters = [],
    totalVoters = 0,
    totalVotes = 0,
    onClick,
    showAvatars = true,
  }) => {
    const percentage = totalVotes > 0 ? (totalVoters / totalVotes) * 100 : 0;

    return (
      <div className="relative">
        <button
          onClick={onClick}
          disabled={isDisabled || isLoading}
          className={`
            w-full text-left relative overflow-hidden group py-4 px-4 rounded-xl border-2 
            transition-all duration-150 transform hover:scale-[1.01] active:scale-[0.99]
            ${
              isSelected
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
                  ${
                    isSelected
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
                  ${
                    isSelected
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-900 dark:text-white"
                  }
                `}
                >
                  {option}
                </span>
              </div>
              {isLoading && (
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin opacity-70"></div>
              )}
            </div>

            {/* Right side - Enhanced avatars and vote count */}
            {showResults && !isLoading && (
              <div className="flex items-center space-x-3 flex-shrink-0">
                {/* Avatars with animation */}
                {showAvatars && recentVoters.length > 0 && (
                  <div className="flex -space-x-1">
                    {recentVoters.slice(0, 3).map((voter, index) => (
                      <div
                        key={voter.id}
                        className="border-2 border-white dark:border-gray-800 shadow-sm animate-in zoom-in-50 duration-200"
                        style={{ animationDelay: `${index * 50}ms` }}
                        title={voter.playerName}
                      >
                        <Avatar
                          src={(voter as any).avatarBase64 || (voter as any).avatarUrl}
                          alt={voter.playerName}
                          size="sm"
                        />
                      </div>
                    ))}
                    {recentVoters.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-xs font-semibold text-white border-2 border-white dark:border-gray-800 shadow-sm">
                        +{recentVoters.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced vote count */}
                <div className="text-right">
                  <div
                    className={`
                    text-lg font-bold transition-all duration-200
                    ${
                      isSelected
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400"
                    }
                  `}
                  >
                    {totalVoters}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {totalVoters === 1 ? "vote" : "votes"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced progress bar with smooth animation */}
          {showResults && (
            <div className="mt-3">
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`
                    h-full rounded-full transition-all duration-700 ease-in-out
                    ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm"
                        : "bg-gradient-to-r from-gray-400 to-gray-500"
                    }
                  `}
                  style={{
                    width: `${percentage}%`,
                    transform: `scaleX(${percentage > 0 ? 1 : 0})`,
                    transformOrigin: "left",
                    willChange: "width, transform",
                  }}
                />
              </div>
            </div>
          )}
        </button>
      </div>
    );
  }
);

PollOption.displayName = "PollOption";
