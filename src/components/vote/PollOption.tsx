"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { toast } from "sonner";
import { Progress } from "../ui/progress";

type DataT = { vote: "IN" | "OUT" | "SOLO" };

export interface PollOptionProps {
  id: string;
  value: "IN" | "OUT" | "SOLO";
  option: string;
  isSelected: boolean;
  isDisabled: boolean;
  showResults: boolean;
  isLoading?: boolean;
  totalVoters?: number;
  totalVotes?: number;
  showAvatars?: boolean; // Add this prop to control avatar visibility
  onClick: () => void;
}

export const PollOption: React.FC<PollOptionProps> = React.memo(
  ({
    id,
    option,
    value,
    isSelected,
    isDisabled,
    showResults = true,
    totalVotes = 0,
  }) => {
    const queryClient = useQueryClient();
    const { mutate, isPending: isLoading } = useMutation({
      mutationFn: (data: DataT) => http.post(`/poll/${id}/vote`, data),
      onSuccess: (data) => {
        if (data.success) {
          queryClient.invalidateQueries({ queryKey: ["poll", id] });
          queryClient.invalidateQueries({ queryKey: ["player-vote", id] });
          toast.success(data.message);
          return data;
        }
        toast.error(data.message);
        return data;
      },
    });

    return (
      <div className="relative">
        <button
          onClick={() => mutate({ vote: value as "IN" | "OUT" | "SOLO" })}
          disabled={isLoading}
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
