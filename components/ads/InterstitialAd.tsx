"use client";

import { useAd } from '@/lib/adService';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface InterstitialAdProps {
  adSlot?: string;
  isVisible: boolean;
  onClose: () => void;
  onAdClick?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number; // in seconds
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function InterstitialAd({
  adSlot = 'interstitial-ad-1',
  isVisible,
  onClose,
  onAdClick,
  autoClose = false,
  autoCloseDelay = 5
}: InterstitialAdProps) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  const adConfig = {
    network: 'google-adsense' as const,
    adType: 'interstitial' as const,
    adSlot,
    size: { width: 300, height: 250 },
    position: 'center' as const,
    enabled: true,
    frequency: 1
  };

  const { adState, adService, showAd } = useAd(adConfig);
  const adUnitId = adService.getAdUnitId('interstitial');

  useEffect(() => {
    if (isVisible && adUnitId && !adError) {
      const initAd = () => {
        if (!window.adsbygoogle) {
          // AdSense not loaded yet, try again in 100ms
          setTimeout(initAd, 100);
          return;
        }

        try {
          // Initialize AdSense ad
          if (adRef.current) {
            // Clear existing ad content if any
            while (adRef.current.firstChild) {
              adRef.current.removeChild(adRef.current.firstChild);
            }

            const adElement = document.createElement('ins');
            adElement.className = 'adsbygoogle';
            adElement.style.display = 'block';
            adElement.style.width = '300px';
            adElement.style.height = '250px';
            adElement.setAttribute('data-ad-client', process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || 'ca-pub-2651043074081875');
            adElement.setAttribute('data-ad-slot', adUnitId || '1234567890');
            adElement.setAttribute('data-ad-format', 'auto');

            adRef.current.appendChild(adElement);

            // Initialize the ad
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setAdLoaded(true);
          }
        } catch (error) {
          console.error('AdSense interstitial ad error:', error);
          setAdError(true);
        }
      };

      initAd();
    } else if (isVisible && !adUnitId) {
      // No ad unit ID configured, show error immediately
      console.warn('No AdSense interstitial ad unit ID configured');
      setAdError(true);
    }
  }, [isVisible, adUnitId, adError]);

  const [countdown, setCountdown] = useState(autoCloseDelay);

  useEffect(() => {
    if (autoClose && isVisible) {
      setCountdown(autoCloseDelay);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [autoClose, autoCloseDelay, isVisible]);

  const handleAdClick = () => {
    onAdClick?.();
    console.log('Interstitial ad clicked');
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm mx-auto relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
              {/* Ad Content */}
              <div className="relative">
                {adError ? (
                  /* Fallback content when AdSense fails */
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-4xl mb-2">🎮</div>
                      <div className="font-bold text-lg">Demo Ad</div>
                      <div className="text-sm mt-2">Ad configuration needed</div>
                    </div>
                  </div>
                ) : (
                  /* Real AdSense Ad */
                  <div
                    ref={adRef}
                    className="w-full h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800"
                  />
                )}

                {/* Ad Details */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                    {adError ? 'Demo Advertisement' : 'Advertisement'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {adError ? 'AdSense ad unit configuration is required for live ads. Please configure your AdSense IDs in the environment variables.' : 'Interactive advertisement'}
                  </p>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleAdClick}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <span>Learn More</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {adError ? 'Demo Mode' : 'Ad'}
                    </span>
                  </div>
                </div>
              </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 w-8 h-8 bg-black/20 hover:bg-black/30 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Auto-close countdown - show when autoClose is enabled, regardless of ad error state */}
            {autoClose && countdown > 0 && (
              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                Auto-close in {countdown}s
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
