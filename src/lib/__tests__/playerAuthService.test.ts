import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { PlayerAuthService } from "../playerAuthService";
import { Player } from "../types";

// Mock Firebase functions
vi.mock("firebase/firestore");
vi.mock("../firebase", () => ({
  db: {},
}));

const mockCollection = vi.mocked(collection);
const mockQuery = vi.mocked(query);
const mockWhere = vi.mocked(where);
const mockGetDocs = vi.mocked(getDocs);
const mockDoc = vi.mocked(doc);
const mockUpdateDoc = vi.mocked(updateDoc);
const mockOrderBy = vi.mocked(orderBy);
const mockLimit = vi.mocked(limit);

describe("PlayerAuthService", () => {
  let playerAuthService: PlayerAuthService;

  beforeEach(() => {
    playerAuthService = new PlayerAuthService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("validatePlayerCredentials", () => {
    const mockPlayer: Player = {
      id: "player1",
      name: "TestPlayer",
      phoneNumber: "1234567890",
      category: "Pro",
      loginPassword: "testpassword",
      isLoginEnabled: true,
      lastLoginAt: "2024-01-01T00:00:00.000Z",
    };

    it("should return player when credentials are valid", async () => {
      // Mock successful query
      const mockQuerySnapshot = {
        empty: false,
        docs: [
          {
            id: "player1",
            data: () => ({
              name: "TestPlayer",
              phoneNumber: "1234567890",
              category: "Pro",
              loginPassword: "testpassword",
              isLoginEnabled: true,
            }),
          },
        ],
      };

      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);
      mockDoc.mockReturnValue({} as any);
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await playerAuthService.validatePlayerCredentials(
        "TestPlayer",
        "testpassword"
      );

      expect(result).toEqual({
        id: "player1",
        name: "TestPlayer",
        phoneNumber: "1234567890",
        category: "Pro",
        loginPassword: "testpassword",
        isLoginEnabled: true,
      });
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        {
          lastLoginAt: expect.any(String),
        }
      );
    });

    it("should return null when player not found", async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: [],
      };

      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await playerAuthService.validatePlayerCredentials(
        "NonExistentPlayer",
        "password"
      );

      expect(result).toBeNull();
    });

    it("should return null when password is incorrect", async () => {
      const mockQuerySnapshot = {
        empty: false,
        docs: [
          {
            id: "player1",
            data: () => ({
              name: "TestPlayer",
              phoneNumber: "1234567890",
              category: "Pro",
              loginPassword: "correctpassword",
              isLoginEnabled: true,
            }),
          },
        ],
      };

      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await playerAuthService.validatePlayerCredentials(
        "TestPlayer",
        "wrongpassword"
      );

      expect(result).toBeNull();
    });

    it("should throw error when database operation fails", async () => {
      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockGetDocs.mockRejectedValue(new Error("Database error"));

      await expect(
        playerAuthService.validatePlayerCredentials("TestPlayer", "password")
      ).rejects.toThrow("Failed to validate player credentials");
    });
  });

  describe("getPlayerSuggestions", () => {
    it("should return filtered player suggestions", async () => {
      const mockQuerySnapshot = {
        forEach: vi.fn((callback) => {
          const mockDocs = [
            {
              id: "player1",
              data: () => ({
                name: "TestPlayer1",
                phoneNumber: "1234567890",
                category: "Pro",
                isLoginEnabled: true,
              }),
            },
            {
              id: "player2",
              data: () => ({
                name: "TestPlayer2",
                phoneNumber: "0987654321",
                category: "Noob",
                isLoginEnabled: true,
              }),
            },
          ];
          mockDocs.forEach(callback);
        }),
      };

      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockOrderBy.mockReturnValue({} as any);
      mockLimit.mockReturnValue({} as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await playerAuthService.getPlayerSuggestions("test");

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("TestPlayer1");
      expect(result[1].name).toBe("TestPlayer2");
    });

    it("should return empty array for empty query", async () => {
      const result = await playerAuthService.getPlayerSuggestions("");

      expect(result).toEqual([]);
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it("should limit results to 10 suggestions", async () => {
      const mockQuerySnapshot = {
        forEach: vi.fn((callback) => {
          // Create 15 mock players
          const mockDocs = Array.from({ length: 15 }, (_, i) => ({
            id: `player${i}`,
            data: () => ({
              name: `TestPlayer${i}`,
              phoneNumber: "1234567890",
              category: "Pro",
              isLoginEnabled: true,
            }),
          }));
          mockDocs.forEach(callback);
        }),
      };

      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockOrderBy.mockReturnValue({} as any);
      mockLimit.mockReturnValue({} as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await playerAuthService.getPlayerSuggestions("test");

      expect(result).toHaveLength(10);
    });

    it("should throw error when database operation fails", async () => {
      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockOrderBy.mockReturnValue({} as any);
      mockLimit.mockReturnValue({} as any);
      mockGetDocs.mockRejectedValue(new Error("Database error"));

      await expect(
        playerAuthService.getPlayerSuggestions("test")
      ).rejects.toThrow("Failed to get player suggestions");
    });
  });

  describe("updatePlayerPassword", () => {
    it("should update player password successfully", async () => {
      mockDoc.mockReturnValue({} as any);
      mockUpdateDoc.mockResolvedValue(undefined);

      await playerAuthService.updatePlayerPassword("player1", "newpassword");

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        {
          loginPassword: "newpassword",
        }
      );
    });

    it("should trim password before updating", async () => {
      mockDoc.mockReturnValue({} as any);
      mockUpdateDoc.mockResolvedValue(undefined);

      await playerAuthService.updatePlayerPassword(
        "player1",
        "  newpassword  "
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        {
          loginPassword: "newpassword",
        }
      );
    });

    it("should throw error for empty password", async () => {
      await expect(
        playerAuthService.updatePlayerPassword("player1", "")
      ).rejects.toThrow("Password cannot be empty");

      await expect(
        playerAuthService.updatePlayerPassword("player1", "   ")
      ).rejects.toThrow("Password cannot be empty");
    });

    it("should throw error when database operation fails", async () => {
      mockDoc.mockReturnValue({} as any);
      mockUpdateDoc.mockRejectedValue(new Error("Database error"));

      await expect(
        playerAuthService.updatePlayerPassword("player1", "newpassword")
      ).rejects.toThrow("Failed to update player password");
    });
  });

  describe("setPlayerPassword", () => {
    it("should set player password", async () => {
      mockDoc.mockReturnValue({} as any);
      mockUpdateDoc.mockResolvedValue(undefined);

      await playerAuthService.setPlayerPassword("player1", "password123");

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        {
          loginPassword: "password123",
        }
      );
    });

    it("should trim password before setting", async () => {
      mockDoc.mockReturnValue({} as any);
      mockUpdateDoc.mockResolvedValue(undefined);

      await playerAuthService.setPlayerPassword("player1", "  password123  ");

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        {
          loginPassword: "password123",
        }
      );
    });

    it("should throw error for empty password", async () => {
      await expect(
        playerAuthService.setPlayerPassword("player1", "")
      ).rejects.toThrow("Password cannot be empty");

      await expect(
        playerAuthService.setPlayerPassword("player1", "   ")
      ).rejects.toThrow("Password cannot be empty");
    });

    it("should throw error when database operation fails", async () => {
      mockDoc.mockReturnValue({} as any);
      mockUpdateDoc.mockRejectedValue(new Error("Database error"));

      await expect(
        playerAuthService.setPlayerPassword("player1", "password123")
      ).rejects.toThrow("Failed to set player password");
    });
  });

  describe("getPlayerById", () => {
    it("should return player when found", async () => {
      const mockQuerySnapshot = {
        empty: false,
        docs: [
          {
            id: "player1",
            data: () => ({
              name: "TestPlayer",
              phoneNumber: "1234567890",
              category: "Pro",
              isLoginEnabled: true,
            }),
          },
        ],
      };

      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await playerAuthService.getPlayerById("player1");

      expect(result).toEqual({
        id: "player1",
        name: "TestPlayer",
        phoneNumber: "1234567890",
        category: "Pro",
        isLoginEnabled: true,
      });
    });

    it("should return null when player not found", async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: [],
      };

      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await playerAuthService.getPlayerById("nonexistent");

      expect(result).toBeNull();
    });

    it("should throw error when database operation fails", async () => {
      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockGetDocs.mockRejectedValue(new Error("Database error"));

      await expect(playerAuthService.getPlayerById("player1")).rejects.toThrow(
        "Failed to get player"
      );
    });
  });
});
