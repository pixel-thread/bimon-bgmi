// hooks/useSessionActivity.ts
"use client";

import { useEffect, useCallback, useRef } from "react";

interface UseSessionActivityOptions {
  onActivity: () => void;
  throttleMs?: number;
  events?: string[];
}

/**
 * Hook to detect user activity and extend session
 */
export const useSessionActivity = ({
  onActivity,
  throttleMs = 30000, // 30 seconds throttle by default
  events = [
    "mousedown",
    "mousemove",
    "keypress",
    "scroll",
    "touchstart",
    "click",
  ],
}: UseSessionActivityOptions) => {
  const lastActivityRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleActivity = useCallback(() => {
    const now = Date.now();

    // Throttle activity detection
    if (now - lastActivityRef.current < throttleMs) {
      return;
    }

    lastActivityRef.current = now;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the activity callback
    timeoutRef.current = setTimeout(() => {
      onActivity();
    }, 1000);
  }, [onActivity, throttleMs]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Add event listeners for user activity
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup function
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleActivity, events]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};
