"use client";

import { useEffect, useState } from "react";
import { Share2, X } from "lucide-react";

declare global {
  interface Navigator {
    standalone?: boolean;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }

  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }
}

export default function InstallPrompt() {
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  // Check if running in standalone mode
  const checkStandalone = () => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isStandaloneMode);
    return isStandaloneMode;
  };

  // Detect iOS
  const isIos = () => {
    const ua = navigator.userAgent.toLowerCase();
    return (
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  };

  // Initial setup and event listeners
  useEffect(() => {
    // Check standalone mode on load
    checkStandalone();

    // Handle installation events
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      // Save the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the install button only when eligible and not already installed.
      setShowAndroidPrompt(true);
    };

    const handleAppInstalled = () => {
      // App installed successfully; hide button and mark standalone.
      setShowAndroidPrompt(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    // Listen for display mode changes (for detecting uninstall)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      const isStandaloneMode = checkStandalone();
      if (isStandaloneMode) {
        // Entered standalone: ensure prompt is hidden and event cleared.
        setShowAndroidPrompt(false);
        setDeferredPrompt(null);
      }
      // If not standalone, allow future beforeinstallprompt to show the button again.
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // iOS specific handling
    if (isIos() && !(navigator as any).standalone) {
      const dismissed = localStorage.getItem("iosInstallDismissed") === "true";
      setShowIosPrompt(!dismissed);
    }

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // Handle Android install button click
  const handleInstallClick = async () => {
    if (!deferredPrompt || isPrompting) return;

    try {
      setIsPrompting(true);
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (err) {
      console.error('Error handling install prompt:', err);
    } finally {
      // Clear the saved event and hide button to avoid duplicate prompts.
      setShowAndroidPrompt(false);
      setDeferredPrompt(null);
      setIsPrompting(false);
    }
  };

  // Dismiss iOS banner
  const dismissIosPrompt = () => {
    localStorage.setItem("iosInstallDismissed", "true");
    setShowIosPrompt(false);
  };

  // Don't show anything if in standalone mode
  if (isStandalone) return null;

  return (
    <>
      {/* Android Install Button */}
      {showAndroidPrompt && (
        <button
          onClick={handleInstallClick}
          disabled={isPrompting}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-full shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 z-50"
          aria-label="Install app"
        >
          Install App
        </button>
      )}

      {/* iOS Install Banner */}
      {showIosPrompt && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
              <Share2 className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-gray-700">
                To install this app, tap the Share button then &apos;Add to Home Screen&apos;.
              </p>
            </div>
            <button
              onClick={dismissIosPrompt}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
