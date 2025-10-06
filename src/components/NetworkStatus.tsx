"use client";

import { useState, useEffect } from "react";
import { FiWifi, FiWifiOff } from "react-icons/fi";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustCameOnline(true);
      setShowStatus(true);
      // Hide the status after 3 seconds when back online
      setTimeout(() => {
        setShowStatus(false);
        setJustCameOnline(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustCameOnline(false);
      setShowStatus(true);
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    // Show offline status immediately if offline
    if (!navigator.onLine) {
      setShowStatus(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Always show when offline, or temporarily when just came online
  if (!showStatus) return null;

  return (
    <div
      className={`fixed top-20 right-4 z-50 flex flex-col gap-1 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 max-w-xs ${
        isOnline
          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700"
          : "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700"
      }`}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <FiWifi className="h-4 w-4" />
            <span className="text-sm font-medium">Connection restored</span>
          </>
        ) : (
          <>
            <FiWifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">No internet connection</span>
          </>
        )}
      </div>
    </div>
  );
}
