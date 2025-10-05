"use client";

import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface BannerAdProps {
  adSlot?: string;
  size?: { width: number; height: number } | 'responsive';
  position?: 'top' | 'bottom' | 'inline';
  className?: string;
  onAdClick?: () => void;
  onAdClose?: () => void;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function BannerAd({
  adSlot = 'banner-ad-1',
  size = 'responsive',
  position = 'inline',
  className = '',
  onAdClick,
  onAdClose
}: BannerAdProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const adRef = useRef<HTMLDivElement>(null);

  // Helper function to get responsive ad dimensions
  const getResponsiveSize = () => {
    if (typeof size === 'object') {
      return size;
    }

    // Responsive sizing based on screen size
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;

      if (screenWidth < 480) {
        // Mobile
        return { width: 320, height: 50 };
      } else if (screenWidth < 768) {
        // Tablet
        return { width: 468, height: 60 };
      } else {
        // Desktop
        return { width: 728, height: 90 };
      }
    }

    // Default fallback
    return { width: 320, height: 50 };
  };

  useEffect(() => {
    const handleResize = () => {
      // Force re-render when window resizes to update ad size
      setIsLoaded(false);
      setIsError(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const adSize = getResponsiveSize();

    // Check if AdSense is available and ad unit ID exists
    const adUnitId = process.env.NEXT_PUBLIC_ADSENSE_BANNER_ID;
    if (!adUnitId) {
      setIsError(true);
      return;
    }

    // Wait for AdSense to be available
    const initAd = () => {
      if (!window.adsbygoogle) {
        // AdSense not loaded yet, try again in 100ms
        setTimeout(initAd, 100);
        return;
      }

      try {
        // Create and push the banner ad
        if (adRef.current && !adRef.current.hasChildNodes()) {
          const adElement = document.createElement('ins');
          adElement.className = 'adsbygoogle';
          adElement.style.display = 'block';
          adElement.style.width = `${adSize.width}px`;
          adElement.style.height = `${adSize.height}px`;
          adElement.setAttribute('data-ad-client', process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || '');
          adElement.setAttribute('data-ad-slot', adUnitId);
          adElement.setAttribute('data-ad-format', 'auto');
          adElement.setAttribute('data-full-width-responsive', 'true');

          adRef.current.appendChild(adElement);

          // Initialize the ad
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('AdSense banner ad error:', error);
        setIsError(true);
      }
    };

    // Start initialization
    initAd();
  }, [size]);

  const handleAdClick = () => {
    onAdClick?.();
    console.log('Banner ad clicked');
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    onAdClose?.();
    
    // Clean up the ad
    if (adRef.current) {
      adRef.current.innerHTML = '';
    }
  };

  if (!isVisible) {
    return null;
  }

  if (isError) {
    return (
      <div
        className={`
          relative bg-gray-100 dark:bg-gray-800
          border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm
          ${position === 'top' ? 'mb-4' : position === 'bottom' ? 'mt-4' : 'my-4'}
          ${className}
        `}
        style={{
          width: getResponsiveSize().width,
          height: getResponsiveSize().height,
          maxWidth: '100%'
        }}
      >
        {/* Fallback content when AdSense fails */}
        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-gray-400 text-lg">AD</span>
            </div>
            <p>Ad Placeholder</p>
            <p className="text-xs">AdSense unavailable</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        relative
        ${position === 'top' ? 'mb-4' : position === 'bottom' ? 'mt-4' : 'my-4'}
        ${className}
      `}
      style={{
        width: getResponsiveSize().width,
        height: getResponsiveSize().height,
        maxWidth: '100%'
      }}
    >
      <div
        ref={adRef}
        className="w-full h-full"
        onClick={handleAdClick}
      />

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors z-10"
        aria-label="Close ad"
        title="Close ad"
      >
        <X className="w-3 h-3 text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  );
}
