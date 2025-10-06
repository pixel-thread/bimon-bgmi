"use client";

import React, { useCallback } from "react";
import { FiCheck, FiUsers, FiEdit, FiTrash2, FiPower } from "react-icons/fi";
import { Badge } from "@/src/components/ui/badge";
import { PollOption } from "./PollOption";
import { WhatsAppPollCardProps } from "./types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { PowerOff } from "lucide-react";

export const WhatsAppPollCard: React.FC<WhatsAppPollCardProps> = React.memo(
  ({
    poll,
    userVote,
    onVote,
    isDisabled,
    voteCounts = {},
    loadingOption,
    allVotes = [],
    onShowVoters,
    isSaving = false,
    readOnly,
    showViewAllVotes,
    showAvatars = false, // Default to false for performance
    showAdminActions,
    onEditPoll,
    onDeletePoll,
    onTogglePollStatus,
    isLoadingVotes = false,
  }) => {
    // Banned stamp styles
    const bannedStampStyles = {
      position: "absolute" as const,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%) rotate(-19deg)",
      color: "#dc2626",
      fontSize: "4.5rem",
      fontWeight: "900",
      opacity: 0.9,
      pointerEvents: "none" as const,
      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
      zIndex: 10,
      textTransform: "uppercase" as const,
      letterSpacing: "4px",
      fontFamily: '"Rajdhani", "Montserrat", sans-serif',
      border: "5px solid #dc2626",
      borderRadius: "12px",
      padding: "15px 40px",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      boxShadow: "0 10px 30px rgba(220, 38, 38, 0.3)",
      lineHeight: "1.2",
      textStroke: "1px #fecaca",
      WebkitTextStroke: "1px #fecaca",
      filter: "drop-shadow(2px 2px 1px rgba(0,0,0,0.1))",
    };
    const options = poll.options || [];
    const totalVotes = voteCounts
      ? Object.values(voteCounts).reduce((sum, count) => sum + count, 0)
      : 0;
    const showResults = !!userVote || totalVotes > 0;

    const getVotersForOption = useCallback(
      (option: string) => {
        if (!allVotes || !Array.isArray(allVotes)) return [];
        return allVotes
          .filter((vote) => vote.vote === option)
          .sort(
            (a, b) =>
              new Date(b.votedAt).getTime() - new Date(a.votedAt).getTime()
          );
      },
      [allVotes]
    );

    return (
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden max-w-2xl mx-auto">
        {/* Banned Stamp Overlay */}
        {isDisabled && !showAdminActions && (
          <div className="absolute inset-0 bg-black/5 dark:bg-white/5 z-10 pointer-events-none">
            <div style={bannedStampStyles}>Banned</div>
          </div>
        )}
        {/* Poll Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2 truncate">
                {poll.question}
              </h3>
              <div className="flex items-center gap-2 flex-wrap text-sm">
                {/* Status/Voted badge */}
                {/** If admin view, show Active/Inactive; else show Voted when applicable */}
                {typeof poll.isActive !== "undefined" &&
                (typeof showAdminActions !== "undefined"
                  ? showAdminActions
                  : false) ? (
                  <Badge
                    className={`${
                      poll.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200"
                    }`}
                  >
                    {poll.isActive ? "Active" : "Inactive"}
                  </Badge>
                ) : userVote ? (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                    <FiCheck className="w-3 h-3 mr-1" />
                    Voted
                  </Badge>
                ) : null}
                {poll.period ? (
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 font-bold px-3 py-1 text-xs rounded-md animate-pulse">
                    {poll.period}
                  </Badge>
                ) : poll.date ? (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 font-bold px-3 py-1 text-xs rounded-md animate-pulse">
                    {new Date(poll.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Badge>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(poll.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Admin Actions Dropdown */}
            {showAdminActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {onEditPoll && (
                    <DropdownMenuItem onClick={() => onEditPoll(poll)}>
                      <FiEdit className="mr-2 h-4 w-4" />
                      Edit Poll
                    </DropdownMenuItem>
                  )}
                  {onTogglePollStatus && (
                    <DropdownMenuItem onClick={() => onTogglePollStatus(poll)}>
                      {poll.isActive ? (
                        <>
                          <PowerOff className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <FiPower className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onDeletePoll && (
                    <DropdownMenuItem
                      onClick={() => onDeletePoll(poll)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <FiTrash2 className="mr-2 h-4 w-4" />
                      Delete Poll
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Poll Options */}
        <div className="p-6 space-y-3">
          {options.map((option, index) => {
            const optionText =
              typeof option === "string" ? option : option.text;
            const optionKey =
              typeof option === "string" ? option : `${option.text}-${index}`;
            const votersForOption = getVotersForOption(optionText);

            return (
              <PollOption
                key={optionKey}
                option={optionText}
                isSelected={userVote?.vote === optionText}
                isDisabled={isDisabled || !!readOnly}
                showResults={showResults}
                isLoading={loadingOption === optionText}
                recentVoters={votersForOption.slice(0, 2)}
                totalVoters={votersForOption.length}
                totalVotes={totalVotes}
                showAvatars={showAvatars}
                onClick={() => {
                  if (readOnly || isDisabled) return;
                  onVote(poll.id, optionText);
                }}
              />
            );
          })}
        </div>

        {/* Poll Footer */}
        {totalVotes > 0 && (showViewAllVotes ?? true) && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
              <span className="flex items-center space-x-1">
                <FiUsers className="w-4 h-4" />
                <span>
                  {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                </span>
              </span>
              <span className="text-xs">
                {new Date(poll.createdAt).toLocaleDateString()}
              </span>
            </div>

            {onShowVoters && (
              <button
                onClick={() => onShowVoters(poll.id, poll.question, "")}
                disabled={isLoadingVotes}
                className={`w-full text-center font-medium py-2 px-4 rounded-lg transition-colors ${
                  isLoadingVotes
                    ? "text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                    : "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`}
              >
                {isLoadingVotes ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading votes...</span>
                  </span>
                ) : (
                  "View all votes"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

WhatsAppPollCard.displayName = "WhatsAppPollCard";
