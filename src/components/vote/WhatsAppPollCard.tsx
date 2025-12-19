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
import { getPollTheme } from "./pollTheme";

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
      onSuccess: (data, newVote) => {
        setPendingVote(null);
        if (data.success) {
          toast.success(data.message);
          // Update polls cache so VotersDialog shows correct vote
          queryClient.setQueryData(["polls"], (oldData: any) => {
            if (!oldData?.data) return oldData;
            return {
              ...oldData,
              data: oldData.data.map((p: any) => {
                if (p.id !== pollId) return p;
                // Update playersVotes for this poll
                const updatedVotes = p.playersVotes?.map((v: any) =>
                  v.playerId === playerId ? { ...v, vote: newVote } : v
                ) || [];
                return { ...p, playersVotes: updatedVotes };
              }),
            };
          });
          // Don't clear optimistic state here - let useEffect handle it
          // when server data catches up to avoid race condition
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

    // Count votes for each option (base counts from server)
    const baseVoteCounts = allUniqueVotes.map((vote) => ({
      vote,
      count: filterPollVote(vote).length,
    }));

    // Apply optimistic adjustment to vote counts when user changes vote
    const voteCounts = baseVoteCounts.map((vc) => {
      let adjustedCount = vc.count;
      if (playerId && optimisticVote && serverVotedOption !== optimisticVote) {
        // Remove from old vote count
        if (vc.vote === serverVotedOption) {
          adjustedCount = Math.max(0, adjustedCount - 1);
        }
        // Add to new vote count
        if (vc.vote === optimisticVote) {
          adjustedCount++;
        }
      }
      return { vote: vc.vote, count: adjustedCount };
    });

    const maxVoteCount = Math.max(...voteCounts.map((vc) => vc.count), 1);

    const votePercentages = voteCounts.map((vc) => ({
      vote: vc.vote,
      count: vc.count,
      percentage: Math.round((vc.count / maxVoteCount) * 100),
    }));

    const handleVote = (optionVote: VoteT) => {
      // Don't do anything if clicking the same option that's already voted
      if (optionVote === userVotedOption) return;
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

    // Use shared theme utility
    const theme = hasPrizePool ? getPollTheme(participantCount) : null;

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
                {entryFee > 0 ? `Entry: ₹${entryFee}` : 'Free Entry'}
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
