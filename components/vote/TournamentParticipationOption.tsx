"use client";

import React from "react";
import { FiCheck, FiUserCheck, FiUserX, FiUser } from "react-icons/fi";
import { TournamentParticipationOptionProps } from "./types";
import { PollOption } from "@/lib/types";

export const TournamentParticipationOption: React.FC<TournamentParticipationOptionProps> =
  React.memo(
    ({
      option,
      isSelected,
      isDisabled,
      isLoading = false,
      participantCount,
      onClick,
    }) => {
      const optionText = typeof option === "string" ? option : option.text;
      const optionAction = typeof option === "string" ? "none" : option.action;

      // Get appropriate icon based on option
      const getIcon = () => {
        if (optionAction === "out") {
          return <FiUserX className="w-5 h-5" />;
        } else if (optionAction === "solo") {
          return <FiUser className="w-5 h-5" />;
        } else if (optionAction === "in") {
          return <FiUserCheck className="w-5 h-5" />;
        } else {
          // Fallback to text analysis
          const textLower = optionText.toLowerCase();
          if (textLower.includes("out")) {
            return <FiUserX className="w-5 h-5" />;
          } else if (textLower.includes("solo")) {
            return <FiUser className="w-5 h-5" />;
          } else {
            return <FiUserCheck className="w-5 h-5" />;
          }
        }
      };

      // Get appropriate color scheme based on action
      const getColorScheme = () => {
        if (optionAction === "out") {
          return {
            bg: isSelected
              ? "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-400 dark:text-red-200"
              : "bg-gray-50 border-gray-200 hover:bg-red-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-red-900/10",
            icon: isSelected ? "text-red-600" : "text-red-400",
            check: "border-red-500 bg-red-500",
          };
        } else if (optionAction === "solo") {
          return {
            bg: isSelected
              ? "bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-200"
              : "bg-gray-50 border-gray-200 hover:bg-blue-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-blue-900/10",
            icon: isSelected ? "text-blue-600" : "text-blue-400",
            check: "border-blue-500 bg-blue-500",
          };
        } else if (optionAction === "in") {
          return {
            bg: isSelected
              ? "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-400 dark:text-green-200"
              : "bg-gray-50 border-gray-200 hover:bg-green-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-green-900/10",
            icon: isSelected ? "text-green-600" : "text-green-400",
            check: "border-green-500 bg-green-500",
          };
        } else {
          // Fallback to text analysis
          const textLower = optionText.toLowerCase();
          if (textLower.includes("out")) {
            return {
              bg: isSelected
                ? "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-400 dark:text-red-200"
                : "bg-gray-50 border-gray-200 hover:bg-red-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-red-900/10",
              icon: isSelected ? "text-red-600" : "text-red-400",
              check: "border-red-500 bg-red-500",
            };
          } else if (textLower.includes("solo")) {
            return {
              bg: isSelected
                ? "bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-200"
                : "bg-gray-50 border-gray-200 hover:bg-blue-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-blue-900/10",
              icon: isSelected ? "text-blue-600" : "text-blue-400",
              check: "border-blue-500 bg-blue-500",
            };
          } else {
            return {
              bg: isSelected
                ? "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-400 dark:text-green-200"
                : "bg-gray-50 border-gray-200 hover:bg-green-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-green-900/10",
              icon: isSelected ? "text-green-600" : "text-green-400",
              check: "border-green-500 bg-green-500",
            };
          }
        }
      };

      const colorScheme = getColorScheme();

      return (
        <button
          onClick={onClick}
          disabled={isDisabled || isLoading}
          className={`
          w-full p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left relative overflow-hidden
          ${colorScheme.bg}
          ${
            isDisabled || isLoading
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:shadow-md transform hover:scale-[1.02]"
          }
          ${isLoading ? "animate-pulse" : ""}
        `}
        >
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
              <div
                className={`${colorScheme.icon} transition-colors duration-200 flex-shrink-0`}
              >
                {getIcon()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-base sm:text-lg block truncate">
                  {optionText}
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <div
                    className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0
                    ${
                      isSelected
                        ? colorScheme.check
                        : "border-gray-300 dark:border-gray-600"
                    }
                  `}
                  >
                    {isLoading ? (
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                    ) : isSelected ? (
                      <FiCheck className="w-2.5 h-2.5 text-white" />
                    ) : null}
                  </div>
                  <span className="text-xs sm:text-sm opacity-75 truncate">
                    {isSelected ? "Your choice" : "Click to select"}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-xl sm:text-2xl font-bold">
                {participantCount}
              </div>
              <div className="text-xs sm:text-sm opacity-75">
                {participantCount === 1 ? "player" : "players"}
              </div>
            </div>
          </div>
        </button>
      );
    }
  );

TournamentParticipationOption.displayName = "TournamentParticipationOption";
