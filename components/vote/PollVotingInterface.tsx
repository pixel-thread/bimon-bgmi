// components/vote/PollVotingInterface.tsx

"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useTournaments } from "@/hooks/useTournaments";
import { pollService } from "@/lib/pollService";
import {
  calculateRemainingBanDuration,
  formatRemainingBanDuration,
} from "@/utils/banUtils";
import { Poll, PollVote } from "@/lib/types";
import {
  FiClock,
  FiUsers,
  FiUserX,
  FiEdit,
  FiTrash2,
  FiPower,
} from "react-icons/fi";
import {
  tournamentParticipationService,
  TournamentParticipant,
} from "@/lib/tournamentParticipationService";
import {
  ErrorHandler,
  ErrorCategory,
  createVotingError,
} from "@/lib/errorHandling";
import { useSingleLoadingState } from "@/lib/loadingStates";
import { VotersDialog } from "./VotersDialog";
import { WhatsAppPollCard } from "./WhatsAppPollCard";
import { LoaderFive } from "@/components/ui/loader";

export interface PollVotingInterfaceProps {
  readOnly?: boolean;
  showAdminActions?: boolean;
  showViewAllVotes?: boolean;
  onEditPoll?: (poll: Poll) => void;
  onDeletePoll?: (poll: Poll) => void;
  onTogglePollStatus?: (poll: Poll) => void;
  title?: string;
  description?: string;
}

const PollVotingInterface: React.FC<PollVotingInterfaceProps> = ({
  readOnly = false,
  showAdminActions = false,
  showViewAllVotes = false,
  onEditPoll,
  onDeletePoll,
  onTogglePollStatus,
  title = "Tournament Polls",
  description = "Vote on active tournament polls",
}) => {
  const { playerUser, isPlayer } = useAuth();
  const { tournaments } = useTournaments();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, PollVote>>({});
  const [voteCounts, setVoteCounts] = useState<
    Record<string, Record<string, number>>
  >({});
  const [savingVotes, setSavingVotes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [allVotes, setAllVotes] = useState<Record<string, PollVote[]>>({});
  const [tournamentParticipants, setTournamentParticipants] = useState<
    Record<string, TournamentParticipant[]>
  >({});

  // Track optimistic updates to prevent conflicts with real-time updates
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Record<string, PollVote | null>
  >({});
  const [optimisticVoteCounts, setOptimisticVoteCounts] = useState<
    Record<string, Record<string, number>>
  >({});
  const [optimisticAllVotes, setOptimisticAllVotes] = useState<
    Record<string, PollVote[]>
  >({});
  const pendingOperations = useRef<Record<string, AbortController>>({});
  const lastClickTime = useRef<Record<string, number>>({});
  const submittingRef = useRef<string | null>(null);
  const [showVotersDialog, setShowVotersDialog] = useState<{
    isOpen: boolean;
    pollId: string;
    pollQuestion: string;
    option: string;
  }>({
    isOpen: false,
    pollId: "",
    pollQuestion: "",
    option: "",
  });

  // Loading state for vote submission
  const voteLoadingState = useSingleLoadingState("vote-submission");

  // Loading state for viewing votes
  const [loadingVotesForPoll, setLoadingVotesForPoll] = useState<string | null>(
    null
  );

  // Notifications removed

  // Get optimistic vote counts (combines real data with optimistic updates)
  const getOptimisticVoteCounts = useCallback(
    (pollId: string) => {
      const realCounts = voteCounts[pollId] || {};
      const optimisticCounts = optimisticVoteCounts[pollId];
      return optimisticCounts || realCounts;
    },
    [voteCounts, optimisticVoteCounts]
  );

  // Get optimistic all votes (combines real data with optimistic updates)
  const getOptimisticAllVotes = useCallback(
    (pollId: string) => {
      const realVotes = allVotes[pollId] || [];
      const optimisticVotes = optimisticAllVotes[pollId];
      return optimisticVotes || realVotes;
    },
    [allVotes, optimisticAllVotes]
  );

  // Memoized callback for handling poll updates
  const handlePollsUpdate = useCallback((activePolls: Poll[]) => {
    setPolls(activePolls);
    setLoading(false);
    setError(null);
    setRetryCount(0);
  }, []);

  // Memoized callback for handling votes update - respects optimistic updates
  const handleVotesUpdate = useCallback(
    (votes: Record<string, PollVote>) => {
      setUserVotes((prev) => {
        const newVotes = { ...votes };

        // Apply optimistic updates over real-time updates
        Object.keys(optimisticUpdates).forEach((pollId) => {
          const optimisticVote = optimisticUpdates[pollId];
          if (optimisticVote === null) {
            // Optimistic removal
            delete newVotes[pollId];
          } else if (optimisticVote) {
            // Optimistic vote
            newVotes[pollId] = optimisticVote;
          }
        });

        // Only update if the votes have actually changed
        const prevString = JSON.stringify(prev);
        const newString = JSON.stringify(newVotes);
        if (prevString === newString) {
          return prev;
        }

        return newVotes;
      });
    },
    [optimisticUpdates]
  );

  // Set up real-time listeners for polls and votes with error handling
  useEffect(() => {
    // Only set loading to true if we haven't loaded polls yet
    if (polls.length === 0) {
      setLoading(true);
    }
    setError(null);

    // Real-time listener for active polls using enhanced poll service
    const unsubscribePolls = pollService.subscribeToActivePolls(
      handlePollsUpdate,
      (error) => {
        const appError = ErrorHandler.handle(error, {
          operation: "listen_to_active_polls",
        });
        console.error("Error listening to active polls:", appError);
        setError("Failed to connect to polls");
        setLoading(false);

        // Show error toast for network issues
        if (appError.category === ErrorCategory.NETWORK) {
          ErrorHandler.showError(appError);
        }
      }
    );

    // Real-time listener for user's votes using enhanced poll service (only if player is logged in)
    let unsubscribeVotes = () => {};
    if (isPlayer && playerUser) {
      unsubscribeVotes = pollService.subscribeToUserVotes(
        playerUser.id,
        handleVotesUpdate,
        (error) => {
          const appError = ErrorHandler.handle(error, {
            operation: "listen_to_user_votes",
            playerId: playerUser.id,
          });
          console.error("Error listening to user votes:", appError);

          // Show error toast for network issues
          if (appError.category === ErrorCategory.NETWORK) {
            ErrorHandler.showError(appError);
          }
        }
      );
    }

    // Cleanup listeners on unmount
    return () => {
      unsubscribePolls();
      unsubscribeVotes();
    };
  }, [isPlayer, playerUser, retryCount, handlePollsUpdate, handleVotesUpdate]);

  // Subscribe to vote counts and all votes for polls - only when poll IDs change
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    polls.forEach((poll) => {
      // Subscribe to vote counts
      const unsubscribeVoteCounts = pollService.subscribeToVoteCounts(
        poll.id,
        (counts) => {
          setVoteCounts((prev) => {
            const prevCounts = prev[poll.id] || {};
            const newCountsString = JSON.stringify(counts);
            const prevCountsString = JSON.stringify(prevCounts);

            if (newCountsString === prevCountsString) {
              return prev;
            }

            return {
              ...prev,
              [poll.id]: counts,
            };
          });
        }
      );
      unsubscribers.push(unsubscribeVoteCounts);

      // Subscribe to all votes for this poll to show avatars
      const unsubscribeAllVotes = pollService.subscribeToPollVotes(
        poll.id,
        (votes) => {
          setAllVotes((prev) => {
            const prevVotes = prev[poll.id] || [];
            const newVotesString = JSON.stringify(votes);
            const prevVotesString = JSON.stringify(prevVotes);

            if (newVotesString === prevVotesString) {
              return prev;
            }

            return {
              ...prev,
              [poll.id]: votes,
            };
          });
        }
      );
      unsubscribers.push(unsubscribeAllVotes);

      // Subscribe to tournament participants if this is a tournament poll
      if (poll.type === "tournament_participation" && poll.tournamentId) {
        const unsubscribeParticipants =
          tournamentParticipationService.subscribeToTournamentParticipants(
            poll.tournamentId,
            (participants) => {
              setTournamentParticipants((prev) => {
                const prevParticipants = prev[poll.id] || [];
                const newParticipantsString = JSON.stringify(participants);
                const prevParticipantsString = JSON.stringify(prevParticipants);

                if (newParticipantsString === prevParticipantsString) {
                  return prev;
                }

                return {
                  ...prev,
                  [poll.id]: participants,
                };
              });
            }
          );
        unsubscribers.push(unsubscribeParticipants);
      }
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [polls.map((p) => p.id).join(",")]);

  // Handle vote selection with validation - now allows switching votes
  const handleVoteSelect = useCallback(
    async (pollId: string, option: string) => {
      // Prevent multiple clicks and ensure user is authenticated
      if (readOnly || !playerUser) return;

      // Check if player is banned from voting
      if (playerUser.isBanned) {
        ErrorHandler.showError(
          createVotingError(
            "You are currently banned and cannot vote on polls.",
            new Error("Player is banned from voting")
          )
        );
        return;
      }

      /* ----------  NEW GUARD  ---------- */
      if (submittingRef.current === option) return; // same option already in-flight
      submittingRef.current = option; // mark this option as busy
      /* ---------------------------------- */

      const currentVote = userVotes[pollId];
      const isUnvote = currentVote?.vote === option;

      // Throttle rapid clicks (minimum 100ms between clicks), but allow unvote clicks
      const now = Date.now();
      const lastClick = lastClickTime.current[pollId] || 0;
      if (!isUnvote && now - lastClick < 100) return;
      lastClickTime.current[pollId] = now;

      // If clicking the same option again, remove the vote (inline for better reliability)
      if (isUnvote) {
        // Cancel any pending operation for this poll
        if (pendingOperations.current[pollId]) {
          pendingOperations.current[pollId].abort();
          delete pendingOperations.current[pollId];
        }

        // Create abort controller for this operation
        const abortController = new AbortController();
        pendingOperations.current[pollId] = abortController;

        // Set saving state
        setSavingVotes((prev) => ({ ...prev, [pollId]: true }));

        const currentOption = currentVote.vote;
        const previousCounts = voteCounts[pollId] || {};

        // Set optimistic update to override real-time updates
        setOptimisticUpdates((prev) => ({
          ...prev,
          [pollId]: null, // null means vote was removed
        }));

        // Instantly update UI with optimistic update
        setUserVotes((prev) => {
          const newState = { ...prev };
          delete newState[pollId];
          return newState;
        });

        // Update vote counts optimistically (for instant progress bar updates)
        setOptimisticVoteCounts((prev) => {
          const currentCounts = { ...(voteCounts[pollId] || {}) };
          const newCounts = { ...currentCounts };
          newCounts[currentOption] = Math.max(
            0,
            (newCounts[currentOption] || 0) - 1
          );

          return {
            ...prev,
            [pollId]: newCounts,
          };
        });

        // Update all votes optimistically (for instant avatar updates)
        setOptimisticAllVotes((prev) => {
          const currentVotes = [...(allVotes[pollId] || [])];
          // Remove the user's vote
          const newVotes = currentVotes.filter(
            (vote) => vote.playerId !== playerUser.id
          );

          return {
            ...prev,
            [pollId]: newVotes,
          };
        });

        try {
          // Remove vote in background
          await pollService.removeVote(pollId, playerUser.id);

          // Check if operation was cancelled
          if (abortController.signal.aborted) return;

          // Clear optimistic updates on success
          setOptimisticUpdates((prev) => {
            const newState = { ...prev };
            delete newState[pollId];
            return newState;
          });
          setOptimisticVoteCounts((prev) => {
            const newState = { ...prev };
            delete newState[pollId];
            return newState;
          });
          setOptimisticAllVotes((prev) => {
            const newState = { ...prev };
            delete newState[pollId];
            return newState;
          });
        } catch (error) {
          // Check if operation was cancelled
          if (abortController.signal.aborted) return;

          // Clear all optimistic updates
          setOptimisticUpdates((prev) => {
            const newState = { ...prev };
            delete newState[pollId];
            return newState;
          });
          setOptimisticVoteCounts((prev) => {
            const newState = { ...prev };
            delete newState[pollId];
            return newState;
          });
          setOptimisticAllVotes((prev) => {
            const newState = { ...prev };
            delete newState[pollId];
            return newState;
          });

          // Revert optimistic updates on error
          setUserVotes((prev) => ({
            ...prev,
            [pollId]: currentVote,
          }));

          const appError = ErrorHandler.handle(error, {
            operation: "remove_vote",
            pollId,
            playerId: playerUser.id,
          });
          ErrorHandler.showError(appError);
        } finally {
          // Clean up abort controller
          delete pendingOperations.current[pollId];

          // clear the lock *only* after the network call finishes
          submittingRef.current = null;
          setSavingVotes((prev) => {
            const n = { ...prev };
            delete n[pollId];
            return n;
          });
        }
        return;
      }

      // Cancel any pending operation for this poll
      if (pendingOperations.current[pollId]) {
        pendingOperations.current[pollId].abort();
        delete pendingOperations.current[pollId];
      }

      // Validate that the poll is still active and not expired
      const poll = polls.find((p) => p.id === pollId);
      if (!poll) {
        ErrorHandler.showError(createVotingError("Poll not found"));
        return;
      }

      if (!poll.isActive) {
        ErrorHandler.showError(
          createVotingError("This poll is no longer active")
        );
        return;
      }

      // Create abort controller for this operation
      const abortController = new AbortController();
      pendingOperations.current[pollId] = abortController;

      // Set saving state immediately to prevent double clicks
      setSavingVotes((prev) => ({ ...prev, [pollId]: true }));

      // Create the new vote object
      const newVote: PollVote = {
        id: `temp-${Date.now()}`,
        pollId,
        playerId: playerUser.id,
        playerName: playerUser.name,
        vote: option,
        votedAt: new Date().toISOString(),
        avatarBase64: playerUser.avatarBase64 || undefined,
        avatarUrl: playerUser.avatarUrl || undefined,
      };

      // Store the previous state for potential rollback
      const previousVote = currentVote;
      const previousCounts = voteCounts[pollId] || {};

      // Apply optimistic updates immediately for instant UI response
      setOptimisticUpdates((prev) => ({
        ...prev,
        [pollId]: newVote,
      }));

      setUserVotes((prev) => ({
        ...prev,
        [pollId]: newVote,
      }));

      // Update vote counts optimistically (for instant progress bar updates)
      setOptimisticVoteCounts((prev) => {
        const currentCounts = { ...(voteCounts[pollId] || {}) };
        const newCounts = { ...currentCounts };

        // Remove old vote count if updating
        if (previousVote) {
          const oldVote = previousVote.vote;
          newCounts[oldVote] = Math.max(0, (newCounts[oldVote] || 0) - 1);
        }

        // Add new vote count
        newCounts[option] = (newCounts[option] || 0) + 1;

        return {
          ...prev,
          [pollId]: newCounts,
        };
      });

      // Update all votes optimistically (for instant avatar updates)
      setOptimisticAllVotes((prev) => {
        const currentVotes = [...(allVotes[pollId] || [])];
        let newVotes = currentVotes;

        // Remove old vote if updating
        if (previousVote) {
          newVotes = newVotes.filter((vote) => vote.playerId !== playerUser.id);
        }

        // Add new vote
        newVotes = [...newVotes, newVote];

        return {
          ...prev,
          [pollId]: newVotes,
        };
      });

      try {
        // Submit vote in background
        await pollService.submitVote(
          pollId,
          playerUser.id,
          playerUser.name,
          option
        );

        // Check if operation was cancelled
        if (abortController.signal.aborted) return;

        // Clear optimistic updates on success - let real-time updates take over
        setOptimisticUpdates((prev) => {
          const newState = { ...prev };
          delete newState[pollId];
          return newState;
        });
        setOptimisticVoteCounts((prev) => {
          const newState = { ...prev };
          delete newState[pollId];
          return newState;
        });
        setOptimisticAllVotes((prev) => {
          const newState = { ...prev };
          delete newState[pollId];
          return newState;
        });
      } catch (error) {
        // Check if operation was cancelled
        if (abortController.signal.aborted) return;
        // Clear all optimistic updates
        setOptimisticUpdates((prev) => {
          const newState = { ...prev };
          delete newState[pollId];
          return newState;
        });
        setOptimisticVoteCounts((prev) => {
          const newState = { ...prev };
          delete newState[pollId];
          return newState;
        });
        setOptimisticAllVotes((prev) => {
          const newState = { ...prev };
          delete newState[pollId];
          return newState;
        });

        // Revert optimistic updates on error
        setUserVotes((prev) => {
          const newState = { ...prev };
          if (previousVote) {
            newState[pollId] = previousVote; // Restore old vote
          } else {
            delete newState[pollId]; // Remove new vote
          }
          return newState;
        });

        const appError = ErrorHandler.handle(error, {
          operation: "submit_vote",
          pollId,
          playerId: playerUser.id,
          vote: option,
        });
        ErrorHandler.showError(appError);
      } finally {
        // clear the lock *only* after the network call finishes
        submittingRef.current = null;
        setSavingVotes((prev) => {
          const n = { ...prev };
          delete n[pollId];
          return n;
        });
      }
    },
    [readOnly, playerUser, userVotes, polls, voteCounts]
  );

  // Show voters dialog
  const showVoters = useCallback(
    (pollId: string, pollQuestion: string, option: string) => {
      // Set loading state for this poll
      setLoadingVotesForPoll(pollId);

      // Small delay to show loading state, then open dialog
      setTimeout(() => {
        setShowVotersDialog({
          isOpen: true,
          pollId,
          pollQuestion,
          option,
        });
        setLoadingVotesForPoll(null);
      }, 300);
    },
    []
  );

  // Close voters dialog
  const closeVotersDialog = useCallback(() => {
    setShowVotersDialog({
      isOpen: false,
      pollId: "",
      pollQuestion: "",
      option: "",
    });
  }, []);

  // Retry loading polls
  const retryLoadPolls = () => {
    setRetryCount((prev) => prev + 1);
    setError(null);
    setLoading(true);
  };

  // Format date for admin view
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Admin Poll Card replaced by unified WhatsAppPollCard via memoized map below

  // Memoize the polls list to prevent re-rendering on dialog state changes
  // Sort polls ascending (oldest first) for player view
  const sortedPolls = useMemo(() => {
    return [...polls].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [polls]);

  // Admin filter: 'active', 'inactive', 'all' (default: 'active')
  const [adminPollFilter, setAdminPollFilter] = useState<
    "active" | "inactive" | "all"
  >("active");
  const filteredPolls = useMemo(() => {
    if (showAdminActions) {
      if (adminPollFilter === "active")
        return sortedPolls.filter((p) => p.isActive);
      if (adminPollFilter === "inactive")
        return sortedPolls.filter((p) => !p.isActive);
      // 'all' returns everything
    }
    return sortedPolls;
  }, [sortedPolls, showAdminActions, adminPollFilter]);

  const memoizedPolls = useMemo(() => {
    return filteredPolls.map((poll) => {
      const loadingOptionForPoll = savingVotes[poll.id]
        ? userVotes[poll.id]?.vote
        : undefined;
      return (
        <WhatsAppPollCard
          key={poll.id}
          poll={poll}
          userVote={userVotes[poll.id]}
          onVote={handleVoteSelect}
          isDisabled={
            Boolean(readOnly) || !playerUser || Boolean(playerUser?.isBanned)
          }
          readOnly={readOnly}
          showViewAllVotes={showViewAllVotes}
          showAvatars={false} // Disable avatars for performance
          showAdminActions={showAdminActions}
          onEditPoll={onEditPoll}
          onDeletePoll={onDeletePoll}
          onTogglePollStatus={onTogglePollStatus}
          voteCounts={getOptimisticVoteCounts(poll.id)}
          loadingOption={loadingOptionForPoll}
          allVotes={getOptimisticAllVotes(poll.id)}
          onShowVoters={showVoters}
          isLoadingVotes={loadingVotesForPoll === poll.id}
        />
      );
    });
  }, [
    polls,
    showAdminActions,
    showViewAllVotes,
    handleVoteSelect,
    userVotes,
    readOnly,
    playerUser?.isBanned,
    getOptimisticVoteCounts,
    getOptimisticAllVotes,
    savingVotes,
    showVoters,
    onEditPoll,
    onDeletePoll,
    onTogglePollStatus,
    loadingVotesForPoll,
  ]);

  // Render content based on state - all hooks must be called before any returns
  const renderContent = () => {
    // Only require player login for voting, not for viewing
    if (!isPlayer && !showViewAllVotes && !showAdminActions) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <FiUsers className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Player Login Required
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Please log in as a player to participate in tournament voting.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (loading) {
      return (
        <div className="min-h-[400px] bg-background flex items-center justify-center">
          <LoaderFive text="Loading Polls..." />
        </div>
      );
    }

    if (error) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg
                className="h-12 w-12 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Failed to Load Polls
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={retryLoadPolls} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (filteredPolls.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[200px] w-full">
          <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm p-6 max-w-sm w-full transition-all duration-300 hover:shadow-md">
            <div className="flex flex-col items-center text-center">
              <FiClock className="h-10 w-10 text-gray-500 dark:text-gray-400 mb-3 animate-pulse" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                No Active Polls
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Sa check next tournament.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 flex-shrink-0 ml-2">
            <FiUsers className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">{polls.length} Active</span>
            <span className="sm:hidden">{polls.length}</span>
          </Badge>
        </div>

        {/* Banned Player Warning */}
        {playerUser?.isBanned && !showAdminActions && (
          <Card className="border-red-300 bg-red-50/80 shadow-sm shadow-red-200/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FiUserX className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-1">
                    You are currently banned from voting
                  </h3>
                  <p className="text-sm text-red-700 mb-2">
                    <strong>Reason:</strong> {playerUser.banReason}
                  </p>
                  <p className="text-sm text-red-700 mb-2">
                    <strong>Duration:</strong> {playerUser.banDuration}{" "}
                    tournaments
                  </p>
                  <p className="text-sm text-red-700 mb-2">
                    <strong>Remaining:</strong>{" "}
                    {(() => {
                      const banInfo = calculateRemainingBanDuration(
                        playerUser,
                        tournaments
                      );
                      if (banInfo.isExpired) {
                        return (
                          <span className="text-green-600 font-medium">
                            Ban has expired
                          </span>
                        );
                      }
                      return formatRemainingBanDuration(
                        banInfo.remainingDuration || 0
                      );
                    })()}
                  </p>
                  {playerUser.bannedAt && (
                    <p className="text-sm text-red-700">
                      <strong>Banned on:</strong>{" "}
                      {new Date(playerUser.bannedAt).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-xs text-red-600 mt-2 italic">
                    You can view polls but cannot vote until your ban is lifted.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin: Poll Filter Dropdown */}
        {showAdminActions && (
          <div className="flex justify-end mb-2">
            <select
              className="border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={adminPollFilter}
              onChange={(e) =>
                setAdminPollFilter(
                  e.target.value as "active" | "inactive" | "all"
                )
              }
            >
              <option value="active">Active Polls</option>
              <option value="inactive">Inactive Polls</option>
              <option value="all">All Polls</option>
            </select>
          </div>
        )}
        {/* Polls List */}
        <div className="space-y-4">{memoizedPolls}</div>

        {/* Voters Dialog */}
        <VotersDialog
          isOpen={showVotersDialog.isOpen}
          onClose={closeVotersDialog}
          pollId={showVotersDialog.pollId}
          pollQuestion={showVotersDialog.pollQuestion}
          option={showVotersDialog.option}
          allVotes={getOptimisticAllVotes(showVotersDialog.pollId)}
          voteCounts={getOptimisticVoteCounts(showVotersDialog.pollId)}
        />
      </div>
    );
  };

  return renderContent();
};

export default PollVotingInterface;
