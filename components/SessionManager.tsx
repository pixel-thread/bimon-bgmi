// components/SessionManager.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useSessionActivity } from "@/hooks/useSessionActivity";
import { SessionManager } from "@/lib/sessionManager";
import { useEffect, useState } from "react";

interface SessionManagerProps {
  children: React.ReactNode;
}

/**
 * Session manager component that handles automatic session extension
 * and provides session status information
 */
export const SessionManagerComponent: React.FC<SessionManagerProps> = ({
  children,
}) => {
  const { extendSession, authType, isAuthorized } = useAuth();
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<string>("");

  // Extend session on user activity
  useSessionActivity({
    onActivity: extendSession,
    throttleMs: 30000, // 30 seconds throttle
  });

  // Update session time remaining every 5 minutes instead of every minute
  useEffect(() => {
    if (!isAuthorized || !authType) {
      setSessionTimeRemaining("");
      return;
    }

    const updateTimer = () => {
      const remaining = SessionManager.formatRemainingTime();
      setSessionTimeRemaining(remaining);
    };

    // Update immediately
    updateTimer();

    // Update every 5 minutes instead of every minute to reduce background activity
    const interval = setInterval(updateTimer, 5 * 60000);

    return () => clearInterval(interval);
  }, [isAuthorized, authType]);

  // Show session warning when less than 5 minutes remaining
  useEffect(() => {
    if (!isAuthorized || !authType) return;

    const checkSessionWarning = () => {
      const remaining = SessionManager.getRemainingSessionTime();
      const fiveMinutes = 5 * 60 * 1000;

      if (remaining > 0 && remaining <= fiveMinutes) {
        // You could show a toast notification here
        console.warn(
          `Session expires in ${SessionManager.formatRemainingTime()}`
        );
      }
    };

    // Check every minute
    const interval = setInterval(checkSessionWarning, 60000);

    return () => clearInterval(interval);
  }, [isAuthorized, authType]);

  return (
    <>
      {children}
      {/* Optional: Display session time in development */}
      {process.env.NODE_ENV === "development" && isAuthorized && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded text-sm">
          Session: {sessionTimeRemaining}
        </div>
      )}
    </>
  );
};
