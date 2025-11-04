"use client";

import React from "react";
import { FiCheck, FiUsers } from "react-icons/fi";
import { Badge } from "@/src/components/ui/badge";
import { PollOption } from "./PollOption";
import { usePlayerVote } from "@/src/hooks/poll/usePlayerVote";
import { PollT } from "@/src/types/poll";
import { useAuth } from "@/src/hooks/context/auth/useAuth";

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

type WhatAppPollCardProps = {
  poll: PollT;
  readOnly: boolean;
  showAvatars?: boolean; // Default to false for performance
  onShowVoters: (poll: PollT) => void;
};

export const WhatsAppPollCard: React.FC<WhatAppPollCardProps> = React.memo(
  ({
    poll,
    onShowVoters,
    readOnly,
    showAvatars = false, // Default to false for performance
  }) => {
    // Banned stamp styles
    const { user } = useAuth();
    const isBanned = user?.player?.isBanned || false;
    const options = poll.options || [];
    const pollId = poll.id;
    const { data: playersVotes, isFetching: isLoadingVotes } = usePlayerVote({
      pollId,
    });

    const totalVotes = playersVotes?.length || 0;

    const playerId = user?.player?.id || "";
    const allVoter = playersVotes || [];
    const isUserVoted = playersVotes?.find((val) => val.playerId === playerId)
      ? true
      : false;

    const showViewAllVotes = !!isUserVoted;

    const userVotedOption = playersVotes?.find(
      (vote) => vote.playerId === playerId,
    )?.vote;

    const showResults = !!isUserVoted || totalVotes > 0;

    return (
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden max-w-2xl mx-auto">
        {/* Banned Stamp Overlay */}
        {isBanned && (
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
                <Badge
                  className={`${
                    poll.isActive
                      ? "bg-green-100 uppercase text-green-800 dark:bg-green-900/30 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 uppercase dark:bg-gray-900/30 dark:text-gray-200"
                  }`}
                >
                  {poll.isActive ? "Active" : "Inactive"}
                </Badge>
                {isUserVoted ? (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                    <FiCheck className="w-3 h-3 mr-1" />
                    Voted
                  </Badge>
                ) : null}
                {poll?.days ? (
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 font-bold px-3 py-1 text-xs rounded-md animate-pulse">
                    {poll.days}
                  </Badge>
                ) : poll?.createdAt ? (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 font-bold px-3 py-1 text-xs rounded-md animate-pulse">
                    {new Date(poll.createdAt).toLocaleDateString(undefined, {
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
          </div>
        </div>

        {/* Poll Options */}
        <div className="p-6 space-y-3">
          {options.map((option, index) => {
            const optionKey =
              typeof option === "string" ? option : `${option.name}-${index}`;

            return (
              <PollOption
                id={poll.id}
                value={option.vote}
                key={optionKey}
                option={option.name}
                isSelected={userVotedOption === option.vote}
                isDisabled={!poll.isActive || !!readOnly}
                showResults={showResults}
                // TODO: Add recent voters
                totalVoters={
                  allVoter.filter((value) => value.vote === option.vote).length
                }
                totalVotes={totalVotes}
                showAvatars={showAvatars}
                onClick={() => {}}
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
                onClick={() => onShowVoters(poll)}
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
  },
);

WhatsAppPollCard.displayName = "WhatsAppPollCard";
