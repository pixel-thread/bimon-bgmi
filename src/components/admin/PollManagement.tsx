"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { pollService } from "@/src/lib/pollService";
import { Poll, PollVote, TournamentConfig } from "@/src/lib/types";
import { useAuth } from "@/src/hooks/useAuth";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import TournamentSelector from "@/src/components/TournamentSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  ChevronDown,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Users,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/src/components/ui/pagination";
import { VotersDialog } from "@/src/components/vote/VotersDialog";
import { WhatsAppPollCard } from "@/src/components/vote/WhatsAppPollCard";
import { Calendar } from "@/src/components/ui/calendar";
import {
  ErrorHandler,
  createValidationError,
  handleAsync,
} from "@/src/lib/errorHandling";
import { useLoadingState, LoadingOperation } from "@/src/lib/loadingStates";
import {
  useFormValidation,
  PollValidationSchemas,
  validatePollOption,
} from "@/src/lib/validation";
import { LoaderFive } from "../ui/loader";

// Define interfaces for type safety
interface PollOption {
  text: string;
  action: "in" | "out" | "solo" | "none";
}

interface PollFormData {
  question: string;
  type: "tournament_participation";
  options: PollOption[];
  tournamentId?: string;
  period?: string;
  date?: string;
}

// Action Dropdown Component
const ActionDropdown: React.FC<{
  value: "in" | "out" | "solo" | "none";
  onChange: (value: "in" | "out" | "solo" | "none") => void;
  className?: string;
}> = ({ value, onChange, className }) => {
  const actionLabels: Record<string, string> = {
    in: "Include",
    out: "Exclude",
    solo: "Solo",
    none: "No Action",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`flex justify-between items-center ${
            className || "w-full"
          }`}
        >
          <span>{actionLabels[value]}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
        <DropdownMenuLabel>Select Action</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {["in", "out", "solo", "none"].map((action) => (
          <DropdownMenuItem
            key={action}
            onClick={() => onChange(action as "in" | "out" | "solo" | "none")}
            className="cursor-pointer"
          >
            <span
              className={`mr-2 ${
                action === "in"
                  ? "text-green-600"
                  : action === "out"
                  ? "text-red-600"
                  : action === "solo"
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            >
              {action === "in"
                ? "✓"
                : action === "out"
                ? "✗"
                : action === "solo"
                ? "👤"
                : "○"}
            </span>
            {actionLabels[action]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const PollManagement: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [tournaments, setTournaments] = useState<TournamentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [voteCounts, setVoteCounts] = useState<
    Record<string, Record<string, number>>
  >({});
  const [allVotes, setAllVotes] = useState<Record<string, PollVote[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [adminPollFilter, setAdminPollFilter] = useState<
    "active" | "inactive" | "all"
  >("active");

  const adminFilterLabels = {
    active: "Active Polls",
    inactive: "Inactive Polls",
    all: "All Polls",
  };
  const [loadingVotesForPoll, setLoadingVotesForPoll] = useState<string | null>(
    null
  );
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

  const pollsPerPage = 5;
  const { user } = useAuth();
  const loadingState = useLoadingState();
  const formValidation = useFormValidation(PollValidationSchemas.createPoll);

  const [formData, setFormData] = useState<PollFormData>({
    question: "",
    type: "tournament_participation",
    options: [
      { text: "Nga leh", action: "in" },
      { text: "Nga leh rei", action: "out" },
      { text: "Nga leh solo", action: "solo" },
    ],
    period: undefined,
    date: undefined,
  });

  // Reset form with latest tournament
  const resetForm = useCallback(() => {
    const latestTournament = tournaments.length > 0 ? tournaments[0] : null;
    setFormData({
      question: latestTournament ? latestTournament.title : "",
      type: "tournament_participation",
      options: [
        { text: "Nga leh", action: "in" },
        { text: "Nga leh rei", action: "out" },
        { text: "Nga leh solo", action: "solo" },
      ],
      tournamentId: latestTournament?.id,
    });
    formValidation.clearErrors();
  }, [tournaments, formValidation]);

  // Load polls with real-time subscription
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribePolls = pollService.subscribeToAllPolls(
      (pollsData) => {
        setPolls(pollsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        const appError = ErrorHandler.handle(error, {
          operation: "listen_to_all_polls",
        });
        console.error("Error listening to polls:", appError);
        setError("Failed to load polls");
        setLoading(false);
        ErrorHandler.showError(appError);
      }
    );

    return () => unsubscribePolls();
  }, []);

  // Load tournaments
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const tournamentsSnapshot = await getDocs(
          collection(db, "tournaments")
        );
        const tournamentsData = tournamentsSnapshot.docs
          .map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as TournamentConfig)
          )
          .sort((a, b) => {
            if (a.seasonId && b.seasonId && a.seasonId !== b.seasonId) {
              return b.seasonId.localeCompare(a.seasonId);
            }
            return (
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
            );
          });

        setTournaments(tournamentsData);
      } catch (error) {
        console.error("Error loading tournaments:", error);
        ErrorHandler.showError(
          ErrorHandler.handle(error, { operation: "load_tournaments" })
        );
      }
    };

    loadTournaments();
  }, []);

  // Subscribe to vote counts and votes
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    polls.forEach((poll) => {
      const unsubscribeVoteCounts = pollService.subscribeToVoteCounts(
        poll.id,
        (counts) => {
          setVoteCounts((prev) => ({
            ...prev,
            [poll.id]: counts,
          }));
        },
        (error) => {
          console.error("Error subscribing to vote counts:", error);
        }
      );

      const unsubscribeAllVotes = pollService.subscribeToPollVotes(
        poll.id,
        (votes) => {
          setAllVotes((prev) => ({
            ...prev,
            [poll.id]: votes,
          }));
        },
        (error) => {
          console.error("Error subscribing to votes:", error);
        }
      );

      unsubscribers.push(unsubscribeVoteCounts, unsubscribeAllVotes);
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [polls]);

  // Handle modal state cleanup
  useEffect(() => {
    if (!isEditModalOpen && !isCreateModalOpen && !isDeleteModalOpen) {
      document.body.style.overflow = "unset";
      document.body.style.pointerEvents = "auto";
    }
  }, [isEditModalOpen, isCreateModalOpen, isDeleteModalOpen]);

  // Create tournament participation poll
  const createTournamentParticipationPoll = useCallback(
    (tournament: TournamentConfig) => {
      setFormData({
        question: tournament.title,
        type: "tournament_participation",
        options: [
          { text: "Nga leh", action: "in" },
          { text: "Nga leh rei", action: "out" },
          { text: "Nga leh solo", action: "solo" },
        ],
        tournamentId: tournament.id,
      });
      setIsCreateModalOpen(true);
      formValidation.clearErrors();
    },
    [formValidation]
  );

  const handleOptionChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = { ...newOptions[index], text: value };
      return { ...prev, options: newOptions };
    });
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { text: `Option ${prev.options.length + 1}`, action: "none" },
      ],
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  };

  const handleCreatePoll = async () => {
    const operationId = "create-poll";

    if (!user?.uid) {
      ErrorHandler.showError(createValidationError("User not authenticated"));
      return;
    }

    const validation = formValidation.validateForm(formData);
    if (!validation.isValid) {
      ErrorHandler.showError(
        createValidationError(validation.firstError || "Invalid input")
      );
      return;
    }

    for (const option of formData.options) {
      const optionError = validatePollOption(option.text);
      if (optionError) {
        ErrorHandler.showError(createValidationError(optionError));
        return;
      }
    }

    try {
      loadingState.startLoading(
        LoadingOperation.CREATE_POLL,
        undefined,
        operationId
      );

      const pollData: Omit<Poll, "id" | "createdAt"> = {
        question: formData.question,
        type: formData.type,
        options: formData.options,
        isActive: true,
        createdBy: user.uid,
        tournamentId: formData.tournamentId,
        ...(formData.period && { period: formData.period }),
        ...(formData.date && { date: formData.date }),
      };

      await pollService.createPoll(pollData);
      ErrorHandler.showSuccess("Poll created successfully");
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      const appError = ErrorHandler.handle(error, {
        operation: "create_poll",
        question: formData.question,
      });
      ErrorHandler.showError(appError);
    } finally {
      loadingState.stopLoading(operationId);
    }
  };

  const handleEditPoll = async () => {
    if (!selectedPoll || !formData.question.trim()) {
      ErrorHandler.showError(createValidationError("Please enter a question"));
      return;
    }

    const operationId = `edit-poll-${selectedPoll.id}`;

    try {
      loadingState.startLoading(
        LoadingOperation.UPDATE_POLL,
        undefined,
        operationId
      );

      await pollService.updatePoll(selectedPoll.id, {
        question: formData.question || "",
        type: formData.type,
        options: formData.options,
        isActive: selectedPoll.isActive,
        createdBy: selectedPoll.createdBy,
        tournamentId: formData.tournamentId || "",
        period: formData.period || undefined,
        date: formData.date || undefined,
      });

      ErrorHandler.showSuccess("Poll updated successfully");
      setIsEditModalOpen(false);
      setSelectedPoll(null);
      resetForm();
    } catch (error) {
      const appError = ErrorHandler.handle(error, {
        operation: "update_poll",
        pollId: selectedPoll.id,
      });
      ErrorHandler.showError(appError);
    } finally {
      loadingState.stopLoading(operationId);
    }
  };

  const handleToggleStatus = async (poll: Poll) => {
    const operationId = `toggle-status-${poll.id}`;

    try {
      loadingState.startLoading(
        LoadingOperation.UPDATE_POLL,
        undefined,
        operationId
      );

      await pollService.updatePoll(poll.id, { isActive: !poll.isActive });
      ErrorHandler.showSuccess(
        `Poll ${poll.isActive ? "deactivated" : "activated"} successfully`
      );
    } catch (error) {
      const appError = ErrorHandler.handle(error, {
        operation: "toggle_poll_status",
        pollId: poll.id,
      });
      ErrorHandler.showError(appError);
    } finally {
      loadingState.stopLoading(operationId);
    }
  };

  const handleDeletePoll = async () => {
    if (!selectedPoll) return;

    const operationId = `delete-poll-${selectedPoll.id}`;

    try {
      loadingState.startLoading(
        LoadingOperation.DELETE_POLL,
        undefined,
        operationId
      );

      await pollService.deletePoll(selectedPoll.id);
      ErrorHandler.showSuccess("Poll deleted successfully");
      setIsDeleteModalOpen(false);
      setSelectedPoll(null);
    } catch (error) {
      const appError = ErrorHandler.handle(error, {
        operation: "delete_poll",
        pollId: selectedPoll.id,
      });
      ErrorHandler.showError(appError);
    } finally {
      loadingState.stopLoading(operationId);
    }
  };

  const showVoters = async (
    pollId: string,
    pollQuestion: string,
    option: string = ""
  ) => {
    setLoadingVotesForPoll(pollId);

    try {
      const poll = polls.find((p) => p.id === pollId);
      const votes = allVotes[pollId] || [];

      const inferStatus = (voteText: string): "in" | "out" | "solo" => {
        const text = voteText.toLowerCase();
        if (poll && Array.isArray(poll.options)) {
          const opt = poll.options.find(
            (o: any) => (typeof o === "string" ? o : o.text) === voteText
          );
          if (opt && typeof opt === "object" && opt.action) {
            return opt.action as "in" | "out" | "solo";
          }
        }
        if (text.includes("solo")) return "solo";
        if (text.includes("out") || text.includes("rei")) return "out";
        return "in";
      };

      const latestVoteByPlayer: Record<string, PollVote> = {};
      votes.forEach((v) => {
        const current = latestVoteByPlayer[v.playerId];
        if (
          !current ||
          new Date(v.votedAt).getTime() > new Date(current.votedAt).getTime()
        ) {
          latestVoteByPlayer[v.playerId] = v;
        }
      });

      const latestParticipants = Object.values(latestVoteByPlayer)
        .map((v) => ({ ...v, status: inferStatus(v.vote) }))
        .filter((v) => v.status === "in" || v.status === "solo");

      const playersSnapshot = await getDocs(collection(db, "players"));
      const activePlayerIds = new Set<string>();
      playersSnapshot.forEach((doc) => {
        const data = doc.data() as { deleted?: boolean };
        if (!data.deleted) activePlayerIds.add(doc.id);
      });

      const missing = latestParticipants.filter(
        (p) => !activePlayerIds.has(p.playerId)
      );

      if (missing.length > 0) {
        console.warn(
          "[Admin] Participants missing active player records",
          missing.map((m) => ({
            playerId: m.playerId,
            playerName: m.playerName,
            status: m.status,
          }))
        );
      }
    } catch (error) {
      console.error("[Admin] Error computing missing participants:", error);
      ErrorHandler.showError(
        ErrorHandler.handle(error, { operation: "show_voters" })
      );
    } finally {
      setTimeout(() => {
        setShowVotersDialog({
          isOpen: true,
          pollId,
          pollQuestion,
          option,
        });
        setLoadingVotesForPoll(null);
      }, 300);
    }
  };

  const closeVotersDialog = () => {
    setShowVotersDialog({
      isOpen: false,
      pollId: "",
      pollQuestion: "",
      option: "",
    });
  };

  const openEditModal = (poll: Poll) => {
    setIsEditModalOpen(true);
    setSelectedPoll(poll);
    setFormData({
      question: poll.question,
      type: "tournament_participation",
      options: Array.isArray(poll.options)
        ? poll.options.map((opt) =>
            typeof opt === "string" ? { text: opt, action: "none" } : opt
          )
        : [],
    });
  };

  const openDeleteModal = (poll: Poll) => {
    setSelectedPoll(poll);
    setIsDeleteModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 gap-4">
        <LoaderFive text="Loading polls..." />
      </div>
    );
  }

  const filteredPolls = polls.filter((poll) => {
    if (adminPollFilter === "active") return poll.isActive;
    if (adminPollFilter === "inactive") return !poll.isActive;
    return true;
  });

  return (
    <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8 space-y-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Poll Management
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            Create and manage tournament polls
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                {adminFilterLabels[adminPollFilter]}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-full sm:w-[200px]">
              <DropdownMenuLabel>Filter Polls</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setAdminPollFilter("active")}
                className={adminPollFilter === "active" ? "bg-accent" : ""}
              >
                Active Polls
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setAdminPollFilter("inactive")}
                className={adminPollFilter === "inactive" ? "bg-accent" : ""}
              >
                Inactive Polls
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setAdminPollFilter("all")}
                className={adminPollFilter === "all" ? "bg-accent" : ""}
              >
                All Polls
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog
            open={isCreateModalOpen}
            onOpenChange={(open) => {
              setIsCreateModalOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Poll
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl font-semibold">
                  Create New Poll
                </DialogTitle>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Create a tournament participation poll
                </p>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tournament" className="text-sm font-medium">
                    Tournament
                  </Label>
                  <TournamentSelector
                    selected={formData.tournamentId || null}
                    onSelect={(tournamentId) => {
                      const selectedTournament = tournaments.find(
                        (t) => t.id === tournamentId
                      );
                      setFormData((prev) => ({
                        ...prev,
                        tournamentId: tournamentId || undefined,
                        question: selectedTournament
                          ? selectedTournament.title
                          : "",
                      }));
                    }}
                    tournaments={tournaments}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Poll Period or Date
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2 items-start">
                    <select
                      className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                      value={formData.period || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          period: e.target.value || undefined,
                          date: undefined,
                        }))
                      }
                    >
                      <option value="">Select Period (optional)</option>
                      <option value="Mon–Tue">Mon–Tue</option>
                      <option value="Wed–Thu">Wed–Thu</option>
                      <option value="Fri–Sat">Fri–Sat</option>
                    </select>
                    <span className="text-xs text-gray-400 sm:self-center">
                      or
                    </span>
                    <div className="w-full sm:w-fit">
                      <Calendar
                        mode="single"
                        selected={
                          formData.date ? new Date(formData.date) : undefined
                        }
                        onSelect={(date) =>
                          setFormData((prev) => ({
                            ...prev,
                            date: date
                              ? new Date(date.setHours(12, 0, 0, 0))
                                  .toISOString()
                                  .slice(0, 10)
                              : undefined,
                            period: undefined,
                          }))
                        }
                        captionLayout="dropdown"
                        className="rounded-md border w-full"
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    Choose either a period or a specific date for this poll.
                  </span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="question" className="text-sm font-medium">
                    Poll Question
                  </Label>
                  <Textarea
                    id="question"
                    placeholder="Enter your poll question..."
                    value={formData.question}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        question: e.target.value,
                      }))
                    }
                    className="min-h-[80px] resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Poll Options</Label>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <Input
                          value={option.text}
                          onChange={(e) =>
                            handleOptionChange(index, e.target.value)
                          }
                          placeholder={`Option ${index + 1}`}
                          className="flex-1"
                        />
                        <div className="flex items-center gap-2">
                          <ActionDropdown
                            value={option.action}
                            onChange={(action) => {
                              const newOptions = [...formData.options];
                              newOptions[index] = {
                                ...newOptions[index],
                                action,
                              };
                              setFormData((prev) => ({
                                ...prev,
                                options: newOptions,
                              }));
                            }}
                            className="w-full sm:w-32"
                          />
                          {formData.options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(index)}
                              className="px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addOption}
                      className="w-full border-dashed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePoll}
                  disabled={!formData.question || !formData.tournamentId}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm"
                >
                  Create Poll
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Polls List */}
      <div className="space-y-4">
        {filteredPolls.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No polls found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Create a new poll to get started with tournament voting
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Poll
            </Button>
          </div>
        ) : (
          <>
            {filteredPolls
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .slice(
                (currentPage - 1) * pollsPerPage,
                currentPage * pollsPerPage
              )
              .map((poll) => (
                <WhatsAppPollCard
                  key={poll.id}
                  poll={poll}
                  userVote={undefined}
                  onVote={() => {}}
                  isDisabled={true}
                  readOnly={true}
                  showAdminActions={true}
                  showAvatars={false} // Disable avatars for performance
                  onEditPoll={openEditModal}
                  onDeletePoll={openDeleteModal}
                  onTogglePollStatus={handleToggleStatus}
                  voteCounts={voteCounts[poll.id] || {}}
                  loadingOption={undefined}
                  allVotes={allVotes[poll.id] || []}
                  onShowVoters={showVoters}
                  showViewAllVotes={true}
                  isLoadingVotes={loadingVotesForPoll === poll.id}
                />
              ))}
            {filteredPolls.length > pollsPerPage && (
              <Pagination>
                <PaginationContent className="flex-wrap justify-center">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  {Array.from(
                    { length: Math.ceil(filteredPolls.length / pollsPerPage) },
                    (_, i) => i + 1
                  ).map((page) => {
                    const totalPages = Math.ceil(
                      filteredPolls.length / pollsPerPage
                    );
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(
                            Math.ceil(filteredPolls.length / pollsPerPage),
                            prev + 1
                          )
                        )
                      }
                      className={
                        currentPage ===
                        Math.ceil(filteredPolls.length / pollsPerPage)
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>

      {/* Edit Poll Modal */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            setSelectedPoll(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="w-full max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              Edit Poll
            </DialogTitle>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Update your poll question and options
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-question" className="text-sm font-medium">
                Poll Question
              </Label>
              <Textarea
                id="edit-question"
                placeholder="Enter your poll question..."
                value={formData.question}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, question: e.target.value }))
                }
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Poll Options</Label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <Input
                      value={option.text}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <ActionDropdown
                        value={option.action}
                        onChange={(action) => {
                          const newOptions = [...formData.options];
                          newOptions[index] = { ...newOptions[index], action };
                          setFormData((prev) => ({
                            ...prev,
                            options: newOptions,
                          }));
                        }}
                        className="w-full sm:w-32"
                      />
                      {formData.options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="w-full border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedPoll(null);
                resetForm();
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditPoll}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm"
            >
              Update Poll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Voters Dialog */}
      <VotersDialog
        isOpen={showVotersDialog.isOpen}
        onClose={closeVotersDialog}
        pollId={showVotersDialog.pollId}
        pollQuestion={showVotersDialog.pollQuestion}
        option={showVotersDialog.option}
        allVotes={allVotes[showVotersDialog.pollId] || []}
        voteCounts={voteCounts[showVotersDialog.pollId] || {}}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          setIsDeleteModalOpen(open);
          if (!open) setSelectedPoll(null);
        }}
      >
        <DialogContent className="w-full max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Poll
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this poll? This action cannot be
              undone.
            </p>
            {selectedPoll && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="font-medium text-red-900 dark:text-red-100 text-sm">
                  "{selectedPoll.question}"
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedPoll(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePoll}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              Delete Poll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PollManagement;
