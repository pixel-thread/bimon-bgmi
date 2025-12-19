"use client";

import React, { useState, useEffect } from "react";
import { FiCheck, FiUsers } from "react-icons/fi";
import { Badge } from "@/src/components/ui/badge";
import { PollOption } from "./PollOption";
import { usePlayerVote } from "@/src/hooks/poll/usePlayerVote";
import { PollT } from "@/src/types/poll";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { toast } from "sonner";
import { SlotMachineCounter } from "@/src/components/ui/AnimatedCounter";

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

type VoteT = Prisma.PlayerPollVoteCreateInput["vote"];

type WhatAppPollCardProps = {
  poll: PollT;
  readOnly: boolean;
  showAvatars?: boolean;
  onShowVoters: (poll: PollT) => void;
};

export const WhatsAppPollCard: React.FC<WhatAppPollCardProps> = React.memo(
  ({
    poll,
    onShowVoters,
    readOnly,
    showAvatars = false,
  }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isBanned = user?.player?.isBanned || false;
    const options = poll.options || [];
    const pollId = poll.id;
    const playerId = user?.player?.id || "";

    // Optimistic vote state - tracks which option user is voting for
    const [optimisticVote, setOptimisticVote] = useState<VoteT | null>(null);
    const [pendingVote, setPendingVote] = useState<VoteT | null>(null); // For loader

    // Use pre-fetched votes if available, otherwise fetch
    const preFetchedVotes = poll.playersVotes;
    const { data: fetchedVotes, isFetching: isLoadingVotes } = usePlayerVote({
      pollId,
      enabled: !preFetchedVotes,
    });

    const playersVotes = preFetchedVotes || fetchedVotes;

    // Server-side voted option
    const serverVotedOption = playersVotes?.find(
      (vote) => vote.playerId === playerId
    )?.vote;

    // Use optimistic vote if set, otherwise use server data
    const userVotedOption = optimisticVote ?? serverVotedOption;

    // Reset optimistic vote when server catches up (but not during pending)
    useEffect(() => {
      if (optimisticVote && !pendingVote && serverVotedOption === optimisticVote) {
        setOptimisticVote(null);
      }
    }, [serverVotedOption, optimisticVote, pendingVote]);

    // Vote mutation
    const { mutate: submitVote } = useMutation({
      mutationFn: (vote: VoteT) => http.post(`/poll/${pollId}/vote`, { vote }),
      onMutate: (newVote) => {
        // Optimistically update - old selection disappears, new one appears
        setOptimisticVote(newVote);
        setPendingVote(newVote); // Track for loader
      },
      onSuccess: (data) => {
        setPendingVote(null);
        if (data.success) {
          toast.success(data.message);
          // Don't refetch - optimistic state is already correct
        } else {
          // Revert on failure - go back to server state
          setOptimisticVote(null);
          toast.error(data.message);
        }
      },
      onError: () => {
        // Revert on error
        setPendingVote(null);
        setOptimisticVote(null);
        toast.error("Failed to vote. Please try again.");
      },
    });

    const totalVotes = playersVotes?.length || 0;
    const isUserVoted = !!userVotedOption;
    const showViewAllVotes = true;
    const showResults = !!isUserVoted || totalVotes > 0;

    const filterPollVote = (vote: VoteT) => {
      return playersVotes?.filter((val) => val.vote === vote) || [];
    };

    // Collect all unique votes
    const allUniqueVotes = [...new Set(playersVotes?.map((v) => v.vote))];

    // Count votes for each option
    const voteCounts = allUniqueVotes.map((vote) => ({
      vote,
      count: filterPollVote(vote).length,
    }));

    const maxVoteCount = Math.max(...voteCounts.map((vc) => vc.count), 1);

    const votePercentages = voteCounts.map((vc) => ({
      vote: vc.vote,
      count: vc.count,
      percentage: Math.round((vc.count / maxVoteCount) * 100),
    }));

    const handleVote = (optionVote: VoteT) => {
      if (!pendingVote && !readOnly && !isBanned && poll.isActive) {
        submitVote(optionVote);
      }
    };

    // Calculate prize pool for card styling - count "IN" and "SOLO" votes, exclude "OUT"
    const entryFee = poll.tournament?.fee || 0;

    // Base counts from server data
    let inVotesCount = playersVotes?.filter(v => v.vote === 'IN').length || 0;
    let soloVotesCount = playersVotes?.filter(v => v.vote === 'SOLO').length || 0;

    // Apply optimistic adjustment for the current user's vote
    // This makes the prize pool animate immediately on vote switch
    if (playerId && optimisticVote && serverVotedOption !== optimisticVote) {
      // Remove from old vote count
      if (serverVotedOption === 'IN') inVotesCount = Math.max(0, inVotesCount - 1);
      if (serverVotedOption === 'SOLO') soloVotesCount = Math.max(0, soloVotesCount - 1);
      // Add to new vote count
      if (optimisticVote === 'IN') inVotesCount++;
      if (optimisticVote === 'SOLO') soloVotesCount++;
    }

    const participantCount = inVotesCount + soloVotesCount;

    const prizePool = entryFee * participantCount;
    const hasPrizePool = prizePool > 0;

    // Theme tiers based on participant count
    const getTheme = () => {
      if (participantCount >= 60) {
        // Diamond - Purple/Pink premium
        return {
          card: 'bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/30 dark:to-gray-800 border-2 border-purple-400 dark:border-purple-500 shadow-lg shadow-purple-300/50 dark:shadow-purple-900/30',
          header: 'from-purple-500 via-pink-500 to-purple-600',
          wave1: 'rgba(168,85,247,0.3)',
          wave2: 'rgba(255,255,255,0.15)',
          sparkle: 'bg-pink-200',
          badge: 'bg-white/20 text-white backdrop-blur-sm',
          options: 'bg-gradient-to-b from-purple-100/50 to-purple-50/30 dark:from-purple-900/20 dark:to-purple-950/10',
          footer: 'bg-gradient-to-b from-purple-50/30 to-purple-100/50 dark:from-purple-950/10 dark:to-purple-900/20',
          button: 'text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/30',
          optionSelected: { border: 'border-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', radio: 'border-purple-500 bg-purple-500' },
          optionUnselected: { border: 'border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500', radio: 'border-purple-300 dark:border-purple-600 group-hover:border-purple-400' },
        };
      } else if (participantCount >= 50) {
        // Legendary - Red/Orange fire
        return {
          card: 'bg-gradient-to-b from-red-50 to-white dark:from-red-950/30 dark:to-gray-800 border-2 border-red-400 dark:border-red-500 shadow-lg shadow-red-300/50 dark:shadow-red-900/30',
          header: 'from-red-500 via-orange-500 to-red-600',
          wave1: 'rgba(239,68,68,0.3)',
          wave2: 'rgba(255,255,255,0.15)',
          sparkle: 'bg-orange-200',
          badge: 'bg-white/20 text-white backdrop-blur-sm',
          options: 'bg-gradient-to-b from-red-100/50 to-red-50/30 dark:from-red-900/20 dark:to-red-950/10',
          footer: 'bg-gradient-to-b from-red-50/30 to-red-100/50 dark:from-red-950/10 dark:to-red-900/20',
          button: 'text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/30',
          optionSelected: { border: 'border-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', radio: 'border-red-500 bg-red-500' },
          optionUnselected: { border: 'border-red-200 dark:border-red-700 hover:border-red-400 dark:hover:border-red-500', radio: 'border-red-300 dark:border-red-600 group-hover:border-red-400' },
        };
      } else if (participantCount >= 40) {
        // Epic - Blue/Cyan
        return {
          card: 'bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-800 border-2 border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-300/50 dark:shadow-blue-900/30',
          header: 'from-blue-500 via-cyan-400 to-blue-600',
          wave1: 'rgba(59,130,246,0.3)',
          wave2: 'rgba(255,255,255,0.15)',
          sparkle: 'bg-cyan-200',
          badge: 'bg-white/20 text-white backdrop-blur-sm',
          options: 'bg-gradient-to-b from-blue-100/50 to-blue-50/30 dark:from-blue-900/20 dark:to-blue-950/10',
          footer: 'bg-gradient-to-b from-blue-50/30 to-blue-100/50 dark:from-blue-950/10 dark:to-blue-900/20',
          button: 'text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/30',
          optionSelected: { border: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', radio: 'border-blue-500 bg-blue-500' },
          optionUnselected: { border: 'border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500', radio: 'border-blue-300 dark:border-blue-600 group-hover:border-blue-400' },
        };
      } else if (participantCount >= 30) {
        // Rare - Green/Emerald
        return {
          card: 'bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/30 dark:to-gray-800 border-2 border-emerald-400 dark:border-emerald-500 shadow-lg shadow-emerald-300/50 dark:shadow-emerald-900/30',
          header: 'from-emerald-500 via-green-400 to-emerald-600',
          wave1: 'rgba(16,185,129,0.3)',
          wave2: 'rgba(255,255,255,0.15)',
          sparkle: 'bg-green-200',
          badge: 'bg-white/20 text-white backdrop-blur-sm',
          options: 'bg-gradient-to-b from-emerald-100/50 to-emerald-50/30 dark:from-emerald-900/20 dark:to-emerald-950/10',
          footer: 'bg-gradient-to-b from-emerald-50/30 to-emerald-100/50 dark:from-emerald-950/10 dark:to-emerald-900/20',
          button: 'text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
          optionSelected: { border: 'border-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', radio: 'border-emerald-500 bg-emerald-500' },
          optionUnselected: { border: 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500', radio: 'border-emerald-300 dark:border-emerald-600 group-hover:border-emerald-400' },
        };
      } else if (participantCount >= 20) {
        // Common - Gold/Amber (original)
        return {
          card: 'bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/30 dark:to-gray-800 border-2 border-amber-300 dark:border-amber-600 shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30',
          header: 'from-amber-500 via-yellow-400 to-orange-400',
          wave1: 'rgba(251,191,36,0.3)',
          wave2: 'rgba(255,255,255,0.15)',
          sparkle: 'bg-yellow-200',
          badge: 'bg-white/20 text-white backdrop-blur-sm',
          options: 'bg-gradient-to-b from-amber-100/50 to-amber-50/30 dark:from-amber-900/20 dark:to-amber-950/10',
          footer: 'bg-gradient-to-b from-amber-50/30 to-amber-100/50 dark:from-amber-950/10 dark:to-amber-900/20',
          button: 'text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30',
          optionSelected: { border: 'border-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', radio: 'border-amber-500 bg-amber-500' },
          optionUnselected: { border: 'border-amber-200 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-500', radio: 'border-amber-300 dark:border-amber-600 group-hover:border-amber-400' },
        };
      } else if (participantCount >= 1) {
        // Starter - Slate/Gray base theme
        return {
          card: 'bg-gradient-to-b from-slate-50 to-white dark:from-slate-950/30 dark:to-gray-800 border-2 border-slate-300 dark:border-slate-600 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/30',
          header: 'from-slate-500 via-slate-400 to-gray-500',
          wave1: 'rgba(100,116,139,0.3)',
          wave2: 'rgba(255,255,255,0.15)',
          sparkle: 'bg-slate-300',
          badge: 'bg-white/20 text-white backdrop-blur-sm',
          options: 'bg-gradient-to-b from-slate-100/50 to-slate-50/30 dark:from-slate-900/20 dark:to-slate-950/10',
          footer: 'bg-gradient-to-b from-slate-50/30 to-slate-100/50 dark:from-slate-950/10 dark:to-slate-900/20',
          button: 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/30',
          optionSelected: { border: 'border-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20', text: 'text-slate-700 dark:text-slate-300', radio: 'border-slate-500 bg-slate-500' },
          optionUnselected: { border: 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500', radio: 'border-slate-300 dark:border-slate-600 group-hover:border-slate-400' },
        };
      }
      return null; // No theme (0 participants)
    };

    const theme = hasPrizePool ? getTheme() : null;

    return (
      <div className={`relative rounded-xl overflow-hidden max-w-2xl mx-auto transition-all duration-700 ease-in-out ${theme
        ? theme.card
        : 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700'
        }`}>
        {/* Banned Stamp Overlay */}
        {isBanned && (
          <div className="absolute inset-0 bg-black/5 dark:bg-white/5 z-10 pointer-events-none">
            <div style={bannedStampStyles}>Banned</div>
          </div>
        )}
        {/* Combined Header with Prize Pool */}
        {(() => {
          return (
            <div className={hasPrizePool ? "relative overflow-hidden" : ""}>
              {/* Prize Pool Background - only when there's a prize pool */}
              {theme && (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.header}`} />
                  {/* Wave effect */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden">
                    <svg className="absolute bottom-0 w-[200%] h-12 animate-[wave_3s_ease-in-out_infinite]" viewBox="0 0 1200 120" preserveAspectRatio="none">
                      <path d="M0,60 C200,100 400,20 600,60 C800,100 1000,20 1200,60 L1200,120 L0,120 Z" fill={theme.wave1} />
                    </svg>
                    <svg className="absolute bottom-0 w-[200%] h-10 animate-[wave_4s_ease-in-out_infinite_reverse]" viewBox="0 0 1200 120" preserveAspectRatio="none">
                      <path d="M0,60 C200,20 400,100 600,60 C800,20 1000,100 1200,60 L1200,120 L0,120 Z" fill={theme.wave2} />
                    </svg>
                  </div>
                  {/* Sparkles */}
                  <div className="absolute top-3 left-6 w-1 h-1 bg-white rounded-full animate-ping opacity-75" />
                  <div className={`absolute top-4 right-8 w-1.5 h-1.5 ${theme.sparkle} rounded-full animate-ping opacity-60`} style={{ animationDelay: '0.5s' }} />
                  <style jsx>{`
                    @keyframes wave {
                      0%, 100% { transform: translateX(0); }
                      50% { transform: translateX(-25%); }
                    }
                  `}</style>
                </>
              )}

              {/* Content */}
              <div className={`relative p-6 ${hasPrizePool ? 'pb-8' : 'border-b border-gray-100 dark:border-gray-700'}`}>
                {/* Title and Day Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 overflow-hidden group">
                    <h3
                      className={`font-semibold text-lg truncate group-hover:animate-[scroll_5s_linear_infinite] ${hasPrizePool ? 'text-white drop-shadow-md' : 'text-gray-900 dark:text-white'}`}
                      title={poll.question}
                    >
                      {poll.question}
                    </h3>
                    <style jsx>{`
                      @keyframes scroll {
                        0%, 30% { transform: translateX(0); }
                        70%, 100% { transform: translateX(calc(-100% + 200px)); }
                      }
                      .group:hover h3 {
                        overflow: visible;
                        white-space: nowrap;
                      }
                    `}</style>
                  </div>
                  {poll?.days ? (
                    <Badge className={`flex-shrink-0 font-bold px-3 py-1 text-xs rounded-md ${theme ? theme.badge : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 animate-pulse'}`}>
                      {poll.days}
                    </Badge>
                  ) : poll?.createdAt ? (
                    <Badge className={`flex-shrink-0 font-bold px-3 py-1 text-xs rounded-md ${theme ? theme.badge : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 animate-pulse'}`}>
                      {new Date(poll.createdAt).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </Badge>
                  ) : null}
                </div>

                {/* Prize Pool Display */}
                {theme && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <span className="text-3xl">🏆</span>
                    <div className="text-center">
                      <p className="text-xs font-medium text-white/80 uppercase tracking-widest">Prize Pool</p>
                      <p className="text-2xl font-black text-white drop-shadow-lg">
                        <SlotMachineCounter
                          value={prizePool}
                          prefix="₹"
                        />
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Poll Options */}
        <div className={`p-6 space-y-3 transition-all duration-700 ease-in-out ${theme ? theme.options : ''}`}>
          {options.map((option, index) => {
            const optionKey =
              typeof option === "string" ? option : `${option.name}-${index}`;

            // Get voters for this option, sorted by most recent
            const optionVoters = filterPollVote(option.vote)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // Build recent voters list with optimistic updates
            // When user optimistically switches vote, move their avatar accordingly
            const currentUserServerVote = optionVoters.find((v) => v.playerId === playerId);
            const otherVoters = optionVoters.filter((v) => v.playerId !== playerId);

            // Determine if current user should appear in this option's avatars (optimistically)
            let showCurrentUserHere = false;
            if (optimisticVote) {
              // User has an optimistic vote - show avatar on the optimistic option
              showCurrentUserHere = option.vote === optimisticVote;
            } else if (currentUserServerVote) {
              // No optimistic vote, use server data
              showCurrentUserHere = true;
            }

            // Get current user's info from server data (from any option they voted on)
            const currentUserInfo = playersVotes?.find((v) => v.playerId === playerId);

            const recentVoters = [
              // Show current user if they voted for this option (optimistically determined)
              ...(showCurrentUserHere && currentUserInfo ? [{
                id: currentUserInfo.id,
                imageUrl: (currentUserInfo.player as any)?.imageUrl || null,
                characterImageUrl: currentUserInfo.player?.characterImage?.publicUrl || null,
                displayName: currentUserInfo.player?.user?.displayName || null,
                userName: currentUserInfo.player?.user?.userName || '',
              }] : []),
              ...otherVoters.slice(0, showCurrentUserHere ? 1 : 2).map((v) => ({
                id: v.id,
                imageUrl: (v.player as any)?.imageUrl || null,
                characterImageUrl: v.player?.characterImage?.publicUrl || null,
                displayName: v.player?.user?.displayName || null,
                userName: v.player?.user?.userName || '',
              })),
            ].slice(0, 2);

            // This option is selected if it matches the current vote (optimistic or server)
            const isSelected = userVotedOption === option.vote;
            // Show loading spinner only on the option being voted for
            const isOptionLoading = pendingVote === option.vote;

            return (
              <PollOption
                key={optionKey}
                option={option.name}
                isSelected={isSelected}
                isDisabled={!poll.isActive || !!readOnly || isBanned}
                isLoading={isOptionLoading}
                showResults={showResults}
                recentVoters={recentVoters}
                totalVoters={
                  votePercentages.find((val) => val.vote === option.vote)?.count || 0
                }
                totalVotes={
                  votePercentages.find((val) => val.vote === option.vote)?.percentage || 0
                }
                showAvatars={showAvatars}
                hasPrizePool={hasPrizePool}
                theme={theme}
                onClick={() => handleVote(option.vote)}
              />
            );
          })}
        </div>

        {/* Poll Footer */}
        {totalVotes > 0 && (showViewAllVotes ?? true) && (
          <div className={`px-6 pb-6 transition-all duration-700 ease-in-out ${theme ? theme.footer : ''}`}>
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
                type="button"
                onClick={() => onShowVoters(poll)}
                disabled={isLoadingVotes}
                className={`w-full text-center font-medium py-2 px-4 rounded-lg transition-colors ${isLoadingVotes
                  ? "text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                  : theme
                    ? theme.button
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
