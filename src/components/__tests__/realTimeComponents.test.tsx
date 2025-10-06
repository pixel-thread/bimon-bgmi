import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Mock Firebase first
vi.mock("../../lib/firebase", () => ({
  db: {},
  auth: {},
}));

vi.mock("firebase/firestore", () => ({
  onSnapshot: vi.fn(),
  query: vi.fn(),
  collection: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
}));

import { VoteTab } from "../vote";
import RealTimeDashboard from "../admin/RealTimeDashboard";
import { useAuth } from "../../hooks/useAuth";
import { pollService } from "../../lib/pollService";
import { Poll, PollVote } from "../../lib/types";

// Mock dependencies
vi.mock("../../hooks/useAuth");
vi.mock("../../lib/pollService");
vi.mock("../../lib/errorHandling", () => ({
  ErrorHandler: {
    handle: vi.fn((error) => error),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
  },
  ErrorCategory: {
    NETWORK: "network",
  },
  createVotingError: vi.fn((message) => new Error(message)),
  handleAsync: vi.fn(async (promise) => {
    try {
      const result = await promise;
      return [result, null];
    } catch (error) {
      return [null, error];
    }
  }),
}));

vi.mock("../../lib/loadingStates", () => ({
  useSingleLoadingState: vi.fn(() => ({
    isLoading: false,
    startLoading: vi.fn(),
    stopLoading: vi.fn(),
  })),
  useLoadingState: vi.fn(() => ({
    isLoading: false,
    startLoading: vi.fn(),
    stopLoading: vi.fn(),
  })),
  LoadingOperation: {
    SUBMIT_VOTE: "submit_vote",
    CREATE_POLL: "create_poll",
    UPDATE_POLL: "update_poll",
    DELETE_POLL: "delete_poll",
  },
}));

const mockUseAuth = useAuth as Mock;
const mockPollService = pollService as any;

describe("Real-time Components", () => {
  const mockPlayer = {
    id: "player1",
    name: "Test Player",
    hasVoted: false,
    loginPassword: "password",
  };

  const mockPolls: Poll[] = [
    {
      id: "poll1",
      question: "Do you want to participate in the tournament?",
      type: "yes_no",
      options: ["Yes", "No"],
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      createdBy: "admin1",
    },
    {
      id: "poll2",
      question: "What time works best?",
      type: "multiple_choice",
      options: ["Morning", "Afternoon", "Evening"],
      isActive: true,
      createdAt: "2024-01-01T01:00:00Z",
      createdBy: "admin1",
    },
  ];

  const mockVotes: Record<string, PollVote> = {
    poll1: {
      id: "vote1",
      pollId: "poll1",
      playerId: "player1",
      playerName: "Test Player",
      vote: "Yes",
      votedAt: "2024-01-01T00:30:00Z",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default auth mock
    mockUseAuth.mockReturnValue({
      playerUser: mockPlayer,
      isPlayer: true,
      user: null,
      role: "player",
    });

    // Default notifications mock
    // Notifications removed; keep defaults

    // Default poll service mocks
    mockPollService.subscribeToActivePolls = vi.fn((callback) => {
      callback(mockPolls);
      return vi.fn(); // unsubscribe function
    });

    mockPollService.subscribeToUserVotes = vi.fn((playerId, callback) => {
      callback(mockVotes);
      return vi.fn(); // unsubscribe function
    });

    mockPollService.subscribeToAllPolls = vi.fn((callback) => {
      callback(mockPolls);
      return vi.fn(); // unsubscribe function
    });

    mockPollService.subscribeToAllVotes = vi.fn((callback) => {
      callback([]);
      return vi.fn(); // unsubscribe function
    });

    mockPollService.submitVote = vi.fn().mockResolvedValue(undefined);
  });

  describe("VoteTab Real-time Updates", () => {
    it("should subscribe to active polls on mount", async () => {
      render(<VoteTab />);

      await waitFor(() => {
        expect(mockPollService.subscribeToActivePolls).toHaveBeenCalledWith(
          expect.any(Function),
          expect.any(Function)
        );
      });
    });

    it("should subscribe to user votes on mount", async () => {
      render(<VoteTab />);

      await waitFor(() => {
        expect(mockPollService.subscribeToUserVotes).toHaveBeenCalledWith(
          mockPlayer.id,
          expect.any(Function),
          expect.any(Function)
        );
      });
    });

    it("should display real-time poll updates", async () => {
      render(<VoteTab />);

      await waitFor(() => {
        expect(
          screen.getByText("Do you want to participate in the tournament?")
        ).toBeInTheDocument();
        expect(screen.getByText("What time works best?")).toBeInTheDocument();
      });
    });

    it("should show voted status for polls user has voted on", async () => {
      render(<VoteTab />);

      await waitFor(() => {
        expect(screen.getByText("Voted")).toBeInTheDocument();
        expect(screen.getByText("Your vote: Yes")).toBeInTheDocument();
      });
    });

    it("should handle real-time poll updates", async () => {
      const { rerender } = render(<VoteTab />);

      // Simulate new poll being added
      const updatedPolls = [
        ...mockPolls,
        {
          id: "poll3",
          question: "New poll question?",
          type: "yes_no_maybe",
          options: ["Yes", "No", "Maybe"],
          isActive: true,
          createdAt: "2024-01-01T02:00:00Z",
          createdBy: "admin1",
        },
      ];

      mockPollService.subscribeToActivePolls.mockImplementation((callback) => {
        callback(updatedPolls);
        return vi.fn();
      });

      rerender(<VoteTab />);

      await waitFor(() => {
        expect(screen.getByText("New poll question?")).toBeInTheDocument();
      });
    });

    it("should handle voting errors gracefully", async () => {
      mockPollService.submitVote.mockRejectedValue(new Error("Network error"));

      render(<VoteTab />);

      await waitFor(() => {
        const yesButton = screen.getAllByText("Yes")[0];
        fireEvent.click(yesButton);
      });

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText("Confirm Your Vote")).toBeInTheDocument();
      });

      const confirmButton = screen.getByText("Confirm Vote");
      fireEvent.click(confirmButton);

      // Error should be handled (mocked error handler should be called)
      await waitFor(() => {
        expect(mockPollService.submitVote).toHaveBeenCalled();
      });
    });

    it("should unsubscribe from listeners on unmount", () => {
      const mockUnsubscribePolls = vi.fn();
      const mockUnsubscribeVotes = vi.fn();

      mockPollService.subscribeToActivePolls.mockReturnValue(
        mockUnsubscribePolls
      );
      mockPollService.subscribeToUserVotes.mockReturnValue(
        mockUnsubscribeVotes
      );

      const { unmount } = render(<VoteTab />);

      unmount();

      expect(mockUnsubscribePolls).toHaveBeenCalled();
      expect(mockUnsubscribeVotes).toHaveBeenCalled();
    });
  });

  describe("RealTimeDashboard Real-time Updates", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        playerUser: null,
        isPlayer: false,
        user: { uid: "admin1" },
        role: "super_admin",
      });
    });

    it("should subscribe to all polls and votes on mount", async () => {
      render(<RealTimeDashboard />);

      await waitFor(() => {
        expect(mockPollService.subscribeToAllPolls).toHaveBeenCalledWith(
          expect.any(Function),
          expect.any(Function)
        );
        expect(mockPollService.subscribeToAllVotes).toHaveBeenCalledWith(
          expect.any(Function),
          expect.any(Function)
        );
      });
    });

    it("should display real-time statistics", async () => {
      render(<RealTimeDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Total Polls")).toBeInTheDocument();
        expect(screen.getByText("Active Polls")).toBeInTheDocument();
        expect(screen.getByText("Total Votes")).toBeInTheDocument();
        expect(screen.getByText("Recent Votes")).toBeInTheDocument();
        expect(screen.getByText("Unique Voters")).toBeInTheDocument();
      });
    });

    it("should show monitoring status", async () => {
      render(<RealTimeDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Monitoring")).toBeInTheDocument();
      });
    });

    it("should allow toggling monitoring", async () => {
      render(<RealTimeDashboard />);

      const monitoringButton = await screen.findByText("Monitoring");
      fireEvent.click(monitoringButton);

      await waitFor(() => {
        expect(screen.getByText("Paused")).toBeInTheDocument();
      });
    });

    it("should display recent activity", async () => {
      render(<RealTimeDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Recent Activity")).toBeInTheDocument();
      });
    });

    // Notifications removed: related test skipped

    it("should handle refresh functionality", async () => {
      mockPollService.getAllPolls = vi.fn().mockResolvedValue(mockPolls);

      render(<RealTimeDashboard />);

      const refreshButton = await screen.findByText("Refresh");
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockPollService.getAllPolls).toHaveBeenCalled();
      });
    });

    it("should display active polls summary", async () => {
      render(<RealTimeDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Active Polls Summary")).toBeInTheDocument();
        expect(
          screen.getByText("Do you want to participate in the tournament?")
        ).toBeInTheDocument();
        expect(screen.getByText("What time works best?")).toBeInTheDocument();
      });
    });

    it("should unsubscribe from listeners on unmount", () => {
      const mockUnsubscribePolls = vi.fn();
      const mockUnsubscribeVotes = vi.fn();

      mockPollService.subscribeToAllPolls.mockReturnValue(mockUnsubscribePolls);
      mockPollService.subscribeToAllVotes.mockReturnValue(mockUnsubscribeVotes);

      const { unmount } = render(<RealTimeDashboard />);

      unmount();

      expect(mockUnsubscribePolls).toHaveBeenCalled();
      expect(mockUnsubscribeVotes).toHaveBeenCalled();
    });
  });

  describe("Error Handling in Real-time Components", () => {
    it("should handle subscription errors in VoteTab", async () => {
      const mockError = new Error("Subscription failed");

      mockPollService.subscribeToActivePolls.mockImplementation(
        (callback, errorCallback) => {
          errorCallback(mockError);
          return vi.fn();
        }
      );

      render(<VoteTab />);

      await waitFor(() => {
        expect(screen.getByText("Failed to Load Polls")).toBeInTheDocument();
        expect(screen.getByText("Try Again")).toBeInTheDocument();
      });
    });

    it("should handle subscription errors in RealTimeDashboard", async () => {
      const mockError = new Error("Subscription failed");

      mockPollService.subscribeToAllPolls.mockImplementation(
        (callback, errorCallback) => {
          errorCallback(mockError);
          return vi.fn();
        }
      );

      mockUseAuth.mockReturnValue({
        playerUser: null,
        isPlayer: false,
        user: { uid: "admin1" },
        role: "super_admin",
      });

      render(<RealTimeDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to connect to polls")
        ).toBeInTheDocument();
      });
    });

    it("should retry failed connections", async () => {
      let callCount = 0;
      mockPollService.subscribeToActivePolls.mockImplementation(
        (callback, errorCallback) => {
          if (callCount === 0) {
            errorCallback(new Error("Network error"));
          } else {
            callback(mockPolls);
          }
          callCount++;
          return vi.fn();
        }
      );

      render(<VoteTab />);

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText("Try Again")).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByText("Try Again");
      fireEvent.click(retryButton);

      // Should show polls after retry
      await waitFor(() => {
        expect(
          screen.getByText("Do you want to participate in the tournament?")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Performance and Memory Management", () => {
    it("should not create multiple subscriptions for the same component", () => {
      const { rerender } = render(<VoteTab />);

      // Initial render should create subscriptions
      expect(mockPollService.subscribeToActivePolls).toHaveBeenCalledTimes(1);
      expect(mockPollService.subscribeToUserVotes).toHaveBeenCalledTimes(1);

      // Rerender with same props should not create new subscriptions
      rerender(<VoteTab />);

      expect(mockPollService.subscribeToActivePolls).toHaveBeenCalledTimes(1);
      expect(mockPollService.subscribeToUserVotes).toHaveBeenCalledTimes(1);
    });

    it("should handle rapid updates without performance issues", async () => {
      let updateCount = 0;
      const maxUpdates = 10;

      mockPollService.subscribeToActivePolls.mockImplementation((callback) => {
        const interval = setInterval(() => {
          if (updateCount < maxUpdates) {
            callback([
              ...mockPolls,
              {
                id: `poll-${updateCount}`,
                question: `Dynamic poll ${updateCount}?`,
                type: "yes_no",
                options: ["Yes", "No"],
                isActive: true,
                createdAt: new Date().toISOString(),
                createdBy: "admin1",
              },
            ]);
            updateCount++;
          } else {
            clearInterval(interval);
          }
        }, 10);

        return () => clearInterval(interval);
      });

      render(<VoteTab />);

      // Wait for updates to complete
      await waitFor(
        () => {
          expect(updateCount).toBe(maxUpdates);
        },
        { timeout: 1000 }
      );

      // Component should still be responsive
      expect(screen.getByText("Tournament Polls")).toBeInTheDocument();
    });
  });
});
