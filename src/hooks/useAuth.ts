// hooks/useAuth.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { auth, db } from "@/src/lib/firebase";
import {
  onAuthStateChanged,
  fetchSignInMethodsForEmail,
  User,
} from "firebase/auth";
import { doc, getDoc, DocumentSnapshot } from "firebase/firestore";
import { getUserRoleFromDB } from "@/src/lib/adminService";
import {
  extractUsername,
  formatUserDisplay,
  SUPER_ADMIN_EMAIL,
  UserRole,
} from "@/src/config/adminAccess";
import {
  PlayerUser,
  EnhancedAuthState,
  FirebaseSessionData,
} from "@/src/lib/types";
import { playerAuthService } from "@/src/lib/playerAuthService";
import {
  SessionManager,
  SESSION_KEYS,
  StorageSyncEvent,
} from "@/src/lib/sessionManager";
import { SessionPersistence } from "@/src/lib/sessionPersistence";
import {
  ErrorHandler,
  AppError,
  ErrorCategory,
  ErrorSeverity,
  handleAsync,
} from "@/src/lib/errorHandling";
import { LoadingStateManager, LoadingOperation } from "@/src/lib/loadingStates";
import { NetworkUtils } from "@/src/lib/networkUtils";
import { AuthCookieManager } from "@/src/lib/authCookies";

export interface UseAuthReturn extends EnhancedAuthState {
  loginAsPlayer: (name: string, password: string) => Promise<void>;
  loginAsPlayerWithSocial: (
    providerId: string,
    providerUid: string,
    email?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
  extendSession: () => void;
  isLoading: boolean; // Alias for loading property
  getLinkedSocialAccounts: () => Promise<string[]>;
  canLinkSocialAccount: (email: string) => Promise<boolean>;
  linkPlayerSocialAccount: (
    playerId: string,
    providerId: string,
    providerData: {
      email?: string;
      displayName?: string;
      photoURL?: string;
      uid?: string;
    }
  ) => Promise<void>;
  unlinkPlayerSocialAccount: (
    playerId: string,
    providerId: string
  ) => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<EnhancedAuthState>({
    user: null,
    loading: true,
    isAuthorized: false,
    role: "none",
    username: "",
    displayName: "",
    playerUser: null,
    authType: null,
    isPlayer: false,
  });

  // Use ref to prevent unnecessary re-renders
  const authStateRef = useRef(authState);
  authStateRef.current = authState;

  // Debounced state update to batch rapid changes
  const updateStateRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSetAuthState = useCallback(
    (updates: Partial<EnhancedAuthState>) => {
      if (updateStateRef.current) {
        clearTimeout(updateStateRef.current);
      }

      // In test environment, apply updates immediately
      if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
        setAuthState((prev) => ({ ...prev, ...updates }));
        return;
      }

      updateStateRef.current = setTimeout(() => {
        setAuthState((prev) => ({ ...prev, ...updates }));
      }, 50); // 50ms debounce
    },
    []
  );

  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storageListenerRef = useRef<((e: StorageEvent) => void) | null>(null);

  // Helper function to save player session
  const savePlayerSession = useCallback((playerUser: PlayerUser) => {
    SessionManager.saveSession(
      SESSION_KEYS.PLAYER_SESSION,
      playerUser,
      "player"
    );
  }, []);

  // Helper function to save Firebase session
  const saveFirebaseSession = useCallback((authData: any) => {
    SessionManager.saveSession(
      SESSION_KEYS.FIREBASE_SESSION,
      authData,
      "firebase"
    );
  }, []);

  // Helper function to load player session
  const loadPlayerSession = useCallback((): PlayerUser | null => {
    return SessionManager.loadSession<PlayerUser>(SESSION_KEYS.PLAYER_SESSION);
  }, []);

  // Helper function to load Firebase session
  const loadFirebaseSession = useCallback((): FirebaseSessionData | null => {
    return SessionManager.loadSession<FirebaseSessionData>(
      SESSION_KEYS.FIREBASE_SESSION
    );
  }, []);

  // Setup session timeout (disabled for persistent login)
  const setupSessionTimeout = useCallback(() => {
    // Clear any existing timeout
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
    // No automatic logout - sessions persist until manual logout
  }, []);

  // Handle cross-tab synchronization
  const handleStorageChange = useCallback(
    (e: StorageEvent) => {
      if (e.key === SESSION_KEYS.STORAGE_EVENT && e.newValue) {
        try {
          const syncData: StorageSyncEvent = JSON.parse(e.newValue);

          switch (syncData.type) {
            case "player_login":
              if (syncData.data) {
                debouncedSetAuthState({
                  playerUser: syncData.data,
                  authType: "player",
                  isPlayer: true,
                  isAuthorized: true,
                  username: syncData.data.name,
                  displayName: syncData.data.name,
                  user: null,
                  role: "none",
                  loading: false,
                });
              }
              break;

            case "firebase_login":
              if (syncData.data) {
                debouncedSetAuthState({
                  user: syncData.data.user,
                  authType: "firebase",
                  isPlayer: false,
                  playerUser: null,
                  isAuthorized: syncData.data.isAuthorized,
                  role: syncData.data.role,
                  username: syncData.data.username,
                  displayName: syncData.data.displayName,
                  loading: false,
                });
              }
              break;

            case "logout":
              if (sessionTimeoutRef.current) {
                clearTimeout(sessionTimeoutRef.current);
                sessionTimeoutRef.current = null;
              }
              debouncedSetAuthState({
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
              break;

            case "session_extend":
              // No action needed for persistent login
              break;
          }
        } catch (error) {
          console.error("❌ Error handling storage change:", error as Error);
        }
      }
    },
    [setupSessionTimeout, debouncedSetAuthState]
  );

  // Setup cross-tab synchronization
  const setupCrossTabSync = useCallback(() => {
    if (typeof window !== "undefined") {
      storageListenerRef.current = handleStorageChange;
      window.addEventListener("storage", handleStorageChange);
    }
  }, [handleStorageChange]);

  // Sync cookies on initialization
  const syncCookiesOnInit = useCallback(() => {
    if (typeof window !== "undefined") {
      AuthCookieManager.syncCookiesFromLocalStorage();
    }
  }, []);

  // Cleanup cross-tab synchronization
  const cleanupCrossTabSync = useCallback(() => {
    if (typeof window !== "undefined" && storageListenerRef.current) {
      window.removeEventListener("storage", storageListenerRef.current);
      storageListenerRef.current = null;
    }
  }, []);

  // Method to authenticate players using PlayerAuthService
  const loginAsPlayer = useCallback(
    async (name: string, password: string): Promise<void> => {
      const operationId = "player-login";

      try {
        LoadingStateManager.startLoading(operationId, LoadingOperation.LOGIN);

        let [player, error] = await handleAsync(
          playerAuthService.validatePlayerCredentials(name, password),
          { operation: "player_login", name }
        );

        if (error) {
          console.error("Player authentication error:", error);
          ErrorHandler.showError(error);
          throw error;
        }

        if (!player) {
          const authError = new AppError(
            "Invalid player credentials",
            ErrorCategory.AUTHENTICATION,
            ErrorSeverity.MEDIUM,
            "Invalid player name or password. Please check your credentials and try again.",
            new Error("Player not found or credentials invalid"),
            { name },
            false
          );
          ErrorHandler.showError(authError);
          throw authError;
        }

        // Fetch the absolute latest player data directly from Firestore
        // This ensures we have the most up-to-date linkedRole
        try {
          const { doc: docRef, getDoc } = await import("firebase/firestore");
          const { db } = await import("@/src/lib/firebase");

          const playerDocRef = docRef(db, "players", player.id);
          const playerDoc = await getDoc(playerDocRef);

          if (playerDoc.exists()) {
            const freshPlayerData = playerDoc.data();
            // Update the player object with fresh data, especially linkedRole
            player = {
              ...player,
              linkedRole: freshPlayerData.linkedRole || null,
              linkedEmail: freshPlayerData.linkedEmail || null,
            };
          }
        } catch (error) {
          console.warn("Could not fetch fresh player data:", error);
        }

        // Player data ready for session

        const playerUser: PlayerUser = {
          id: player.id,
          name: player.name,
          hasVoted: false, // This will be determined by poll service later
          loginPassword: player.loginPassword || "",
          // Include ban status
          isBanned: player.isBanned,
          banReason: player.banReason,
          banDuration: player.banDuration,
          bannedAt: player.bannedAt,
          bannedBy: player.bannedBy,
          // Include role linking
          linkedRole: player.linkedRole || null,
          linkedEmail: player.linkedEmail,
        };

        // Save session and update state
        savePlayerSession(playerUser);

        // Sync cookies for middleware
        AuthCookieManager.setAuthCookies({
          authType: "player",
          playerName: player.name,
          isAuthenticated: true,
        });

        debouncedSetAuthState({
          playerUser,
          authType: "player",
          isPlayer: true,
          isAuthorized: true,
          username: player.name,
          displayName: player.name,
          user: null,
          role: "none",
          loading: false,
        });

        // Start session persistence
        SessionPersistence.startHeartbeat();

        // Check if player has teams_admin role for redirect
        const successMessage =
          player.linkedRole === "teams_admin"
            ? "Successfully logged in as Teams Admin!"
            : "Successfully logged in as player!";

        ErrorHandler.showSuccess(successMessage);
      } catch (error) {
        const appError = ErrorHandler.handle(error, {
          operation: "player_login",
          name,
        });

        if (!(error instanceof AppError)) {
          ErrorHandler.showError(appError);
        }

        throw appError;
      } finally {
        LoadingStateManager.stopLoading(operationId);
      }
    },
    [savePlayerSession, setupSessionTimeout, debouncedSetAuthState]
  );

  // Enhanced logout method that clears both Firebase and player sessions
  const logout = useCallback(async (): Promise<void> => {
    const operationId = "logout";

    // IMMEDIATELY clear sessions to prevent race conditions
    try {
      localStorage.removeItem(SESSION_KEYS.PLAYER_SESSION);
      localStorage.removeItem(SESSION_KEYS.FIREBASE_SESSION);
      localStorage.removeItem(SESSION_KEYS.AUTH_TYPE);
      localStorage.removeItem(SESSION_KEYS.SESSION_TIMESTAMP);
      localStorage.removeItem("tournament_session_heartbeat");
    } catch (error) {
      console.warn("Error immediately clearing sessions:", error as Error);
    }

    try {
      LoadingStateManager.startLoading(operationId, LoadingOperation.LOGOUT);

      // Clear session timeout
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }

      // Sign out from Firebase if user is signed in (with timeout)
      if (authState.user) {
        try {
          // Add timeout to prevent hanging on slow connections
          const signOutPromise = auth.signOut();
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error("Firebase signout timeout")),
              10000
            );
          });

          await Promise.race([signOutPromise, timeoutPromise]);
        } catch (error) {
          console.warn(
            "⚠️ Firebase signout failed or timed out, but continuing with logout:",
            error as Error
          );
          // Continue with logout even if Firebase signout fails
        }
      }

      // Stop session persistence
      SessionPersistence.stopHeartbeat();

      // Reset auth state FIRST to prevent race conditions
      debouncedSetAuthState({
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

      // Clear all sessions
      SessionManager.clearAllSessions();

      // Clear auth cookies for middleware
      AuthCookieManager.clearAuthCookies();

      // Force clear any remaining sessions manually
      try {
        localStorage.removeItem(SESSION_KEYS.PLAYER_SESSION);
        localStorage.removeItem(SESSION_KEYS.FIREBASE_SESSION);
        localStorage.removeItem(SESSION_KEYS.AUTH_TYPE);
        localStorage.removeItem(SESSION_KEYS.SESSION_TIMESTAMP);
        localStorage.removeItem("tournament_session_heartbeat");
      } catch (error) {
        console.warn("Error force clearing sessions:", error as Error);
      }

      // Sessions cleared successfully

      ErrorHandler.showSuccess("Successfully logged out");
    } catch (error) {
      console.error("❌ Error during logout:", error as Error);

      // Stop session persistence
      SessionPersistence.stopHeartbeat();

      // Always clear sessions and reset state, even on error
      SessionManager.clearAllSessions();
      debouncedSetAuthState({
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

      // Don't throw error for logout - always succeed
      ErrorHandler.showSuccess("Logged out (with some cleanup issues)");
    } finally {
      LoadingStateManager.stopLoading(operationId);
    }
  }, [
    authState.user,
    authState.isAuthorized,
    authState.isPlayer,
    authState.username,
    authState.playerUser,
    authState.authType,
    debouncedSetAuthState,
  ]);

  // Method to restore authentication state on page reload
  const refreshAuthState = useCallback(async (): Promise<void> => {
    try {
      // Check if we just logged out - if so, don't restore sessions
      const justLoggedOut = sessionStorage.getItem("just_logged_out");
      if (justLoggedOut) {
        debouncedSetAuthState({ loading: false });
        return;
      }

      // Check for existing player session first (no expiry check for persistent login)
      const savedPlayerSession = loadPlayerSession();

      if (savedPlayerSession) {
        // Skip validation if offline - just restore from cache
        if (!NetworkUtils.isOnline()) {
          console.log("Offline detected, restoring player session from cache");
          SessionManager.updateSessionTimestamp();
          SessionPersistence.startHeartbeat();

          debouncedSetAuthState({
            playerUser: savedPlayerSession,
            authType: "player",
            isPlayer: true,
            isAuthorized: true,
            username: savedPlayerSession.name,
            displayName: savedPlayerSession.name,
            user: null,
            role: "none",
            loading: false,
          });
          return;
        }

        // Validate that the player session is still valid (only when online)
        const [player, error] = await handleAsync(
          playerAuthService.getPlayerById(savedPlayerSession.id),
          {
            operation: "validate_player_session",
            playerId: savedPlayerSession.id,
          }
        );

        if (error) {
          console.warn("Error validating player session:", error);

          // Check if it's a network error - if so, keep the session and try to restore from cache
          if (NetworkUtils.isNetworkError(error)) {
            console.log(
              "Network error detected, keeping cached player session"
            );

            // Use cached session data and mark as restored from cache
            SessionManager.updateSessionTimestamp();
            SessionPersistence.startHeartbeat();

            debouncedSetAuthState({
              playerUser: savedPlayerSession,
              authType: "player",
              isPlayer: true,
              isAuthorized: true,
              username: savedPlayerSession.name,
              displayName: savedPlayerSession.name,
              user: null,
              role: "none",
              loading: false,
            });
            return;
          }

          // Only clear sessions for non-network errors (like player deleted, etc.)
          SessionManager.clearAllSessions();
          debouncedSetAuthState({ loading: false });
          return;
        }

        if (player) {
          SessionManager.updateSessionTimestamp();

          // Use fresh player data from Firestore instead of cached session
          const updatedPlayerSession = {
            ...savedPlayerSession,
            name: player.name,
            // Update ban status from fresh data
            isBanned: player.isBanned,
            banReason: player.banReason,
            banDuration: player.banDuration,
            bannedAt: player.bannedAt,
            bannedBy: player.bannedBy,
            // Update role linking from fresh data
            linkedRole: player.linkedRole || null,
            linkedEmail: player.linkedEmail,
          };

          // Update localStorage with fresh data
          SessionManager.saveSession(
            SESSION_KEYS.PLAYER_SESSION,
            updatedPlayerSession,
            "player"
          );

          // Start session persistence for restored session
          SessionPersistence.startHeartbeat();

          debouncedSetAuthState({
            playerUser: updatedPlayerSession,
            authType: "player",
            isPlayer: true,
            isAuthorized: true,
            username: player.name,
            displayName: player.name,
            user: null,
            role: "none",
            loading: false,
          });
          return;
        } else {
          // Player session is invalid, clear it
          SessionManager.clearAllSessions();
        }
      }

      // Check for Firebase session (no expiry check for persistent login)
      const savedFirebaseSession = loadFirebaseSession();
      if (savedFirebaseSession) {
        // Firebase session will be validated by onAuthStateChanged
        SessionManager.updateSessionTimestamp();
      }

      // If no valid sessions, Firebase auth state will be handled by onAuthStateChanged
    } catch (error) {
      const appError = ErrorHandler.handle(error, {
        operation: "refresh_auth_state",
      });
      console.error("Error refreshing auth state:", appError);

      // Check if it's a network error - if so, try to keep existing sessions
      if (NetworkUtils.isNetworkError(appError)) {
        console.log(
          "Network error during auth refresh, keeping existing sessions"
        );

        // Try to restore from cached sessions without validation
        const savedPlayerSession = loadPlayerSession();
        const savedFirebaseSession = loadFirebaseSession();

        if (savedPlayerSession) {
          debouncedSetAuthState({
            playerUser: savedPlayerSession,
            authType: "player",
            isPlayer: true,
            isAuthorized: true,
            username: savedPlayerSession.name,
            displayName: savedPlayerSession.name,
            user: null,
            role: "none",
            loading: false,
          });
          return;
        } else if (savedFirebaseSession) {
          debouncedSetAuthState({
            user: savedFirebaseSession.user,
            authType: "firebase",
            isPlayer: false,
            playerUser: null,
            isAuthorized: savedFirebaseSession.isAuthorized,
            role: savedFirebaseSession.role,
            username: savedFirebaseSession.username,
            displayName: savedFirebaseSession.displayName,
            loading: false,
          });
          return;
        }
      }

      // Only clear sessions for non-network errors
      SessionManager.clearAllSessions();
      debouncedSetAuthState({ loading: false });
    }
  }, [loadPlayerSession, loadFirebaseSession, debouncedSetAuthState]);

  // Method to extend session (called on user activity)
  const extendSession = useCallback(() => {
    if (authState.authType) {
      SessionManager.extendSession();
    }
  }, [authState.authType]);

  useEffect(() => {
    // Initialize auth state on mount
    refreshAuthState();
    setupCrossTabSync();
    syncCookiesOnInit();

    // Setup session persistence
    SessionPersistence.setupPageUnloadProtection();
    SessionPersistence.setupVisibilityHandler();

    // Setup network status listener to refresh auth when coming back online
    const handleOnline = () => {
      console.log("Network came back online, refreshing auth state");
      // Small delay to ensure network is stable
      setTimeout(() => {
        refreshAuthState();
      }, 1000);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // If we have a player session, don't override it with Firebase auth
      const savedPlayerSession = loadPlayerSession();
      if (savedPlayerSession) {
        return;
      }

      if (currentUser && currentUser.email) {
        try {
          // Quick offline check with cached session
          if (!NetworkUtils.isOnline()) {
            const savedFirebaseSession = loadFirebaseSession();
            if (savedFirebaseSession) {
              debouncedSetAuthState({
                user: currentUser,
                loading: false,
                isAuthorized: savedFirebaseSession.isAuthorized,
                role: savedFirebaseSession.role,
                username: savedFirebaseSession.username,
                displayName: savedFirebaseSession.displayName,
                authType: "firebase",
                isPlayer: false,
                playerUser: null,
              });
            }
            return;
          }

          // Fast path for super admin
          if (currentUser.email === SUPER_ADMIN_EMAIL) {
            const authData = {
              user: currentUser,
              isAuthorized: true,
              role: "super_admin" as UserRole,
              username: "bimon",
              displayName: "Super Admin",
            };

            saveFirebaseSession(authData);
            SessionManager.updateSessionTimestamp();
            AuthCookieManager.setAuthCookies({
              authType: "firebase",
              role: "super_admin",
              userEmail: currentUser.email,
              isAuthenticated: true,
            });
            SessionPersistence.startHeartbeat();

            debouncedSetAuthState({
              user: currentUser,
              loading: false,
              isAuthorized: true,
              role: "super_admin",
              username: "bimon",
              displayName: "Super Admin",
              authType: "firebase",
              isPlayer: false,
              playerUser: null,
            });
            return;
          }

          // Optimized authorization check with shorter timeout
          let emailSnap: DocumentSnapshot | null = null;
          let retryCount = 0;
          const maxRetries = 2; // Reduced from 3

          while (retryCount < maxRetries) {
            try {
              const emailDoc = doc(db, "authorized_emails", currentUser.email);
              const getDocPromise = getDoc(emailDoc);
              const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error("Firestore timeout")), 8000); // Reduced from 15000
              });

              emailSnap = await Promise.race([getDocPromise, timeoutPromise]);
              break;
            } catch (error) {
              retryCount++;
              if (retryCount >= maxRetries) {
                console.warn("Auth check failed, keeping existing session");
                return; // Don't logout on network issues
              }
              await new Promise((resolve) =>
                setTimeout(resolve, 500 * retryCount)
              ); // Faster retry
            }
          }

          if (emailSnap && emailSnap.exists()) {
            // Get user role from admin_roles collection
            let role: UserRole = "teams_admin"; // Default role
            try {
              role = await getUserRoleFromDB(currentUser.email);
            } catch (roleError) {
              console.warn("Failed to get user role, using default");
            }

            const username = extractUsername(currentUser.email);
            const displayName = formatUserDisplay(currentUser.email);

            const authData = {
              user: currentUser,
              isAuthorized: true,
              role,
              username,
              displayName,
            };

            saveFirebaseSession(authData);
            SessionManager.updateSessionTimestamp();
            AuthCookieManager.setAuthCookies({
              authType: "firebase",
              role,
              userEmail: currentUser.email,
              isAuthenticated: true,
            });
            SessionPersistence.startHeartbeat();

            // Load linked player data for teams_admin (async, non-blocking)
            let linkedPlayerUser: PlayerUser | null = null;
            if (role === "teams_admin") {
              try {
                const { getPlayerByLinkedEmail } = await import(
                  "@/src/lib/adminService"
                );
                const linkedPlayer = await getPlayerByLinkedEmail(
                  currentUser.email
                );
                if (linkedPlayer) {
                  linkedPlayerUser = {
                    id: linkedPlayer.id,
                    name: linkedPlayer.name,
                    hasVoted: false,
                    loginPassword: linkedPlayer.loginPassword || "",
                    isBanned: linkedPlayer.isBanned,
                    banReason: linkedPlayer.banReason,
                    banDuration: linkedPlayer.banDuration,
                    bannedAt: linkedPlayer.bannedAt,
                    bannedBy: linkedPlayer.bannedBy,
                    linkedRole: linkedPlayer.linkedRole || null,
                    linkedEmail: linkedPlayer.linkedEmail,
                  };
                }
              } catch (error) {
                console.warn("Failed to load linked player");
              }
            }

            // Single debounced state update
            debouncedSetAuthState({
              user: currentUser,
              loading: false,
              isAuthorized: true,
              role,
              username,
              displayName,
              authType: "firebase",
              isPlayer: !!linkedPlayerUser,
              playerUser: linkedPlayerUser,
            });
          } else if (emailSnap && !emailSnap.exists()) {
            // User is authenticated but not authorized
            try {
              await auth.signOut();
            } catch (signOutError) {
              console.warn("Failed to sign out unauthorized user");
            }
            SessionManager.clearAllSessions();
            debouncedSetAuthState({
              user: null,
              loading: false,
              isAuthorized: false,
              role: "none",
              username: "",
              displayName: "",
              authType: null,
              isPlayer: false,
              playerUser: null,
            });
          }
        } catch (error) {
          console.error("Error in auth state change handler:", error as Error);
          // Only clear sessions on non-network errors
          if (!NetworkUtils.isNetworkError(error)) {
            SessionManager.clearAllSessions();
            debouncedSetAuthState({
              user: null,
              loading: false,
              isAuthorized: false,
              role: "none",
              username: "",
              displayName: "",
              authType: null,
              isPlayer: false,
              playerUser: null,
            });
          }
        }
      } else {
        // No Firebase user signed in
        const savedPlayerSession = loadPlayerSession();
        if (!savedPlayerSession) {
          debouncedSetAuthState({
            user: null,
            loading: false,
            isAuthorized: false,
            role: "none",
            username: "",
            displayName: "",
            authType: null,
            isPlayer: false,
            playerUser: null,
          });
        }
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
      cleanupCrossTabSync();
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
      }
    };
  }, [
    refreshAuthState,
    authState.authType,
    authState.playerUser,
    setupCrossTabSync,
    cleanupCrossTabSync,
    saveFirebaseSession,
    setupSessionTimeout,
    loadPlayerSession,
    syncCookiesOnInit,
    debouncedSetAuthState,
  ]);

  // Get linked social accounts for current user
  const getLinkedSocialAccounts = useCallback(async (): Promise<string[]> => {
    if (!authState.user?.email) return [];

    try {
      const signInMethods = await fetchSignInMethodsForEmail(
        auth,
        authState.user.email
      );
      return signInMethods;
    } catch (error) {
      console.error("Error fetching social accounts:", error);
      return [];
    }
  }, [authState.user?.email]);

  // Check if user can link a social account
  const canLinkSocialAccount = useCallback(
    async (email: string): Promise<boolean> => {
      try {
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);
        // Allow linking if no social providers are already linked
        return signInMethods.length === 0;
      } catch (error) {
        console.error("Error checking social account linking:", error);
        return false;
      }
    },
    []
  );

  // Social authentication for players
  const loginAsPlayerWithSocial = useCallback(
    async (
      providerId: string,
      providerUid: string,
      email?: string
    ): Promise<void> => {
      const operationId = "player-social-login";

      try {
        LoadingStateManager.startLoading(operationId, LoadingOperation.LOGIN);

        let [player, error] = await handleAsync(
          playerAuthService.authenticatePlayerWithSocialProvider(
            providerId,
            providerUid,
            email
          ),
          { operation: "player_social_login", providerId, providerUid }
        );

        if (error) {
          console.error("Player social authentication error:", error);
          ErrorHandler.showError(error);
          throw error;
        }

        if (!player) {
          const authError = new AppError(
            "No player found with this social account",
            ErrorCategory.AUTHENTICATION,
            ErrorSeverity.MEDIUM,
            "No player account is linked to this social provider. Please link your social account first or use traditional login.",
            new Error("Player not found with social provider"),
            { providerId, providerUid },
            false
          );
          ErrorHandler.showError(authError);
          throw authError;
        }

        // Fetch the absolute latest player data directly from Firestore
        try {
          const { doc: docRef, getDoc } = await import("firebase/firestore");
          const { db } = await import("@/src/lib/firebase");

          const playerDocRef = docRef(db, "players", player.id);
          const playerDoc = await getDoc(playerDocRef);

          if (playerDoc.exists()) {
            const freshPlayerData = playerDoc.data();
            // Update the player object with fresh data, especially linkedRole
            player = {
              ...player,
              linkedRole: freshPlayerData.linkedRole || null,
              linkedEmail: freshPlayerData.linkedEmail || null,
            };
          }
        } catch (error) {
          console.warn("Could not fetch fresh player data:", error);
        }

        // Player data ready for session
        const playerUser: PlayerUser = {
          id: player.id,
          name: player.name,
          hasVoted: false, // This will be determined by poll service later
          loginPassword: player.loginPassword || "",
          // Include ban status
          isBanned: player.isBanned,
          banReason: player.banReason,
          banDuration: player.banDuration,
          bannedAt: player.bannedAt,
          bannedBy: player.bannedBy,
          // Include role linking
          linkedRole: player.linkedRole || null,
          linkedEmail: player.linkedEmail,
        };

        // Save session and update state
        savePlayerSession(playerUser);

        // Sync cookies for middleware
        AuthCookieManager.setAuthCookies({
          authType: "player",
          playerName: player.name,
          isAuthenticated: true,
        });

        debouncedSetAuthState({
          playerUser,
          authType: "player",
          isPlayer: true,
          isAuthorized: true,
          username: player.name,
          displayName: player.name,
          user: null,
          role: "none",
          loading: false,
        });

        // Start session persistence
        SessionPersistence.startHeartbeat();

        // Check if player has teams_admin role for redirect
        const successMessage =
          player.linkedRole === "teams_admin"
            ? "Successfully logged in as Teams Admin!"
            : "Successfully logged in as player!";

        ErrorHandler.showSuccess(successMessage);
      } catch (error) {
        const appError = ErrorHandler.handle(error, {
          operation: "player_social_login",
          providerId,
          providerUid,
        });

        if (!(error instanceof AppError)) {
          ErrorHandler.showError(appError);
        }

        throw appError;
      } finally {
        LoadingStateManager.stopLoading(operationId);
      }
    },
    [savePlayerSession, debouncedSetAuthState]
  );

  // Link social account to player
  const linkPlayerSocialAccount = useCallback(
    async (
      playerId: string,
      providerId: string,
      providerData: {
        email?: string;
        displayName?: string;
        photoURL?: string;
        uid?: string;
      }
    ): Promise<void> => {
      try {
        const updatedPlayer = await playerAuthService.linkSocialProvider(
          playerId,
          providerId,
          providerData
        );

        // If this is the current player, update the session
        if (authState.playerUser?.id === playerId) {
          const updatedPlayerUser: PlayerUser = {
            ...authState.playerUser,
            // Update any fields that might have changed
          };

          savePlayerSession(updatedPlayerUser);
          debouncedSetAuthState({
            playerUser: updatedPlayerUser,
          });
        }

        ErrorHandler.showSuccess("Social account linked successfully!");
      } catch (error) {
        console.error("Error linking social account to player:", error);
        ErrorHandler.showError(
          new AppError(
            "Failed to link social account",
            ErrorCategory.AUTHENTICATION,
            ErrorSeverity.MEDIUM,
            "Unable to link your social account. Please try again.",
            error instanceof Error ? error : new Error(String(error))
          )
        );
        throw error;
      }
    },
    [authState.playerUser, savePlayerSession, debouncedSetAuthState]
  );

  // Unlink social account from player
  const unlinkPlayerSocialAccount = useCallback(
    async (playerId: string, providerId: string): Promise<void> => {
      try {
        const updatedPlayer = await playerAuthService.unlinkSocialProvider(
          playerId,
          providerId
        );

        // If this is the current player, update the session
        if (authState.playerUser?.id === playerId) {
          const updatedPlayerUser: PlayerUser = {
            ...authState.playerUser,
            // Update any fields that might have changed
          };

          savePlayerSession(updatedPlayerUser);
          debouncedSetAuthState({
            playerUser: updatedPlayerUser,
          });
        }

        ErrorHandler.showSuccess("Social account unlinked successfully!");
      } catch (error) {
        console.error("Error unlinking social account from player:", error);
        ErrorHandler.showError(
          new AppError(
            "Failed to unlink social account",
            ErrorCategory.AUTHENTICATION,
            ErrorSeverity.MEDIUM,
            "Unable to unlink your social account. Please try again.",
            error instanceof Error ? error : new Error(String(error))
          )
        );
        throw error;
      }
    },
    [authState.playerUser, savePlayerSession, debouncedSetAuthState]
  );

  return {
    ...authState,
    loginAsPlayer,
    loginAsPlayerWithSocial,
    logout,
    refreshAuthState,
    extendSession,
    isLoading: authState.loading, // Alias for loading property
    getLinkedSocialAccounts,
    canLinkSocialAccount,
    linkPlayerSocialAccount,
    unlinkPlayerSocialAccount,
  };
};
