"use client";

import { useState, useEffect, useCallback } from 'react';

// Ad network types
export type AdNetwork = 'google-adsense' | 'mock' | 'custom';

// Ad types
export type AdType = 'banner' | 'interstitial' | 'rewarded';

// Ad sizes
export interface AdSize {
  width: number;
  height: number;
}

// Ad configuration
export interface AdConfig {
  network: AdNetwork;
  adType: AdType;
  adSlot?: string;
  size: AdSize;
  position?: 'top' | 'bottom' | 'center' | 'inline';
  frequency?: number; // Show ad every N games
  enabled: boolean;
}

// Ad display state
export interface AdState {
  isLoading: boolean;
  isVisible: boolean;
  error: string | null;
}


class AdService {
  private config: AdConfig;
  private adNetwork: AdNetwork;

  constructor(config: AdConfig) {
    this.config = config;
    this.adNetwork = config.network;
  }

  async loadAd(): Promise<boolean> {
    if (this.adNetwork === 'google-adsense') {
      // For AdSense, we don't need to preload - ads are loaded when displayed
      return true;
    }

    // For other networks, implement actual ad loading logic
    return false;
  }

  async showAd(): Promise<boolean> {
    if (this.adNetwork === 'google-adsense') {
      // AdSense ads are displayed through the Google AdSense script
      // This method would typically trigger ad display
      return true;
    }

    // For other networks, implement actual ad display logic
    return false;
  }

  getAdUnitId(type: AdType): string | null {
    // Return appropriate AdSense ad unit IDs
    const adUnits: Record<AdType, string | null> = {
      banner: process.env.NEXT_PUBLIC_ADSENSE_BANNER_ID || null,
      interstitial: process.env.NEXT_PUBLIC_ADSENSE_INTERSTITIAL_ID || null,
      rewarded: process.env.NEXT_PUBLIC_ADSENSE_REWARDED_ID || null
    };
    return adUnits[type];
  }
}

// Custom hook for managing ads
export function useAd(config: AdConfig) {
  const [adState, setAdState] = useState<AdState>({
    isLoading: false,
    isVisible: false,
    error: null
  });

  const [adService] = useState(() => new AdService(config));

  const loadAd = useCallback(async () => {
    if (!config.enabled) return;

    setAdState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await adService.loadAd();
      if (success) {
        setAdState(prev => ({ ...prev, isLoading: false, isVisible: true }));
      }
    } catch (error) {
      setAdState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [config.enabled, adService]);

  const showAd = useCallback(async () => {
    if (!config.enabled) return false;

    try {
      const success = await adService.showAd();
      return success;
    } catch (error) {
      console.error('Failed to show ad:', error);
      return false;
    }
  }, [config.enabled, adService]);

  const hideAd = useCallback(() => {
    setAdState(prev => ({ ...prev, isVisible: false }));
  }, []);

  useEffect(() => {
    if (config.enabled && config.network === 'google-adsense') {
      // Initialize AdSense ads when component mounts
      loadAd();
    }
  }, [config.enabled, config.network, loadAd]);

  return {
    adState,
    loadAd,
    showAd,
    hideAd,
    adService
  };
}

// Hook for managing ad frequency and game state
export function useAdManager() {
  const [gameCount, setGameCount] = useState(0);
  const [lastAdShown, setLastAdShown] = useState<number>(0);

  const shouldShowAd = useCallback((frequency: number = 3) => {
    return gameCount - lastAdShown >= frequency;
  }, [gameCount, lastAdShown]);

  const recordGameStart = useCallback(() => {
    setGameCount(prev => prev + 1);
  }, []);

  const recordAdShown = useCallback(() => {
    setLastAdShown(gameCount);
  }, [gameCount]);

  return {
    gameCount,
    shouldShowAd,
    recordGameStart,
    recordAdShown
  };
}
