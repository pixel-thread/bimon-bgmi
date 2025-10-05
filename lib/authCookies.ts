// lib/authCookies.ts
/**
 * Utility functions for managing authentication cookies that can be read by Next.js middleware
 */

import { SESSION_KEYS } from "./sessionManager";

export interface AuthCookieData {
  authType: 'firebase' | 'player' | null;
  role?: string;
  playerName?: string;
  userEmail?: string;
  isAuthenticated: boolean;
}

export class AuthCookieManager {
  private static readonly COOKIE_OPTIONS = {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };

  /**
   * Set authentication cookies from client-side
   * This should be called after successful login
   */
  static setAuthCookies(authData: AuthCookieData): void {
    if (typeof window === 'undefined') return;

    try {
      // Set auth type cookie
      if (authData.authType) {
        document.cookie = `authType=${authData.authType}; ${this.serializeCookieOptions(this.COOKIE_OPTIONS)}`;
      } else {
        // Clear auth type cookie
        document.cookie = `authType=; ${this.serializeCookieOptions({ ...this.COOKIE_OPTIONS, maxAge: 0 })}`;
      }

      // Set role cookie for Firebase auth
      if (authData.role) {
        document.cookie = `userRole=${authData.role}; ${this.serializeCookieOptions(this.COOKIE_OPTIONS)}`;
      } else {
        document.cookie = `userRole=; ${this.serializeCookieOptions({ ...this.COOKIE_OPTIONS, maxAge: 0 })}`;
      }

      // Set player name cookie for player auth
      if (authData.playerName) {
        document.cookie = `playerName=${encodeURIComponent(authData.playerName)}; ${this.serializeCookieOptions(this.COOKIE_OPTIONS)}`;
      } else {
        document.cookie = `playerName=; ${this.serializeCookieOptions({ ...this.COOKIE_OPTIONS, maxAge: 0 })}`;
      }

      // Set user email cookie for Firebase auth
      if (authData.userEmail) {
        document.cookie = `userEmail=${encodeURIComponent(authData.userEmail)}; ${this.serializeCookieOptions(this.COOKIE_OPTIONS)}`;
      } else {
        document.cookie = `userEmail=; ${this.serializeCookieOptions({ ...this.COOKIE_OPTIONS, maxAge: 0 })}`;
      }

      // Set authentication status cookie
      document.cookie = `isAuthenticated=${authData.isAuthenticated}; ${this.serializeCookieOptions(this.COOKIE_OPTIONS)}`;
    } catch (error) {
      console.error('Error setting auth cookies:', error);
    }
  }

  /**
   * Clear all authentication cookies (called on logout)
   */
  static clearAuthCookies(): void {
    if (typeof window === 'undefined') return;

    try {
      const clearOptions = { ...this.COOKIE_OPTIONS, maxAge: 0 };
      const cookieString = this.serializeCookieOptions(clearOptions);

      document.cookie = `authType=; ${cookieString}`;
      document.cookie = `userRole=; ${cookieString}`;
      document.cookie = `playerName=; ${cookieString}`;
      document.cookie = `userEmail=; ${cookieString}`;
      document.cookie = `isAuthenticated=; ${cookieString}`;
    } catch (error) {
      console.error('Error clearing auth cookies:', error);
    }
  }

  /**
   * Update auth cookies from current localStorage state
   * This can be called on app initialization to sync cookies with localStorage
   */
  static syncCookiesFromLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const authType = localStorage.getItem(SESSION_KEYS.AUTH_TYPE);
      
      if (!authType) {
        this.clearAuthCookies();
        return;
      }

      const authData: AuthCookieData = {
        authType: authType as 'firebase' | 'player',
        isAuthenticated: true,
      };

      if (authType === 'firebase') {
        const firebaseSession = localStorage.getItem(SESSION_KEYS.FIREBASE_SESSION);
        if (firebaseSession) {
          try {
            const sessionData = JSON.parse(firebaseSession);
            authData.role = sessionData.role;
            authData.userEmail = sessionData.user?.email;
          } catch (error) {
            console.error('Error parsing Firebase session for cookies:', error);
          }
        }
      } else if (authType === 'player') {
        const playerSession = localStorage.getItem(SESSION_KEYS.PLAYER_SESSION);
        if (playerSession) {
          try {
            const sessionData = JSON.parse(playerSession);
            authData.playerName = sessionData.name;
          } catch (error) {
            console.error('Error parsing player session for cookies:', error);
          }
        }
      }

      this.setAuthCookies(authData);
    } catch (error) {
      console.error('Error syncing cookies from localStorage:', error);
    }
  }

  /**
   * Helper function to serialize cookie options
   */
  private static serializeCookieOptions(options: any): string {
    return Object.entries(options)
      .map(([key, value]) => {
        if (key === 'sameSite') {
          return `${key}=${value}`;
        }
        if (typeof value === 'boolean') {
          return value ? key : '';
        }
        return `${key}=${value}`;
      })
      .filter(Boolean)
      .join('; ');
  }
}

/**
 * Parse authentication cookies from request headers
 * This is used by the middleware to read auth state
 */
export function parseAuthCookies(cookieHeader: string): AuthCookieData {
  const cookies: Record<string, string> = {};
  
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
  }

  return {
    authType: cookies.authType as 'firebase' | 'player' | null,
    role: cookies.userRole,
    playerName: cookies.playerName,
    userEmail: cookies.userEmail,
    isAuthenticated: cookies.isAuthenticated === 'true',
  };
}