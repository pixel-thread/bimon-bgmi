"use client";

import { useEffect, useRef, useCallback } from "react";
import { startUpdateMonitoring, performUpdate } from "../lib/version";
import { registerServiceWorker } from "../lib/serviceWorker";

interface AppUpdateManagerProps {
  /**
   * Update strategy configuration
   */
  updateStrategy?: {
    /** Whether to update immediately when detected (default: false) */
    immediate?: boolean;
    /** Delay before applying update in milliseconds (default: 3000) */
    delay?: number;
    /** Number of retry attempts (default: 3) */
    retryAttempts?: number;
  };

  /**
   * Whether to enable debug logging (default: false)
   */
  debug?: boolean;
}

export function AppUpdateManager({
  updateStrategy = {
    immediate: false,
    delay: 3000,
    retryAttempts: 3,
  },
  debug = false,
}: AppUpdateManagerProps) {
  const cleanupRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef(false);

  const log = useCallback(
    (...args: any[]) => {
      if (debug) {
        console.log("[AppUpdateManager]", ...args);
      }
    },
    [debug]
  );

  const handleUpdateAvailable = useCallback(
    async (versionInfo: any) => {
      log("Update available:", versionInfo);

      try {
        // Ensure all required properties are defined with defaults
        const strategy = {
          immediate: updateStrategy.immediate ?? false,
          delay: updateStrategy.delay ?? 3000,
          retryAttempts: updateStrategy.retryAttempts ?? 3,
        };

        // Perform the update with the configured strategy
        await performUpdate(strategy);
        log("Update completed successfully");
      } catch (error) {
        console.error("Update failed:", error);
      }
    },
    [updateStrategy, log]
  );

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return;
    }

    const initializeUpdateSystem = async () => {
      try {
        log("Initializing update system...");

        // Register service worker first
        const registration = await registerServiceWorker();
        if (registration) {
          log("Service Worker registered successfully");
        }

        // Start monitoring for updates
        const cleanup = startUpdateMonitoring(handleUpdateAvailable);
        cleanupRef.current = cleanup;

        log("Update monitoring started");
        isInitializedRef.current = true;
      } catch (error) {
        console.error("Failed to initialize update system:", error);
      }
    };

    // Initialize after a short delay to avoid blocking initial render
    const timeoutId = setTimeout(initializeUpdateSystem, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [handleUpdateAvailable, log]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // This component doesn't render anything - it works in the background
  return null;
}
