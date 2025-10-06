// lib/sessionPersistence.ts

/**
 * Enhanced session persistence utilities to prevent unwanted logouts
 */

export class SessionPersistence {
  private static readonly HEARTBEAT_KEY = "tournament_session_heartbeat";
  private static readonly HEARTBEAT_INTERVAL = 5 * 60000; // Increased to 5 minutes
  private static readonly ACTIVE_HEARTBEAT_INTERVAL = 2 * 60000; // 2 minutes when actively using
  private static heartbeatInterval: NodeJS.Timeout | null = null;
  private static lastUserActivity = Date.now();
  private static visibilityChangeCleanup: (() => void) | null = null;

  /**
   * Start smart session heartbeat that adapts based on user activity
   */
  static startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Setup user activity detection for smart heartbeat
    this.setupActivityDetection();
    
    // Setup visibility change handler
    const cleanup = this.setupVisibilityHandler();
    if (cleanup) {
      this.visibilityChangeCleanup = cleanup;
    }

    const updateHeartbeat = () => {
      try {
        // Only update heartbeat if tab is visible or recently active
        if (typeof document !== 'undefined' && document.hidden) {
          const timeSinceActivity = Date.now() - this.lastUserActivity;
          // Skip heartbeat if tab has been hidden for more than 10 minutes
          if (timeSinceActivity > 10 * 60000) {
            return;
          }
        }
        
        localStorage.setItem(this.HEARTBEAT_KEY, Date.now().toString());
      } catch (error) {
        console.warn("Failed to update session heartbeat:", error);
      }
    };

    // Determine initial interval based on recent activity
    const getHeartbeatInterval = () => {
      const timeSinceActivity = Date.now() - this.lastUserActivity;
      const isRecentlyActive = timeSinceActivity < 5 * 60000; // 5 minutes
      return isRecentlyActive ? this.ACTIVE_HEARTBEAT_INTERVAL : this.HEARTBEAT_INTERVAL;
    };

    const scheduleNextHeartbeat = () => {
      const interval = getHeartbeatInterval();
      this.heartbeatInterval = setTimeout(() => {
        updateHeartbeat();
        scheduleNextHeartbeat(); // Schedule next heartbeat
      }, interval);
    };

    // Set initial heartbeat and schedule next ones
    updateHeartbeat();
    scheduleNextHeartbeat();
  }

  /**
   * Stop session heartbeat
   */
  static stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Cleanup activity detection and visibility handlers
    if (this.visibilityChangeCleanup) {
      this.visibilityChangeCleanup();
      this.visibilityChangeCleanup = null;
    }

    try {
      localStorage.removeItem(this.HEARTBEAT_KEY);
    } catch (error) {
      console.warn("Failed to remove session heartbeat:", error);
    }
  }

  /**
   * Check if session is actively maintained
   */
  static isSessionActive(): boolean {
    try {
      const lastHeartbeat = localStorage.getItem(this.HEARTBEAT_KEY);
      if (!lastHeartbeat) return false;

      const lastHeartbeatTime = parseInt(lastHeartbeat);
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeatTime;

      // Consider session active if heartbeat is within 2 minutes
      return timeSinceLastHeartbeat < 120000;
    } catch (error) {
      console.warn("Failed to check session activity:", error);
      return false;
    }
  }

  /**
   * Prevent page unload from triggering logout
   */
  static setupPageUnloadProtection(): (() => void) | void {
    if (typeof window === "undefined") return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Don't show confirmation dialog, just ensure session persists
      this.markSessionAsReloading();
    };

    const handleUnload = () => {
      this.markSessionAsReloading();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    // Cleanup function
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
    };
  }

  /**
   * Mark session as reloading to prevent logout on page refresh
   */
  private static markSessionAsReloading(): void {
    try {
      localStorage.setItem(
        "tournament_session_reloading",
        Date.now().toString()
      );
    } catch (error) {
      console.warn("Failed to mark session as reloading:", error);
    }
  }

  /**
   * Check if session was recently reloading
   */
  static wasRecentlyReloading(): boolean {
    try {
      const reloadingTime = localStorage.getItem(
        "tournament_session_reloading"
      );
      if (!reloadingTime) return false;

      const reloadTime = parseInt(reloadingTime);
      const timeSinceReload = Date.now() - reloadTime;

      // Consider as recent reload if within 5 seconds
      const wasRecentReload = timeSinceReload < 5000;

      if (wasRecentReload) {
        // Clear the reloading marker
        localStorage.removeItem("tournament_session_reloading");
      }

      return wasRecentReload;
    } catch (error) {
      console.warn("Failed to check reload status:", error);
      return false;
    }
  }

  /**
   * Setup visibility change handler to maintain session
   */
  static setupVisibilityHandler(): (() => void) | void {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, update heartbeat
        try {
          localStorage.setItem(this.HEARTBEAT_KEY, Date.now().toString());
        } catch (error) {
          console.warn(
            "Failed to update heartbeat on visibility change:",
            error
          );
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup function
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }

  /**
   * Setup activity detection to track user engagement
   */
  static setupActivityDetection(): void {
    if (typeof window === "undefined") return;

    const updateActivity = () => {
      this.lastUserActivity = Date.now();
    };

    // Track various user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Store cleanup function for later removal
    const cleanup = () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };

    // Store cleanup function in visibilityChangeCleanup alongside visibility handler cleanup
    const originalCleanup = this.visibilityChangeCleanup;
    this.visibilityChangeCleanup = () => {
      cleanup();
      if (originalCleanup) originalCleanup();
    };
  }
}
