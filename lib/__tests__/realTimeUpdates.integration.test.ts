import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";

// Mock Firebase
vi.mock("../firebase", () => ({
  db: {},
}));

// Mock Firestore functions
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

import { pollService } from "../pollService";
import { Poll, PollVote } from "../types";

// Get mocked functions
const { onSnapshot, query, collection, where, orderBy } = await import(
  "firebase/firestore"
);

describe("Real-time Updates Integration", () => {
  let mockUnsubscribe: Mock;
  let mockCallback: Mock;
  let mockErrorCallback: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUnsubscribe = vi.fn();
    mockCallback = vi.fn();
    mockErrorCallback = vi.fn();

    // Setup default mock implementations
    (query as Mock).mockReturnValue({});
    (collection as Mock).mockReturnValue({});
    (where as Mock).mockReturnValue({});
    (orderBy as Mock).mockReturnValue({});
    (onSnapshot as Mock).mockReturnValue(mockUnsubscribe);
  });

  // Notifications removed

  describe("Poll Service Real-time Subscriptions", () => {
    it("should subscribe to active polls and handle updates", () => {
      const mockPolls: Poll[] = [
        {
          id: "poll1",
          question: "Test poll?",
          type: "yes_no",
          options: ["Yes", "No"],
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          createdBy: "admin1",
        },
      ];

      // Mock snapshot with polls data
      const mockSnapshot = {
        docs: mockPolls.map((poll) => ({
          id: poll.id,
          data: () => {
            const { id, ...pollData } = poll;
            return pollData;
          },
        })),
      };

      (onSnapshot as Mock).mockImplementation((query, successCallback) => {
        successCallback(mockSnapshot);
        return mockUnsubscribe;
      });

      const unsubscribe = pollService.subscribeToActivePolls(
        mockCallback,
        mockErrorCallback
      );

      expect(onSnapshot).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(mockPolls);
      expect(mockErrorCallback).not.toHaveBeenCalled();

      // Test unsubscribe
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("should handle errors in active polls subscription", () => {
      const mockError = new Error("Firestore error");

      (onSnapshot as Mock).mockImplementation(
        (query, successCallback, errorCallback) => {
          errorCallback(mockError);
          return mockUnsubscribe;
        }
      );

      pollService.subscribeToActivePolls(mockCallback, mockErrorCallback);

      expect(mockErrorCallback).toHaveBeenCalledWith(mockError);
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it("should subscribe to user votes and handle updates", () => {
      const playerId = "player1";
      const mockVotes: PollVote[] = [
        {
          id: "vote1",
          pollId: "poll1",
          playerId,
          playerName: "Test Player",
          vote: "Yes",
          votedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const mockSnapshot = {
        docs: mockVotes.map((vote) => ({
          id: vote.id,
          data: () => {
            const { id, ...voteData } = vote;
            return voteData;
          },
        })),
      };

      (onSnapshot as Mock).mockImplementation((query, successCallback) => {
        successCallback(mockSnapshot);
        return mockUnsubscribe;
      });

      const expectedVotesMap = {
        poll1: mockVotes[0],
      };

      pollService.subscribeToUserVotes(
        playerId,
        mockCallback,
        mockErrorCallback
      );

      expect(mockCallback).toHaveBeenCalledWith(expectedVotesMap);
      expect(mockErrorCallback).not.toHaveBeenCalled();
    });

    it("should subscribe to poll votes and calculate counts", () => {
      const pollId = "poll1";
      const mockVotes: PollVote[] = [
        {
          id: "vote1",
          pollId,
          playerId: "player1",
          playerName: "Player 1",
          vote: "Yes",
          votedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "vote2",
          pollId,
          playerId: "player2",
          playerName: "Player 2",
          vote: "Yes",
          votedAt: "2024-01-01T00:01:00Z",
        },
        {
          id: "vote3",
          pollId,
          playerId: "player3",
          playerName: "Player 3",
          vote: "No",
          votedAt: "2024-01-01T00:02:00Z",
        },
      ];

      const mockSnapshot = {
        docs: mockVotes.map((vote) => ({
          id: vote.id,
          data: () => {
            const { id, ...voteData } = vote;
            return voteData;
          },
        })),
      };

      (onSnapshot as Mock).mockImplementation((query, successCallback) => {
        successCallback(mockSnapshot);
        return mockUnsubscribe;
      });

      const expectedCounts = {
        Yes: 2,
        No: 1,
      };

      pollService.subscribeToVoteCounts(
        pollId,
        mockCallback,
        mockErrorCallback
      );

      expect(mockCallback).toHaveBeenCalledWith(expectedCounts);
    });
  });

  describe("Error Handling in Real-time Updates", () => {
    it("should handle network errors gracefully", () => {
      const networkError = new Error("Network error");

      (onSnapshot as Mock).mockImplementation(
        (query, successCallback, errorCallback) => {
          errorCallback(networkError);
          return mockUnsubscribe;
        }
      );

      pollService.subscribeToActivePolls(mockCallback, mockErrorCallback);

      expect(mockErrorCallback).toHaveBeenCalledWith(networkError);
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it("should handle malformed data gracefully", () => {
      const mockSnapshot = {
        docs: [
          {
            id: "poll1",
            data: () => {
              throw new Error("Malformed data");
            },
          },
        ],
      };

      (onSnapshot as Mock).mockImplementation((query, successCallback) => {
        successCallback(mockSnapshot);
        return mockUnsubscribe;
      });

      pollService.subscribeToActivePolls(mockCallback, mockErrorCallback);

      expect(mockErrorCallback).toHaveBeenCalled();
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe("Performance and Memory Management", () => {
    it("should properly clean up listeners on unsubscribe", () => {
      const unsubscribe1 = pollService.subscribeToActivePolls(mockCallback);
      const unsubscribe2 = pollService.subscribeToAllPolls(mockCallback);

      // Verify listeners are created
      expect(onSnapshot).toHaveBeenCalledTimes(2);

      // Unsubscribe all
      unsubscribe1();
      unsubscribe2();

      // Verify unsubscribe functions are called
      expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
    });

    it("should handle multiple simultaneous subscriptions", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      const unsubscribe1 = pollService.subscribeToActivePolls(callback1);
      const unsubscribe2 = pollService.subscribeToAllPolls(callback2);
      const unsubscribe3 = pollService.subscribeToUserVotes(
        "player1",
        callback3
      );

      expect(onSnapshot).toHaveBeenCalledTimes(3);

      // Clean up
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    });
  });

  describe("Real-time Data Consistency", () => {
    it("should maintain data consistency across multiple listeners", () => {
      const activeCallback = vi.fn();
      const allCallback = vi.fn();

      const mockPolls: Poll[] = [
        {
          id: "poll1",
          question: "Test poll?",
          type: "yes_no",
          options: ["Yes", "No"],
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          createdBy: "admin1",
        },
      ];

      const mockSnapshot = {
        docs: mockPolls.map((poll) => ({
          id: poll.id,
          data: () => {
            const { id, ...pollData } = poll;
            return pollData;
          },
        })),
      };

      (onSnapshot as Mock).mockImplementation((query, successCallback) => {
        successCallback(mockSnapshot);
        return mockUnsubscribe;
      });

      const unsubscribe1 = pollService.subscribeToActivePolls(activeCallback);
      const unsubscribe2 = pollService.subscribeToAllPolls(allCallback);

      // Both callbacks should receive the same data
      expect(activeCallback).toHaveBeenCalledWith(mockPolls);
      expect(allCallback).toHaveBeenCalledWith(mockPolls);

      unsubscribe1();
      unsubscribe2();
    });
  });
});
