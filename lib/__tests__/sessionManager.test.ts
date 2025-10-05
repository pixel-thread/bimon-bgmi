// lib/__tests__/sessionManager.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  SessionManager,
  SESSION_KEYS,
  SESSION_TIMEOUT,
} from "../sessionManager";

describe("SessionManager", () => {
  beforeEach(() => {
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

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateSessionToken", () => {
    it("should generate a unique session token", () => {
      const token1 = SessionManager.generateSessionToken();
      const token2 = SessionManager.generateSessionToken();

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(typeof token1).toBe("string");
      expect(typeof token2).toBe("string");
    });
  });

  describe("isSessionExpired", () => {
    it("should return true if no timestamp exists", () => {
      (localStorage.getItem as any).mockReturnValue(null);

      const result = SessionManager.isSessionExpired();

      expect(result).toBe(true);
      expect(localStorage.getItem).toHaveBeenCalledWith(
        SESSION_KEYS.SESSION_TIMESTAMP
      );
    });

    it("should return true if session is expired", () => {
      const expiredTimestamp = Date.now() - SESSION_TIMEOUT - 1000; // 1 second past expiry
      (localStorage.getItem as any).mockReturnValue(
        expiredTimestamp.toString()
      );

      const result = SessionManager.isSessionExpired();

      expect(result).toBe(true);
    });

    it("should return false if session is not expired", () => {
      const validTimestamp = Date.now() - 1000; // 1 second ago
      (localStorage.getItem as any).mockReturnValue(validTimestamp.toString());

      const result = SessionManager.isSessionExpired();

      expect(result).toBe(false);
    });

    it("should use provided timestamp parameter", () => {
      const validTimestamp = Date.now() - 1000;

      const result = SessionManager.isSessionExpired(validTimestamp);

      expect(result).toBe(false);
      expect(localStorage.getItem).not.toHaveBeenCalled();
    });

    it("should handle localStorage errors gracefully", () => {
      (localStorage.getItem as any).mockImplementation(() => {
        throw new Error("localStorage error");
      });

      const result = SessionManager.isSessionExpired();

      expect(result).toBe(true);
    });
  });

  describe("getSessionTimestamp", () => {
    it("should return parsed timestamp from localStorage", () => {
      const timestamp = Date.now();
      (localStorage.getItem as any).mockReturnValue(timestamp.toString());

      const result = SessionManager.getSessionTimestamp();

      expect(result).toBe(timestamp);
      expect(localStorage.getItem).toHaveBeenCalledWith(
        SESSION_KEYS.SESSION_TIMESTAMP
      );
    });

    it("should return null if no timestamp exists", () => {
      (localStorage.getItem as any).mockReturnValue(null);

      const result = SessionManager.getSessionTimestamp();

      expect(result).toBe(null);
    });

    it("should handle localStorage errors gracefully", () => {
      (localStorage.getItem as any).mockImplementation(() => {
        throw new Error("localStorage error");
      });

      const result = SessionManager.getSessionTimestamp();

      expect(result).toBe(null);
    });
  });

  describe("updateSessionTimestamp", () => {
    it("should update session timestamp in localStorage", () => {
      const mockNow = 1234567890;
      vi.spyOn(Date, "now").mockReturnValue(mockNow);

      SessionManager.updateSessionTimestamp();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        SESSION_KEYS.SESSION_TIMESTAMP,
        mockNow.toString()
      );
    });

    it("should handle localStorage errors gracefully", () => {
      (localStorage.setItem as any).mockImplementation(() => {
        throw new Error("localStorage error");
      });

      expect(() => SessionManager.updateSessionTimestamp()).not.toThrow();
    });
  });

  describe("saveSession", () => {
    it("should save session data with token and timestamp", () => {
      const mockNow = 1234567890;
      vi.spyOn(Date, "now").mockReturnValue(mockNow);

      const testData = { id: "test", name: "Test User" };
      const key = "test_session";
      const authType = "player";

      SessionManager.saveSession(key, testData, authType);

      // Check that the first call was to save the session data
      const firstCall = (localStorage.setItem as any).mock.calls[0];
      expect(firstCall[0]).toBe(key);

      const savedData = JSON.parse(firstCall[1]);
      expect(savedData).toEqual({
        ...testData,
        sessionToken: expect.any(String),
        timestamp: mockNow,
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        SESSION_KEYS.AUTH_TYPE,
        authType
      );

      expect(localStorage.setItem).toHaveBeenCalledWith(
        SESSION_KEYS.SESSION_TIMESTAMP,
        mockNow.toString()
      );

      expect(localStorage.setItem).toHaveBeenCalledWith(
        SESSION_KEYS.STORAGE_EVENT,
        expect.stringContaining("player_login")
      );
    });

    it("should handle localStorage errors gracefully", () => {
      (localStorage.setItem as any).mockImplementation(() => {
        throw new Error("localStorage error");
      });

      expect(() =>
        SessionManager.saveSession("test", { id: "test" }, "player")
      ).not.toThrow();
    });
  });

  describe("loadSession", () => {
    it("should load and parse session data", () => {
      const sessionData = {
        id: "test",
        name: "Test User",
        sessionToken: "token123",
        timestamp: Date.now(),
      };

      (localStorage.getItem as any).mockImplementation((key) => {
        if (key === SESSION_KEYS.SESSION_TIMESTAMP) {
          return Date.now().toString();
        }
        if (key === "test_session") {
          return JSON.stringify(sessionData);
        }
        return null;
      });

      const result = SessionManager.loadSession("test_session");

      expect(result).toEqual(sessionData);
    });

    it("should return null if session is expired", () => {
      const expiredTimestamp = Date.now() - SESSION_TIMEOUT - 1000;
      (localStorage.getItem as any).mockReturnValue(
        expiredTimestamp.toString()
      );

      const result = SessionManager.loadSession("test_session");

      expect(result).toBe(null);
    });

    it("should return null if session data is invalid", () => {
      (localStorage.getItem as any).mockImplementation((key) => {
        if (key === SESSION_KEYS.SESSION_TIMESTAMP) {
          return Date.now().toString();
        }
        if (key === "test_session") {
          return JSON.stringify({ id: "test" }); // Missing sessionToken and timestamp
        }
        return null;
      });

      const result = SessionManager.loadSession("test_session");

      expect(result).toBe(null);
    });

    it("should handle localStorage errors gracefully", () => {
      (localStorage.getItem as any).mockImplementation(() => {
        throw new Error("localStorage error");
      });

      const result = SessionManager.loadSession("test_session");

      expect(result).toBe(null);
    });
  });

  describe("clearAllSessions", () => {
    it("should remove all session keys from localStorage", () => {
      SessionManager.clearAllSessions();

      expect(localStorage.removeItem).toHaveBeenCalledWith(
        SESSION_KEYS.PLAYER_SESSION
      );
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        SESSION_KEYS.FIREBASE_SESSION
      );
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        SESSION_KEYS.AUTH_TYPE
      );
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        SESSION_KEYS.SESSION_TIMESTAMP
      );

      expect(localStorage.setItem).toHaveBeenCalledWith(
        SESSION_KEYS.STORAGE_EVENT,
        expect.stringContaining("logout")
      );
    });

    it("should handle localStorage errors gracefully", () => {
      (localStorage.removeItem as any).mockImplementation(() => {
        throw new Error("localStorage error");
      });

      expect(() => SessionManager.clearAllSessions()).not.toThrow();
    });
  });

  describe("extendSession", () => {
    it("should update timestamp and trigger sync event", () => {
      const mockNow = 1234567890;
      vi.spyOn(Date, "now").mockReturnValue(mockNow);
      (localStorage.getItem as any).mockReturnValue("player");

      SessionManager.extendSession();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        SESSION_KEYS.SESSION_TIMESTAMP,
        mockNow.toString()
      );

      expect(localStorage.setItem).toHaveBeenCalledWith(
        SESSION_KEYS.STORAGE_EVENT,
        expect.stringContaining("session_extend")
      );
    });

    it("should not extend if no auth type exists", () => {
      (localStorage.getItem as any).mockReturnValue(null);

      SessionManager.extendSession();

      expect(localStorage.setItem).not.toHaveBeenCalledWith(
        SESSION_KEYS.SESSION_TIMESTAMP,
        expect.any(String)
      );
    });
  });

  describe("getRemainingSessionTime", () => {
    it("should return remaining time in milliseconds", () => {
      const currentTime = Date.now();
      const sessionTime = currentTime - 10 * 60 * 1000; // 10 minutes ago
      const expectedRemaining = SESSION_TIMEOUT - 10 * 60 * 1000;

      (localStorage.getItem as any).mockReturnValue(sessionTime.toString());

      const result = SessionManager.getRemainingSessionTime();

      expect(result).toBeCloseTo(expectedRemaining, -3); // Allow 1 second tolerance
    });

    it("should return 0 if session is expired", () => {
      const expiredTime = Date.now() - SESSION_TIMEOUT - 1000;
      (localStorage.getItem as any).mockReturnValue(expiredTime.toString());

      const result = SessionManager.getRemainingSessionTime();

      expect(result).toBe(0);
    });

    it("should return 0 if no timestamp exists", () => {
      (localStorage.getItem as any).mockReturnValue(null);

      const result = SessionManager.getRemainingSessionTime();

      expect(result).toBe(0);
    });
  });

  describe("formatRemainingTime", () => {
    it("should format time with minutes and seconds", () => {
      const mockRemaining = 5 * 60 * 1000 + 30 * 1000; // 5 minutes 30 seconds
      vi.spyOn(SessionManager, "getRemainingSessionTime").mockReturnValue(
        mockRemaining
      );

      const result = SessionManager.formatRemainingTime();

      expect(result).toBe("5m 30s");
    });

    it("should format time with only seconds", () => {
      const mockRemaining = 45 * 1000; // 45 seconds
      vi.spyOn(SessionManager, "getRemainingSessionTime").mockReturnValue(
        mockRemaining
      );

      const result = SessionManager.formatRemainingTime();

      expect(result).toBe("45s");
    });

    it("should handle zero time", () => {
      vi.spyOn(SessionManager, "getRemainingSessionTime").mockReturnValue(0);

      const result = SessionManager.formatRemainingTime();

      expect(result).toBe("0s");
    });
  });

  describe("isAuthenticated", () => {
    it("should return true for valid player session", () => {
      const sessionData = {
        id: "test",
        sessionToken: "token123",
        timestamp: Date.now(),
      };

      (localStorage.getItem as any).mockImplementation((key) => {
        if (key === SESSION_KEYS.AUTH_TYPE) return "player";
        if (key === SESSION_KEYS.SESSION_TIMESTAMP)
          return Date.now().toString();
        if (key === SESSION_KEYS.PLAYER_SESSION)
          return JSON.stringify(sessionData);
        return null;
      });

      const result = SessionManager.isAuthenticated();

      expect(result).toBe(true);
    });

    it("should return false for expired session", () => {
      const expiredTime = Date.now() - SESSION_TIMEOUT - 1000;
      (localStorage.getItem as any).mockImplementation((key) => {
        if (key === SESSION_KEYS.AUTH_TYPE) return "player";
        if (key === SESSION_KEYS.SESSION_TIMESTAMP)
          return expiredTime.toString();
        return null;
      });

      const result = SessionManager.isAuthenticated();

      expect(result).toBe(false);
    });

    it("should return false if no auth type exists", () => {
      (localStorage.getItem as any).mockReturnValue(null);

      const result = SessionManager.isAuthenticated();

      expect(result).toBe(false);
    });

    it("should handle errors gracefully", () => {
      (localStorage.getItem as any).mockImplementation(() => {
        throw new Error("localStorage error");
      });

      const result = SessionManager.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});
