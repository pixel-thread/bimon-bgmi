// hooks/__tests__/useAuth.session.test.ts
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "../useAuth";
import { SessionManager, SESSION_KEYS } from "@/lib/sessionManager";
import { playerAuthService } from "@/lib/playerAuthService";

// Mock dependencies
vi.mock("@/lib/firebase", () => ({
  auth: {
    signOut: vi.fn(),
  },
  db: {},
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Return unsubscribe function
    return () => {};
  }),
}));

vi.mock("@/lib/adminService", () => ({
  getUserRoleFromDB: vi.fn(),
}));

vi.mock("@/config/adminAccess", () => ({
  extractUsername: vi.fn(),
  formatUserDisplay: vi.fn(),
}));

vi.mock("@/lib/playerAuthService", () => ({
  playerAuthService: {
    validatePlayerCredentials: vi.fn(),
    getPlayerById: vi.fn(),
  },
}));

vi.mock("@/lib/sessionManager", () => ({
  SessionManager: {
    saveSession: vi.fn(),
    loadSession: vi.fn(),
    clearAllSessions: vi.fn(),
    isSessionExpired: vi.fn(),
    updateSessionTimestamp: vi.fn(),
    getRemainingSessionTime: vi.fn(),
    extendSession: vi.fn(),
  },
  SESSION_KEYS: {
    PLAYER_SESSION: "tournament_player_session",
    FIREBASE_SESSION: "tournament_firebase_session",
    AUTH_TYPE: "tournament_auth_type",
    SESSION_TIMESTAMP: "tournament_session_timestamp",
    STORAGE_EVENT: "tournament_auth_sync",
  },
}));

describe("useAuth - Session Persistence", () => {
  const mockPlayerAuthService = playerAuthService as {
    validatePlayerCredentials: Mock;
    getPlayerById: Mock;
  };

  const mockSessionManager = SessionManager as {
    saveSession: Mock;
    loadSession: Mock;
    clearAllSessions: Mock;
    isSessionExpired: Mock;
    updateSessionTimestamp: Mock;
    getRemainingSessionTime: Mock;
    extendSession: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockSessionManager.isSessionExpired.mockReturnValue(false);
    mockSessionManager.getRemainingSessionTime.mockReturnValue(30 * 60 * 1000); // 30 minutes
    mockSessionManager.loadSession.mockReturnValue(null);

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Mock addEventListener/removeEventListener
    Object.defineProperty(window, "addEventListener", {
      value: vi.fn(),
      writable: true,
    });

    Object.defineProperty(window, "removeEventListener", {
      value: vi.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Player Session Persistence", () => {
    it("should save player session on successful login", async () => {
      const mockPlayer = {
        id: "player1",
        name: "Test Player",
        loginPassword: "password123",
        isLoginEnabled: true,
      };

      mockPlayerAuthService.validatePlayerCredentials.mockResolvedValue(
        mockPlayer
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.loginAsPlayer("Test Player", "password123");
      });

      expect(mockSessionManager.saveSession).toHaveBeenCalledWith(
        SESSION_KEYS.PLAYER_SESSION,
        expect.objectContaining({
          id: "player1",
          name: "Test Player",
          hasVoted: false,
          loginPassword: "password123",
        }),
        "player"
      );

      expect(result.current.authType).toBe("player");
      expect(result.current.isPlayer).toBe(true);
      expect(result.current.playerUser?.name).toBe("Test Player");
    });

    it("should restore player session on page reload", async () => {
      const mockPlayerSession = {
        id: "player1",
        name: "Test Player",
        hasVoted: false,
        loginPassword: "password123",
        sessionToken: "token123",
        timestamp: Date.now(),
      };

      const mockPlayer = {
        id: "player1",
        name: "Test Player",
        isLoginEnabled: true,
      };

      mockSessionManager.loadSession.mockReturnValue(mockPlayerSession);
      mockPlayerAuthService.getPlayerById.mockResolvedValue(mockPlayer);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.authType).toBe("player");
      expect(result.current.isPlayer).toBe(true);
      expect(result.current.playerUser?.name).toBe("Test Player");
      expect(mockSessionManager.updateSessionTimestamp).toHaveBeenCalled();
    });

    it("should clear invalid player session", async () => {
      const mockPlayerSession = {
        id: "player1",
        name: "Test Player",
        hasVoted: false,
        loginPassword: "password123",
        sessionToken: "token123",
        timestamp: Date.now(),
      };

      mockSessionManager.loadSession.mockReturnValue(mockPlayerSession);
      mockPlayerAuthService.getPlayerById.mockResolvedValue(null); // Player not found

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockSessionManager.clearAllSessions).toHaveBeenCalled();
      });

      expect(result.current.authType).toBe(null);
      expect(result.current.isPlayer).toBe(false);
      expect(result.current.loading).toBe(false);
    });

    it("should clear disabled player session", async () => {
      const mockPlayerSession = {
        id: "player1",
        name: "Test Player",
        hasVoted: false,
        loginPassword: "password123",
        sessionToken: "token123",
        timestamp: Date.now(),
      };

      const mockPlayer = {
        id: "player1",
        name: "Test Player",
        isLoginEnabled: false, // Player disabled
      };

      mockSessionManager.loadSession.mockReturnValue(mockPlayerSession);
      mockPlayerAuthService.getPlayerById.mockResolvedValue(mockPlayer);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockSessionManager.clearAllSessions).toHaveBeenCalled();
      });

      expect(result.current.authType).toBe(null);
      expect(result.current.isPlayer).toBe(false);
      expect(result.current.loading).toBe(false);
    });
  });

  describe("Session Timeout", () => {
    it("should clear expired sessions on initialization", async () => {
      mockSessionManager.isSessionExpired.mockReturnValue(true);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSessionManager.clearAllSessions).toHaveBeenCalled();
      expect(result.current.authType).toBe(null);
    });

    it("should setup session timeout on login", async () => {
      const mockPlayer = {
        id: "player1",
        name: "Test Player",
        loginPassword: "password123",
        isLoginEnabled: true,
      };

      mockPlayerAuthService.validatePlayerCredentials.mockResolvedValue(
        mockPlayer
      );
      mockSessionManager.getRemainingSessionTime.mockReturnValue(
        30 * 60 * 1000
      ); // 30 minutes

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.loginAsPlayer("Test Player", "password123");
      });

      // Verify session timeout is set up (we can't easily test the actual timeout)
      expect(mockSessionManager.getRemainingSessionTime).toHaveBeenCalled();
    });

    it("should extend session when extendSession is called", async () => {
      const mockPlayer = {
        id: "player1",
        name: "Test Player",
        loginPassword: "password123",
        isLoginEnabled: true,
      };

      mockPlayerAuthService.validatePlayerCredentials.mockResolvedValue(
        mockPlayer
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.loginAsPlayer("Test Player", "password123");
      });

      act(() => {
        result.current.extendSession();
      });

      expect(mockSessionManager.extendSession).toHaveBeenCalled();
    });

    it("should not extend expired session", async () => {
      const { result } = renderHook(() => useAuth());

      mockSessionManager.isSessionExpired.mockReturnValue(true);

      act(() => {
        result.current.extendSession();
      });

      expect(mockSessionManager.extendSession).not.toHaveBeenCalled();
    });
  });

  describe("Cross-tab Synchronization", () => {
    it("should setup storage event listener", () => {
      renderHook(() => useAuth());

      expect(window.addEventListener).toHaveBeenCalledWith(
        "storage",
        expect.any(Function)
      );
    });

    it("should cleanup storage event listener on unmount", () => {
      const { unmount } = renderHook(() => useAuth());

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        "storage",
        expect.any(Function)
      );
    });

    it("should handle player login sync event", async () => {
      const { result } = renderHook(() => useAuth());

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Get the storage event handler that was registered
      const addEventListenerCalls = (window.addEventListener as any).mock.calls;
      const storageHandler = addEventListenerCalls.find(
        (call: any) => call[0] === "storage"
      )?.[1];

      expect(storageHandler).toBeDefined();

      const mockStorageEvent = {
        key: SESSION_KEYS.STORAGE_EVENT,
        newValue: JSON.stringify({
          type: "player_login",
          timestamp: Date.now(),
          data: {
            id: "player1",
            name: "Test Player",
            hasVoted: false,
            loginPassword: "password123",
          },
        }),
      };

      // Simulate storage event by calling the handler directly
      act(() => {
        storageHandler(mockStorageEvent);
      });

      await waitFor(() => {
        expect(result.current.authType).toBe("player");
        expect(result.current.isPlayer).toBe(true);
        expect(result.current.playerUser?.name).toBe("Test Player");
      });
    });

    it("should handle logout sync event", async () => {
      // First login
      const mockPlayer = {
        id: "player1",
        name: "Test Player",
        loginPassword: "password123",
        isLoginEnabled: true,
      };

      mockPlayerAuthService.validatePlayerCredentials.mockResolvedValue(
        mockPlayer
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.loginAsPlayer("Test Player", "password123");
      });

      expect(result.current.authType).toBe("player");

      // Simulate logout sync event
      const mockStorageEvent = new StorageEvent("storage", {
        key: SESSION_KEYS.STORAGE_EVENT,
        newValue: JSON.stringify({
          type: "logout",
          timestamp: Date.now(),
        }),
      });

      // Get the storage event handler that was registered
      const addEventListenerCalls = (window.addEventListener as any).mock.calls;
      const storageHandler = addEventListenerCalls.find(
        (call: any) => call[0] === "storage"
      )?.[1];

      expect(storageHandler).toBeDefined();

      // Simulate logout sync event by calling the handler directly
      act(() => {
        storageHandler(mockStorageEvent);
      });

      await waitFor(() => {
        expect(result.current.authType).toBe(null);
        expect(result.current.isPlayer).toBe(false);
        expect(result.current.playerUser).toBe(null);
      });
    });
  });

  describe("Logout", () => {
    it("should clear all sessions on logout", async () => {
      const mockPlayer = {
        id: "player1",
        name: "Test Player",
        loginPassword: "password123",
        isLoginEnabled: true,
      };

      mockPlayerAuthService.validatePlayerCredentials.mockResolvedValue(
        mockPlayer
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.loginAsPlayer("Test Player", "password123");
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockSessionManager.clearAllSessions).toHaveBeenCalled();
      expect(result.current.authType).toBe(null);
      expect(result.current.isPlayer).toBe(false);
      expect(result.current.playerUser).toBe(null);
    });
  });
});
