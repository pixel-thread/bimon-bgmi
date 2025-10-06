"use client";

import { useAd } from "@/src/lib/adService";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Gift } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface RewardedAdProps {
  adSlot?: string;
  isVisible: boolean;
  onClose: () => void;
  onReward: (reward: string) => void;
  rewardType?: string;
  rewardAmount?: number;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdRef extends HTMLDivElement {
  _fallbackTimer?: any;
}

export default function RewardedAd({
  adSlot = "rewarded-ad-1",
  isVisible,
  onClose,
  onReward,
  rewardType = "Hint",
  rewardAmount = 1,
}: RewardedAdProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [adFailed, setAdFailed] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showSkipButton, setShowSkipButton] = useState(false);

  // Show skip button after 5 seconds
  useEffect(() => {
    if (showVideo) {
      const timer = setTimeout(() => {
        setShowSkipButton(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowSkipButton(false);
    }
  }, [showVideo]);

  const adConfig = {
    network: "google-adsense" as const,
    adType: "rewarded" as const,
    adSlot,
    size: { width: 300, height: 250 },
    position: "center" as const,
    enabled: true,
    frequency: 1,
  };

  const { adState, adService, showAd } = useAd(adConfig);
  const adUnitId = adService.getAdUnitId("rewarded");

  const adRef = useRef<AdRef>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (adRef.current && adRef.current._fallbackTimer) {
        clearTimeout(adRef.current._fallbackTimer);
      }
      window.removeEventListener("message", handleAdEvent);
    };
  }, []);

  // Initialize AdSense ad when component becomes visible
  useEffect(() => {
    if (isVisible && adUnitId && !adLoaded && !adFailed) {
      const initAd = () => {
        if (!window.adsbygoogle) {
          // AdSense not loaded yet, try again in 100ms
          setTimeout(initAd, 100);
          return;
        }

        try {
          if (adRef.current && !adRef.current.hasChildNodes()) {
            const adElement = document.createElement("ins");
            adElement.className = "adsbygoogle";
            adElement.style.display = "block";
            adElement.style.width = "300px";
            adElement.style.height = "250px";
            adElement.setAttribute(
              "data-ad-client",
              process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || ""
            );
            adElement.setAttribute("data-ad-slot", adUnitId);
            adElement.setAttribute("data-ad-format", "auto");

            adRef.current.appendChild(adElement);

            // Initialize the ad
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setAdLoaded(true);
          }
        } catch (error) {
          console.error("AdSense rewarded ad error:", error);
          setAdFailed(true);
        }
      };

      initAd();
    }
  }, [isVisible, adUnitId, adLoaded, adFailed, adSlot]);

  const handleAdEvent = (event: MessageEvent) => {
    console.log("AdSense event:", event);

    // Check for ad completion events
    if (
      event.data?.type === "rewarded_ad_completed" ||
      event.data?.type === "ad_completed" ||
      event.data?.action === "rewarded"
    ) {
      console.log("Rewarded ad completed successfully");
      cleanupAd();
      onReward(rewardType);
      onClose();
    }
  };

  const handleWatchAd = async () => {
    if (!adUnitId) {
      // No ad unit ID configured
      setAdFailed(true);
      return;
    }

    // Try to show real ad
    setIsWatching(true);
    setAdFailed(false);

    try {
      const adShown = await showAd();
      if (adShown) {
        setShowVideo(true);

        // Set up AdSense event listeners for proper completion detection
        if (adRef.current) {
          const adElement = adRef.current.querySelector("ins.adsbygoogle");
          if (adElement) {
            // Add event listener for AdSense messages
            window.addEventListener("message", handleAdEvent);

            // Fallback: if no completion event after 35 seconds, assume ad was watched
            const fallbackTimer = setTimeout(() => {
              // Only give reward if dialog is still open (user didn't close it)
              if (isVisible && showVideo) {
                cleanupAd();
                onReward(rewardType);
                onClose();
              }
            }, 35000);

            // Store timer reference for cleanup
            adRef.current._fallbackTimer = fallbackTimer;
          }
        }
      } else {
        throw new Error("Failed to show ad");
      }
    } catch (error) {
      cleanupAd();
      setAdFailed(true);
      setIsWatching(false);
    }
  };

  const cleanupAd = () => {
    setShowVideo(false);
    setIsWatching(false);
    setShowSkipButton(false);
    if (adRef.current && adRef.current._fallbackTimer) {
      clearTimeout(adRef.current._fallbackTimer);
      adRef.current._fallbackTimer = undefined;
    }
    window.removeEventListener("message", handleAdEvent);
  };

  const handleSkip = () => {
    cleanupAd();
    onClose();
  };

  const handleRetryAd = () => {
    setAdFailed(false);
    setRetryCount((prev) => prev + 1);
    handleWatchAd();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-1 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-auto relative overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {!showVideo ? (
              // Pre-video screen
              <div className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                  <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>

                <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white mb-2">
                  Watch Ad for Reward
                </h3>

                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 leading-relaxed">
                  Watch a short advertisement to get{" "}
                  <strong className="text-blue-600 dark:text-blue-400">
                    {rewardType}
                  </strong>
                </p>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-200 dark:border-gray-600">
                  <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                    <strong>Status:</strong>{" "}
                    {adUnitId ? "Ready to load" : "Cannot load ads"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center gap-1">
                    <span>Reward:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {rewardType}
                    </span>
                  </div>
                  {adUnitId && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center justify-center gap-1">
                      <span>💡</span>
                      <span>Watch full ad to earn reward</span>
                    </div>
                  )}
                  {!adUnitId && (
                    <div className="text-xs text-orange-600 dark:text-orange-400 mt-2 flex items-center justify-center gap-1">
                      <span>⚠️</span>
                      <span>Ad system not configured</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 sm:space-y-3">
                  <button
                    onClick={handleWatchAd}
                    disabled={isWatching}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-md min-h-[44px]"
                  >
                    <Play className="w-4 h-4 sm:w-4 sm:h-4" />
                    <span>{isWatching ? "Loading..." : "Watch Video"}</span>
                  </button>

                  <button
                    onClick={handleSkip}
                    className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-2 sm:py-2 px-4 sm:px-6 rounded-xl transition-colors text-sm sm:text-base font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[40px]"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ) : (
              // Video watching screen
              <div className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>

                <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white mb-2">
                  Watching Video...
                </h3>

                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 leading-relaxed">
                  Don't close this window
                </p>

                {/* Real AdSense Ad for rewarded video */}
                {adUnitId && (
                  <div
                    ref={adRef}
                    className="w-full h-[180px] sm:h-[220px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl mb-3 sm:mb-4 border border-gray-200 dark:border-gray-600"
                  />
                )}

                {/* Mock video progress - 30 seconds for rewarded ads */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3 sm:mb-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 30, ease: "linear" }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full shadow-sm"
                  />
                </div>

                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Collecting your reward...
                </div>

                {/* Skip button after 5 seconds */}
                {showSkipButton && (
                  <button
                    onClick={handleSkip}
                    className="mt-4 sm:mt-4 px-4 sm:px-6 py-2 sm:py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 text-xs sm:text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-h-[40px]"
                  >
                    Skip Ad
                  </button>
                )}
              </div>
            )}

            {/* Ad Failed Screen */}
            {adFailed && !showVideo && (
              <div className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                  <X className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>

                <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white mb-2">
                  {adUnitId ? "Ad Failed to Load" : "Cannot Load Ads"}
                </h3>

                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 leading-relaxed">
                  {adUnitId
                    ? "The advertisement failed to load. Please try again later or continue playing without a hint."
                    : "The ad system is not properly configured. Please try again later."}
                </p>

                <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-red-200 dark:border-red-800">
                  <div className="text-xs sm:text-sm text-red-700 dark:text-red-300 font-medium">
                    <strong>Ad Error:</strong>{" "}
                    {adUnitId
                      ? adState.error || "Ad network unavailable"
                      : "No ad unit ID configured"}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center justify-center gap-1">
                    <span>
                      {adUnitId
                        ? `Retry attempts: ${retryCount}/3`
                        : "Configuration required"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-3">
                  {adUnitId && (
                    <button
                      onClick={handleRetryAd}
                      disabled={retryCount >= 3}
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-md min-h-[44px]"
                    >
                      <Play className="w-4 h-4 sm:w-4 sm:h-4" />
                      <span>
                        {retryCount >= 3 ? "Max retries reached" : "Try Again"}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={handleSkip}
                    className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-2 sm:py-2 px-4 sm:px-6 rounded-xl transition-colors text-sm sm:text-base font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[40px]"
                  >
                    Continue Playing
                  </button>
                </div>
              </div>
            )}

            {/* Close Button (only show when not watching and not failed) */}
            {!showVideo && !adFailed && (
              <button
                onClick={handleSkip}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-200 dark:border-gray-600"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
