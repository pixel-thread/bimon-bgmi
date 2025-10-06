import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { PollService } from "../pollService";
import { Poll, PollVote } from "../types";

// Mock Firebase functions
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
}));

vi.mock("../firebase", () => ({
  db: {},
}));

describe("PollService", () => {
  let pollService: PollService;

  beforeEach(() => {
    pollService = new PollService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createPoll", () => {
    it("should create a poll successfully", async () => {
      const mockPollData = {
        question: "Will you participate in the tournament?",
        type: "yes_no" as const,
        options: ["Yes", "No"],
        isActive: true,
        createdBy: "admin123",
      };

      const mockDocRef = { id: "poll123" };
      (addDoc as any).mockResolvedValue(mockDocRef);

      const result = await pollService.createPoll(mockPollData);

      expect(addDoc).toHaveBeenCalledWith(
        undefined, // collection reference is mocked as undefined
        expect.objectContaining({
          ...mockPollData,
          createdAt: expect.any(String),
        })
      );
      expect(result).toBe("poll123");
    });

    it("should throw error when creation fails", async () => {
      const mockPollData = {
        question: "Test question",
        type: "yes_no" as const,
        options: ["Yes", "No"],
        isActive: true,
        createdBy: "admin123",
      };

      (addDoc as any).mockRejectedValue(new Error("Firebase error"));

      await expect(pollService.createPoll(mockPollData)).rejects.toThrow(
        "Failed to create poll"
      );
    });
  });

  describe("updatePoll", () => {
    it("should update a poll successfully", async () => {
      const updates = { question: "Updated question", isActive: false };
      (updateDoc as any).mockResolvedValue(undefined);

      await pollService.updatePoll("poll123", updates);

      expect(updateDoc).toHaveBeenCalledWith(undefined, updates);
    });

    it("should throw error when update fails", async () => {
      (updateDoc as any).mockRejectedValue(new Error("Firebase error"));

      await expect(
        pollService.updatePoll("poll123", { isActive: false })
      ).rejects.toThrow("Failed to update poll");
    });
  });

  describe("deletePoll", () => {
    it("should delete poll and associated votes successfully", async () => {
      const mockVotesSnapshot = {
        docs: [{ id: "vote1" }, { id: "vote2" }],
      };

      (getDocs as any).mockResolvedValue(mockVotesSnapshot);
      (deleteDoc as any).mockResolvedValue(undefined);

      await pollService.deletePoll("poll123");

      expect(getDocs).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalledTimes(3); // 2 votes + 1 poll
    });

    it("should throw error when deletion fails", async () => {
      (getDocs as any).mockRejectedValue(new Error("Firebase error"));

      await expect(pollService.deletePoll("poll123")).rejects.toThrow(
        "Failed to delete poll"
      );
    });
  });

  describe("getActivePolls", () => {
    it("should return active polls successfully", async () => {
      const mockPolls = [
        {
          question: "Question 1",
          type: "yes_no",
          options: ["Yes", "No"],
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          createdBy: "admin123",
        },
        {
          question: "Question 2",
          type: "multiple_choice",
          options: ["Option A", "Option B", "Option C"],
          isActive: true,
          createdAt: "2024-01-02T00:00:00Z",
          createdBy: "admin123",
        },
      ];

      const mockSnapshot = {
        docs: [
          {
            id: "poll1",
            data: () => mockPolls[0],
          },
          {
            id: "poll2",
            data: () => mockPolls[1],
          },
        ],
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await pollService.getActivePolls();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("poll2"); // poll2 is newer (2024-01-02)
      expect(result[0].question).toBe("Question 2");
      expect(result[1].id).toBe("poll1"); // poll1 is older (2024-01-01)
      expect(result[1].question).toBe("Question 1");
    });

    it("should throw error when fetching fails", async () => {
      (getDocs as any).mockRejectedValue(new Error("Firebase error"));

      await expect(pollService.getActivePolls()).rejects.toThrow(
        "Failed to fetch active polls"
      );
    });
  });

  describe("getPollResults", () => {
    it("should return poll votes successfully", async () => {
      const mockVotes = [
        {
          pollId: "poll123",
          playerId: "player1",
          playerName: "Player One",
          vote: "Yes",
          votedAt: "2024-01-01T00:00:00Z",
        },
        {
          pollId: "poll123",
          playerId: "player2",
          playerName: "Player Two",
          vote: "No",
          votedAt: "2024-01-01T01:00:00Z",
        },
      ];

      const mockSnapshot = {
        docs: [
          {
            id: "vote1",
            data: () => mockVotes[0],
          },
          {
            id: "vote2",
            data: () => mockVotes[1],
          },
        ],
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await pollService.getPollResults("poll123");

      expect(result).toHaveLength(2);
      expect(result[0].vote).toBe("No"); // "No" vote is newer (2024-01-01T01:00:00Z)
      expect(result[1].vote).toBe("Yes"); // "Yes" vote is older (2024-01-01T00:00:00Z)
    });

    it("should throw error when fetching results fails", async () => {
      (getDocs as any).mockRejectedValue(new Error("Firebase error"));

      await expect(pollService.getPollResults("poll123")).rejects.toThrow(
        "Failed to fetch poll results"
      );
    });
  });

  describe("hasPlayerVoted", () => {
    it("should return true when player has voted", async () => {
      const mockSnapshot = { empty: false };
      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await pollService.hasPlayerVoted("poll123", "player1");

      expect(result).toBe(true);
    });

    it("should return false when player has not voted", async () => {
      const mockSnapshot = { empty: true };
      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await pollService.hasPlayerVoted("poll123", "player1");

      expect(result).toBe(false);
    });

    it("should throw error when check fails", async () => {
      (getDocs as any).mockRejectedValue(new Error("Firebase error"));

      await expect(
        pollService.hasPlayerVoted("poll123", "player1")
      ).rejects.toThrow("Failed to check voting status");
    });
  });

  describe("submitVote", () => {
    it("should submit vote successfully when conditions are met", async () => {
      // Mock hasPlayerVoted to return false
      const mockVoteSnapshot = { empty: true };
      (getDocs as any).mockResolvedValue(mockVoteSnapshot);

      // Mock poll document
      const mockPollDoc = {
        exists: () => true,
        data: () => ({
          isActive: true,
          expiresAt: undefined,
        }),
      };
      (getDoc as any).mockResolvedValue(mockPollDoc);

      // Mock addDoc
      (addDoc as any).mockResolvedValue({ id: "vote123" });

      await pollService.submitVote("poll123", "player1", "Player One", "Yes");

      expect(addDoc).toHaveBeenCalledWith(
        undefined, // collection reference is mocked as undefined
        expect.objectContaining({
          pollId: "poll123",
          playerId: "player1",
          playerName: "Player One",
          vote: "Yes",
          votedAt: expect.any(String),
        })
      );
    });

    it("should update existing vote when player has already voted", async () => {
      // Mock existing vote
      const mockVoteSnapshot = { 
        empty: false,
        docs: [{
          id: "existingVote123",
          data: () => ({ vote: "No", playerName: "Player One" })
        }]
      };
      (getDocs as any).mockResolvedValue(mockVoteSnapshot);

      // Mock poll document
      const mockPollDoc = {
        exists: () => true,
        data: () => ({
          isActive: true,
          expiresAt: undefined,
        }),
      };
      (getDoc as any).mockResolvedValue(mockPollDoc);

      // Mock updateDoc
      (updateDoc as any).mockResolvedValue(undefined);

      await pollService.submitVote("poll123", "player1", "Player One", "Yes");

      expect(updateDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          vote: "Yes",
          votedAt: expect.any(String),
        })
      );
    });

    it("should throw error when poll does not exist", async () => {
      const mockVoteSnapshot = { empty: true };
      (getDocs as any).mockResolvedValue(mockVoteSnapshot);

      const mockPollDoc = { exists: () => false };
      (getDoc as any).mockResolvedValue(mockPollDoc);

      await expect(
        pollService.submitVote("poll123", "player1", "Player One", "Yes")
      ).rejects.toThrow("Poll not found");
    });

    it("should throw error when poll is not active", async () => {
      const mockVoteSnapshot = { empty: true };
      (getDocs as any).mockResolvedValue(mockVoteSnapshot);

      const mockPollDoc = {
        exists: () => true,
        data: () => ({ isActive: false }),
      };
      (getDoc as any).mockResolvedValue(mockPollDoc);

      await expect(
        pollService.submitVote("poll123", "player1", "Player One", "Yes")
      ).rejects.toThrow("Poll is not active");
    });

    it("should throw error when poll has expired", async () => {
      const mockVoteSnapshot = { empty: true };
      (getDocs as any).mockResolvedValue(mockVoteSnapshot);

      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

      const mockPollDoc = {
        exists: () => true,
        data: () => ({
          isActive: true,
          expiresAt: expiredDate.toISOString(),
        }),
      };
      (getDoc as any).mockResolvedValue(mockPollDoc);

      await expect(
        pollService.submitVote("poll123", "player1", "Player One", "Yes")
      ).rejects.toThrow("Poll has expired");
    });
  });

  describe("getAllPolls", () => {
    it("should return all polls successfully", async () => {
      const mockPolls = [
        {
          question: "Question 1",
          isActive: true,
        },
        {
          question: "Question 2",
          isActive: false,
        },
      ];

      const mockSnapshot = {
        docs: [
          {
            id: "poll1",
            data: () => mockPolls[0],
          },
          {
            id: "poll2",
            data: () => mockPolls[1],
          },
        ],
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await pollService.getAllPolls();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("poll1");
      expect(result[1].id).toBe("poll2");
    });
  });

  describe("getVoteCounts", () => {
    it("should return vote counts aggregated by option", async () => {
      const mockVotes = [
        { vote: "Yes" },
        { vote: "Yes" },
        { vote: "No" },
        { vote: "Maybe" },
        { vote: "Yes" },
      ];

      const mockSnapshot = {
        docs: mockVotes.map((vote, index) => ({
          id: `vote${index}`,
          data: () => vote,
        })),
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await pollService.getVoteCounts("poll123");

      expect(result).toEqual({
        Yes: 3,
        No: 1,
        Maybe: 1,
      });
    });

    it("should return empty object when no votes exist", async () => {
      const mockSnapshot = { docs: [] };
      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await pollService.getVoteCounts("poll123");

      expect(result).toEqual({});
    });
  });
});
