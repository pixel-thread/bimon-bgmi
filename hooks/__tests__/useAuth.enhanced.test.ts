import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";
import { Player, PlayerUser } from "@/lib/types";

// Mock Firebase completely
vi.mock("@/lib/firebase", () => ({
  auth: {
    signOut: vi.fn(),
  },
  db: {},
}));

// Mock Firebase auth functions
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Simulate no Firebase user initially
    callback(null);
    return vi.fn(); // unsubscribe function
  }),
}));

// Mock Firebase Firestore functions
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

// Mock admin service
vi.mock("@/lib/adminService", () => ({
  getUserRoleFromDB: vi.fn(),
}));

// Mock admin access config
vi.mock("@/config/adminAccess", () => ({
  extractUsername: vi.fn(),
  formatUserDisplay: vi.fn(),
}));

// Mock player auth service
vi.mock("@/lib/playerAuthService", () => ({
  playerAuthService: {
    validatePlayerCredentials: vi.fn(),
    getPlayerById: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useAuth Hook - Enhanced Authentication", () => {
  let useAuth: any;
  let playerAuthService: any;
  let auth: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // Import after mocking
    const authModule = await import("../useAuth");
    const playerAuthModule = await import("@/lib/playerAuthService");
    const firebaseModule = await import("@/lib/firebase");

    useAuth = authModule.useAuth;
    playerAuthService = playerAuthModule.playerAuthService;
    auth = firebaseModule.auth;
  });

  describe("Initial State", () => {
    it("should initialize with default enhanced auth state", async () => {
      const { result } = renderHook(() => useAuth());

      // Wait for the hook to finish initializing
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toMatchObject({
        user: null,
        loading: false,
        isAuthorized: false,
        role: "none",
        username: "",
        displayName: "",
        playerUser: null,
        authType: null,
        isPlayer: false,
      });
      expect(typeof result.current.loginAsPlayer).toBe("function");
      expect(typeof result.current.logout).toBe("function");
      expect(typeof result.current.refreshAuthState).toBe("function");
    });
  });

  describe("Player Authentication", () => {
    const mockPlayer: Player = {
      id: "player1",
      name: "Test Player",
      phoneNumber: "1234567890",
      category: "Pro",
      loginPassword: "password123",
      isLoginEnabled: true,
      lastLoginAt: "2024-01-01T00:00:00Z",
    };

    it("should successfully login as player with valid credentials", async () => {
      vi.mocked(playerAuthService.validatePlayerCredentials).mockResolvedValue(
        mockPlayer
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.loginAsPlayer("Test Player", "password123");
      });

      await waitFor(() => {
        expect(result.current.playerUser).toEqual({
          id: "player1",
          name: "Test Player",
          hasVoted: false,
          loginPassword: "password123",
        });
        expect(result.current.authType).toBe("player");
        expect(result.current.isPlayer).toBe(true);
        expect(result.current.isAuthorized).toBe(true);
        expect(result.current.username).toBe("Test Player");
        expect(result.current.displayName).toBe("Test Player");
        expect(result.current.loading).toBe(false);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "tournament_player_session",
        JSON.stringify({
          id: "player1",
          name: "Test Player",
          hasVoted: false,
          loginPassword: "password123",
        })
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "tournament_auth_type",
        "player"
      );
    });

    it("should throw error for invalid player credentials", async () => {
      vi.mocked(playerAuthService.validatePlayerCredentials).mockResolvedValue(
        null
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(
          result.current.loginAsPlayer("Invalid Player", "wrongpassword")
        ).rejects.toThrow("Invalid credentials");
      });

      expect(result.current.playerUser).toBeNull();
      expect(result.current.authType).toBeNull();
      expect(result.current.isPlayer).toBe(false);
      expect(result.current.isAuthorized).toBe(false);
    });

    it("should handle player authentication service errors", async () => {
      vi.mocked(playerAuthService.validatePlayerCredentials).mockRejectedValue(
        new Error("Service error")
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(
          result.current.loginAsPlayer("Test Player", "password123")
        ).rejects.toThrow("Service error");
      });

      expect(result.current.playerUser).toBeNull();
      expect(result.current.authType).toBeNull();
      expect(result.current.isPlayer).toBe(false);
    });
  });

  describe("Session Management", () => {
    const mockPlayerUser: PlayerUser = {
      id: "player1",
      name: "Test Player",
      hasVoted: false,
      loginPassword: "password123",
    };

    const mockPlayer: Player = {
      id: "player1",
      name: "Test Player",
      phoneNumber: "1234567890",
      category: "Pro",
      loginPassword: "password123",
      isLoginEnabled: true,
    };

    it("should restore player session from localStorage on refresh", async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "tournament_player_session") {
          return JSON.stringify(mockPlayerUser);
        }
        if (key === "tournament_auth_type") {
          return "player";
        }
        return null;
      });

      vi.mocked(playerAuthService.getPlayerById).mockResolvedValue(mockPlayer);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.playerUser).toEqual(mockPlayerUser);
        expect(result.current.authType).toBe("player");
        expect(result.current.isPlayer).toBe(true);
        expect(result.current.isAuthorized).toBe(true);
      });
    });

    it("should clear invalid player session on refresh", async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "tournament_player_session") {
          return JSON.stringify(mockPlayerUser);
        }
        if (key === "tournament_auth_type") {
          return "player";
        }
        return null;
      });

      // Mock player as disabled
      vi.mocked(playerAuthService.getPlayerById).mockResolvedValue({
        ...mockPlayer,
        isLoginEnabled: false,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith(
          "tournament_player_session"
        );
        expect(localStorageMock.removeItem).toHaveBeenCalledWith(
          "tournament_auth_type"
        );
      });
    });

    it("should handle localStorage errors gracefully", async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      const { result } = renderHook(() => useAuth());

      // Should not crash and should have default state
      await waitFor(() => {
        expect(result.current.playerUser).toBeNull();
        expect(result.current.authType).toBeNull();
      });
    });
  });

  describe("Logout Functionality", () => {
    it("should clear both Firebase and player sessions on logout", async () => {
      const { result } = renderHook(() => useAuth());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "tournament_player_session"
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "tournament_auth_type"
      );

      expect(result.current).toMatchObject({
        user: null,
        loading: false,
        isAuthorized: false,
        role: "none",
        username: "",
        displayName: "",
        playerUser: null,
        authType: null,
        isPlayer: false,
      });
    });

    it("should handle logout without Firebase user", async () => {
      const { result } = renderHook(() => useAuth());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Logout should work even without Firebase user
      await act(async () => {
        await result.current.logout();
      });

      // Should clear sessions
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "tournament_player_session"
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "tournament_auth_type"
      );

      expect(result.current).toMatchObject({
        user: null,
        loading: false,
        isAuthorized: false,
        role: "none",
        username: "",
        displayName: "",
        playerUser: null,
        authType: null,
        isPlayer: false,
      });
    });
  });

  describe("Refresh Auth State", () => {
    it("should refresh authentication state correctly", async () => {
      const mockPlayerUser: PlayerUser = {
        id: "player1",
        name: "Test Player",
        hasVoted: false,
        loginPassword: "password123",
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "tournament_player_session") {
          return JSON.stringify(mockPlayerUser);
        }
        if (key === "tournament_auth_type") {
          return "player";
        }
        return null;
      });

      vi.mocked(playerAuthService.getPlayerById).mockResolvedValue({
        id: "player1",
        name: "Test Player",
        isLoginEnabled: true,
      });

      const { result } = renderHook(() => useAuth());

      // The hook should automatically call refreshAuthState on mount
      await waitFor(
        () => {
          expect(result.current.playerUser).toEqual(mockPlayerUser);
          expect(result.current.authType).toBe("player");
          expect(result.current.isPlayer).toBe(true);
          expect(result.current.loading).toBe(false);
        },
        { timeout: 1000 }
      );
    });

    it("should handle refresh errors gracefully", async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.refreshAuthState();
      });

      // Should not crash
      expect(result.current.playerUser).toBeNull();
    });
  });
});
