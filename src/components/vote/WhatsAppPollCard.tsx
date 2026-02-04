"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FiCheck, FiUsers } from "react-icons/fi";
import { Badge } from "@/src/components/ui/badge";
import { PollOption } from "./PollOption";
import { usePlayerVote } from "@/src/hooks/poll/usePlayerVote";
import { PollT } from "@/src/types/poll";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { useUser } from "@clerk/nextjs";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { toast } from "sonner";
import { SlotMachineCounter } from "@/src/components/ui/AnimatedCounter";
import { getPollTheme, getLuckyWinnerTheme, getBirthdayTheme, PollTheme } from "./pollTheme";
import { motion, AnimatePresence } from "motion/react";
import { getPrizeDistribution, getTeamSize } from "@/src/utils/prizeDistribution";
import { PollCardSkeleton } from "./PollCardSkeleton";
import { isBirthdayWithinWindow } from "@/src/utils/birthdayCheck";


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

// Aceternity-style animated tooltip for prize breakdown
const PrizeBreakdownTooltip = ({ prizePool, entryFee, teamSize, theme, onDoubleTap }: { prizePool: number; entryFee: number; teamSize: number; theme: PollTheme; onDoubleTap?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const lastTapRef = React.useRef<number>(0);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      onDoubleTap?.();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setIsOpen(!isOpen);
    }
  };

  return (
    <div
      className="absolute bottom-2 right-3"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 5,
              scale: 0.98,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            className={`absolute bottom-0 right-full mr-2 z-50 rounded-lg px-4 py-2 text-sm shadow-2xl bg-gradient-to-br ${theme.header} max-h-48 overflow-y-auto`}
          >
            <div className="absolute inset-0 bg-black/10 rounded-lg" />
            <div className="relative space-y-0.5 whitespace-nowrap text-white">
              {(() => {
                const distribution = getPrizeDistribution(prizePool, entryFee, teamSize);
                const medals = ['🥇', '🥈', '🥉', '🏅', '🎖️'];
                return Array.from(distribution.prizes.entries())
                  .sort(([a], [b]) => a - b)
                  .map(([position, prize]) => {
                    const medal = medals[position - 1] || '🏅';
                    const ordinal = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';
                    return (
                      <div key={position} className="flex items-center justify-between gap-4">
                        <span>{medal} {position}{ordinal}</span>
                        <span className="font-semibold">{prize.amount.toLocaleString()} UC</span>
                      </div>
                    );
                  });
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/25 hover:bg-white/40 active:bg-white/50 text-white text-xs font-bold cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:scale-110 backdrop-blur-sm border border-white/30"
        aria-label="View prize breakdown (double-tap to refresh)"
        onClick={handleTap}
      >
        ?
      </button>
    </div>
  );
};

type WhatAppPollCardProps = {
  poll: PollT;
  readOnly: boolean;
  showAvatars?: boolean;
  onShowVoters: (poll: PollT) => void;
  isRefetching?: boolean;
  onRefetch?: () => void;
  bonusPool?: number; // Solo tax bonus pool amount
  bonusDonorName?: string | null; // Name of the donor(s) who contributed
};

export const WhatsAppPollCard: React.FC<WhatAppPollCardProps> = React.memo(
  ({
    poll,
    onShowVoters,
    readOnly,
    showAvatars = false,
    isRefetching = false,
    onRefetch,
    bonusPool = 0,
    bonusDonorName = null,
  }) => {
    const { user } = useAuth();
    const { user: clerkUser } = useUser();
    const queryClient = useQueryClient();
    const isBanned = user?.player?.isBanned || false;
    const isOnboarded = user?.isOnboarded || false;
    const options = poll.options || [];
    const pollId = poll.id;
    const playerId = user?.player?.id || "";

    // Title overflow detection for marquee animation
    const titleRef = React.useRef<HTMLHeadingElement>(null);
    const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);

    useEffect(() => {
      const checkOverflow = () => {
        if (titleRef.current) {
          setIsTitleOverflowing(titleRef.current.scrollWidth > titleRef.current.clientWidth + 10);
        }
      };
      checkOverflow();
      window.addEventListener('resize', checkOverflow);
      return () => window.removeEventListener('resize', checkOverflow);
    }, [poll.question]);

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
      onMutate: async (newVote) => {
        // Optimistically update local state
        setOptimisticVote(newVote);
        setPendingVote(newVote); // Track for loader

        // Cancel any outgoing refetches to prevent overwriting optimistic update
        await queryClient.cancelQueries({ queryKey: ["polls"] });

        // Snapshot the previous value for rollback
        const previousPolls = queryClient.getQueryData(["polls"]);

        // Optimistically update the cache immediately
        queryClient.setQueryData(["polls"], (oldData: any) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((p: any) => {
              if (p.id !== pollId) return p;
              // Update playersVotes for this poll
              const existingVoteIndex = p.playersVotes?.findIndex((v: any) => v.playerId === playerId);
              let updatedVotes = [...(p.playersVotes || [])];

              if (existingVoteIndex >= 0) {
                // Update existing vote - move player to new option
                updatedVotes[existingVoteIndex] = { ...updatedVotes[existingVoteIndex], vote: newVote };
              } else {
                // Add new vote entry (first time voting)
                // Use current user's data from auth context + Clerk for complete display
                updatedVotes.push({
                  id: `optimistic-${Date.now()}`,
                  playerId,
                  vote: newVote,
                  createdAt: new Date().toISOString(),
                  player: {
                    characterImage: user?.player?.characterImage || null,
                    imageUrl: clerkUser?.imageUrl || null, // Clerk profile image for instant display
                    user: {
                      displayName: user?.displayName || null,
                      userName: user?.userName || ''
                    },
                    hasRoyalPass: false, // Not available in auth context, will update on refetch
                  }
                });
              }
              return { ...p, playersVotes: updatedVotes };
            }),
          };
        });

        // Return context with previous data for rollback
        return { previousPolls };
      },
      onSuccess: (data) => {
        if (data.success) {
          toast.success(data.message);
          // Clear pending state - cache already updated in onMutate
          setPendingVote(null);

          // If user just won lucky voter lottery, update poll cache immediately
          // so the lucky winner theme shows instantly without refresh
          const responseData = data.data as { isLuckyVoter?: boolean; isBirthdayPlayer?: boolean } | null;
          if (responseData?.isLuckyVoter && playerId) {
            queryClient.setQueryData(["polls"], (oldData: any) => {
              if (!oldData?.data) return oldData;
              return {
                ...oldData,
                data: oldData.data.map((p: any) => {
                  if (p.id !== pollId) return p;
                  return { ...p, luckyVoterId: playerId };
                }),
              };
            });
          }
        } else {
          // Revert on failure - go back to server state
          setPendingVote(null);
          setOptimisticVote(null);
          // Invalidate to refetch correct data
          queryClient.invalidateQueries({ queryKey: ["polls"] });
          toast.error(data.message);
        }
      },
      onError: (error: any, newVote, context) => {
        // Log detailed error for debugging
        console.error('[Vote Failed]', {
          pollId,
          playerId,
          attemptedVote: newVote,
          error: error?.message || error,
          response: error?.response?.data || null,
          timestamp: new Date().toISOString(),
        });

        // Revert to previous state on error
        if (context?.previousPolls) {
          queryClient.setQueryData(["polls"], context.previousPolls);
        }
        setPendingVote(null);
        setOptimisticVote(null);

        // Show error message from API or fallback
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to vote. Please try again.";
        toast.error(errorMessage);
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
      // Block voting for non-onboarded users, banned users, or inactive polls
      if (!pendingVote && !readOnly && !isBanned && isOnboarded && poll.isActive) {
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

    // Calculate dynamic team type based on participant count
    const getDynamicTeamType = (count: number): { type: string; size: number } => {
      if (count < 48) return { type: "DUO", size: 2 };
      if (count < 60) return { type: "TRIO", size: 3 };
      return { type: "SQUAD", size: 4 };
    };

    // Get effective team type and size
    const effectiveTeamInfo = poll.teamType === "DYNAMIC"
      ? getDynamicTeamType(participantCount)
      : { type: poll.teamType || "DUO", size: getTeamSize(poll.teamType || 'DUO') };

    const prizePool = entryFee * participantCount;
    const hasPrizePool = prizePool > 0;
    const teamSize = effectiveTeamInfo.size;

    // Use shared theme utility
    // Check if current user has birthday within ±1 day
    const isBirthdayPlayer = user?.dateOfBirth ? isBirthdayWithinWindow(user.dateOfBirth) : false;
    // Lucky voters and birthday players get special fixed themes
    const isLuckyVoter = poll.luckyVoterId === playerId && !!playerId;

    const theme = isBirthdayPlayer
      ? getBirthdayTheme()
      : isLuckyVoter
        ? getLuckyWinnerTheme()
        : (hasPrizePool ? getPollTheme(participantCount) : null);

    // Show skeleton when refetching
    if (isRefetching) {
      return <PollCardSkeleton />;
    }

    return (
      <div className="max-w-2xl mx-auto">
        {/* Bonus Pool Tag - Outside but attached to poll */}
        {bonusPool > 0 && theme && (
          <div className="flex justify-center mb-[-8px] relative z-10">
            <div className={`inline-flex items-center px-4 py-1.5 rounded-lg bg-gradient-to-r ${theme.header} text-white text-sm font-semibold shadow-lg`}>
              <span>{bonusDonorName || "Community"} donated&nbsp;</span>
              <SlotMachineCounter value={bonusPool} animateFromZero />
              <span>&nbsp;UC</span>
            </div>
          </div>
        )}


        <div className={`relative rounded-xl overflow-hidden transition-all duration-700 ease-in-out ${theme
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
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="overflow-hidden">
                        <h3
                          ref={titleRef}
                          className={`font-semibold text-lg whitespace-nowrap ${isTitleOverflowing ? 'animate-marquee' : ''} ${hasPrizePool ? 'text-white drop-shadow-md' : 'text-gray-900 dark:text-white'}`}
                          title={poll.question}
                        >
                          {poll.question}
                        </h3>
                      </div>
                      <style jsx>{`
                      @keyframes marquee {
                        0%, 15% { transform: translateX(0%); }
                        40%, 60% { transform: translateX(-30%); }
                        85%, 100% { transform: translateX(0%); }
                      }
                      .animate-marquee {
                        display: inline-block;
                        animation: marquee 12s ease-in-out infinite;
                      }
                      @media (min-width: 640px) {
                        .animate-marquee {
                          animation: none;
                          overflow: hidden;
                          text-overflow: ellipsis;
                          display: block;
                        }
                      }
                    `}</style>
                    </div>
                    {/* Badges row */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Days Badge */}
                      {poll?.days ? (
                        <Badge className={`font-bold px-3 py-1 text-xs rounded-md ${theme ? theme.badge : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 animate-pulse'}`}>
                          {poll.days}
                        </Badge>
                      ) : poll?.createdAt ? (
                        <Badge className={`font-bold px-3 py-1 text-xs rounded-md ${theme ? theme.badge : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 animate-pulse'}`}>
                          {new Date(poll.createdAt).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {/* Prize Pool Display */}
                  {theme && (
                    <>
                      <div className="mt-3 flex items-center justify-center gap-3">
                        <span className="text-3xl">🏆</span>
                        <div className="text-center">
                          <p className="text-xs font-medium text-white/80 uppercase tracking-widest">Prize Pool</p>
                          <p className="text-2xl font-black text-white drop-shadow-lg inline-flex items-center">
                            <SlotMachineCounter
                              value={prizePool + bonusPool}
                              animateFromZero
                            />
                            <span className="ml-1">UC</span>
                          </p>
                        </div>
                      </div>
                      {/* Info icon in bottom right corner - Aceternity style */}
                      <PrizeBreakdownTooltip prizePool={prizePool} entryFee={entryFee} teamSize={teamSize} theme={theme} onDoubleTap={onRefetch} />
                      {/* Team Type in bottom left */}
                      {poll?.teamType && (
                        <div className="absolute bottom-2 left-3">
                          <Badge className="font-bold px-2 py-1 text-xs rounded-md bg-white/25 text-white border border-white/30 backdrop-blur-sm">
                            {effectiveTeamInfo.type}
                          </Badge>
                        </div>
                      )}
                    </>
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

              // Get current user's info - prefer server data, fall back to auth data for instant avatar
              const currentUserInfo = playersVotes?.find((v) => v.playerId === playerId);
              const currentUserAvatarData = currentUserInfo ? {
                id: currentUserInfo.id,
                imageUrl: (currentUserInfo.player as any)?.imageUrl || null,

                displayName: currentUserInfo.player?.user?.displayName || null,
                userName: currentUserInfo.player?.user?.userName || '',
              } : (user?.player ? {
                // Fall back to auth data + Clerk for instant avatar display
                id: `auth-${playerId}`,
                imageUrl: clerkUser?.imageUrl || null,

                displayName: user.displayName || null,
                userName: user.userName || '',
              } : null);

              const recentVoters = [
                // Show current user if they voted for this option (optimistically determined)
                ...(showCurrentUserHere && currentUserAvatarData ? [currentUserAvatarData] : []),
                ...otherVoters.slice(0, showCurrentUserHere ? 1 : 2).map((v) => ({
                  id: v.id,
                  imageUrl: (v.player as any)?.imageUrl || null,

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
                  isDisabled={!poll.isActive || !!readOnly || isBanned || !isOnboarded}
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
                  {isBirthdayPlayer && entryFee > 0 ? (
                    <span className="text-pink-500 dark:text-pink-400 font-semibold">
                      🎂 Happy Birthday! FREE ENTRY: <span className="line-through opacity-60">{entryFee}</span> 0 UC
                    </span>
                  ) : isLuckyVoter && entryFee > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      🎉 Congratulations! FREE ENTRY: <span className="line-through opacity-60">{entryFee}</span> 0 UC
                    </span>
                  ) : entryFee > 0 ? `Entry: ${entryFee} UC` : 'Free Entry'}
                </span>
              </div>



              {onShowVoters && (
                <button
                  type="button"
                  onClick={() => onShowVoters(poll)}
                  disabled={isLoadingVotes}
                  className={`w-full text-center font-medium py-2.5 px-4 rounded-xl transition-all border shadow-sm ${isLoadingVotes
                    ? "text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    : theme
                      ? `${theme.button} border-current/20`
                      : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:shadow-md"
                    }`}
                >
                  {isLoadingVotes ? (
                    <span className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading votes...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <FiUsers className="w-4 h-4" />
                      View all votes
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

WhatsAppPollCard.displayName = "WhatsAppPollCard";
