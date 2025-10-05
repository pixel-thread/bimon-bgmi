// lib/sessionManager.ts

// Session storage keys
export const SESSION_KEYS = {
  PLAYER_SESSION: "tournament_player_session",
  FIREBASE_SESSION: "tournament_firebase_session",
  AUTH_TYPE: "tournament_auth_type",
  SESSION_TIMESTAMP: "tournament_session_timestamp",
  STORAGE_EVENT: "tournament_auth_sync",
} as const;

export const SESSION_TIMEOUT = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
export const NETWORK_TIMEOUT = 30000; // 30 seconds for network operations
export const LOGOUT_DEBOUNCE_TIME = 2000; // 2 seconds to prevent multiple logout attempts

export interface SessionData {
  sessionToken: string;
  timestamp: number;
  [key: string]: any;
}

export interface StorageSyncEvent {
  type: "player_login" | "firebase_login" | "logout" | "session_extend";
  timestamp: number;
  data?: any;
}

/**
 * Session manager utility class for handling authentication sessions
 */
export class SessionManager {
  private static lastLogoutTime = 0;
  /**
   * Generate a secure session token
   */
  static generateSessionToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Check if a session is expired (disabled for persistent login)
   */
  static isSessionExpired(timestamp?: number): boolean {
    // For persistent login, sessions never expire unless explicitly logged out
    // This prevents network issues from causing automatic logouts
    return false;
  }

  /**
   * Get session timestamp from localStorage
   */
  static getSessionTimestamp(): number | null {
    try {
      const timestamp = localStorage.getItem(SESSION_KEYS.SESSION_TIMESTAMP);
      return timestamp ? parseInt(timestamp) : null;
    } catch (error) {
      console.error("Error getting session timestamp:", error);
      return null;
    }
  }

  /**
   * Update session timestamp
   */
  static updateSessionTimestamp(): void {
    try {
      localStorage.setItem(
        SESSION_KEYS.SESSION_TIMESTAMP,
        Date.now().toString()
      );
    } catch (error) {
      console.error("Error updating session timestamp:", error);
    }
  }

  /**
   * Save session data to localStorage
   */
  static saveSession(key: string, data: any, authType: string): void {
    try {
      const sessionData: SessionData = {
        ...data,
        sessionToken: this.generateSessionToken(),
        timestamp: Date.now(),
      };

      localStorage.setItem(key, JSON.stringify(sessionData));
      localStorage.setItem(SESSION_KEYS.AUTH_TYPE, authType);
      this.updateSessionTimestamp();

      // Trigger storage event for cross-tab sync
      this.triggerStorageSync({
        type: authType === "player" ? "player_login" : "firebase_login",
        timestamp: Date.now(),
        data: sessionData,
      });
    } catch (error) {
      console.error("Error saving session:", error);
    }
  }

  /**
   * Load session data from localStorage
   */
  static loadSession<T>(key: string): T | null {
    try {
      const sessionData = localStorage.getItem(key);
      if (!sessionData) return null;

      const parsedData = JSON.parse(sessionData);

      // Validate session structure
      if (parsedData.sessionToken && parsedData.timestamp) {
        return parsedData;
      }
    } catch (error) {
      console.error("Error loading session:", error);
    }
    return null;
  }

  /**
   * Clear all session data
   */
  static clearAllSessions(): void {
    try {
      // Prevent multiple rapid logout attempts
      const now = Date.now();
      if (now - this.lastLogoutTime < LOGOUT_DEBOUNCE_TIME) {
        return;
      }
      this.lastLogoutTime = now;

      Object.values(SESSION_KEYS).forEach((key) => {
        if (key !== SESSION_KEYS.STORAGE_EVENT) {
          localStorage.removeItem(key);
        }
      });

      // Trigger storage event for cross-tab sync
      this.triggerStorageSync({
        type: "logout",
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error clearing sessions:", error);
    }
  }

  /**
   * Extend current session
   */
  static extendSession(): void {
    try {
      const authType = localStorage.getItem(SESSION_KEYS.AUTH_TYPE);
      if (!authType) return;

      this.updateSessionTimestamp();

      // Trigger storage event for cross-tab sync
      this.triggerStorageSync({
        type: "session_extend",
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error extending session:", error);
    }
  }

  /**
   * Trigger storage event for cross-tab synchronization
   */
  static triggerStorageSync(event: StorageSyncEvent): void {
    try {
      localStorage.setItem(SESSION_KEYS.STORAGE_EVENT, JSON.stringify(event));
    } catch (error) {
      console.error("Error triggering storage sync:", error);
    }
  }

  /**
   * Get remaining session time in milliseconds
   */
  static getRemainingSessionTime(): number {
    try {
      const timestamp = this.getSessionTimestamp();
      if (!timestamp) return 0;

      const elapsed = Date.now() - timestamp;
      const remaining = SESSION_TIMEOUT - elapsed;

      return Math.max(0, remaining);
    } catch (error) {
      console.error("Error getting remaining session time:", error);
      return 0;
    }
  }

  /**
   * Format remaining session time as human readable string
   */
  static formatRemainingTime(): string {
    const remaining = this.getRemainingSessionTime();
    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Check if user is authenticated (has valid session)
   */
  static isAuthenticated(): boolean {
    try {
      const authType = localStorage.getItem(SESSION_KEYS.AUTH_TYPE);
      if (!authType) return false;

      if (this.isSessionExpired()) {
        this.clearAllSessions();
        return false;
      }

      const sessionKey =
        authType === "player"
          ? SESSION_KEYS.PLAYER_SESSION
          : SESSION_KEYS.FIREBASE_SESSION;

      const sessionData = this.loadSession(sessionKey);
      return sessionData !== null;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  }
}
