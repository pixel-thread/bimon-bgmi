'use client';

import SnakeGame from '@/components/games/snake/SnakeGame';
import BannerAd from '@/components/ads/BannerAd';
import InterstitialAd from '@/components/ads/InterstitialAd';
import { useState } from 'react';

export default function snakePage() {
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [gameCount, setGameCount] = useState(0);

  const handleGameOver = (score: number) => {
    // Show interstitial ad every 3 games or when score is high
    if (gameCount % 3 === 0 || score > 50) {
      setShowInterstitialAd(true);
    }
    setGameCount(prev => prev + 1);
  };

  const handleCloseInterstitialAd = () => {
    setShowInterstitialAd(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Top Banner Ad */}
        <div className="flex justify-center mb-4">
          <BannerAd
            position="top"
            adSlot="snake-game-banner-top"
            className="rounded-lg overflow-hidden"
          />
        </div>

        <SnakeGame onGameOver={handleGameOver} />

        {/* Bottom Banner Ad */}
        <div className="flex justify-center mt-4">
          <BannerAd
            position="bottom"
            adSlot="snake-game-banner-bottom"
            className="rounded-lg overflow-hidden"
          />
        </div>

        {/* Interstitial Ad */}
        <InterstitialAd
          isVisible={showInterstitialAd}
          onClose={handleCloseInterstitialAd}
          autoClose={true}
          autoCloseDelay={8}
        />
      </div>
    </div>
  );
}