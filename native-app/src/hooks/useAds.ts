import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { ADMOB_CONFIG } from '../lib/config';

// Check if we're in Expo Go (no native modules available)
const isExpoGo = Constants.appOwnership === 'expo';

// Get the appropriate ad unit ID based on platform
const getAdUnitId = (type: 'interstitial' | 'rewarded') => {
    const config = ADMOB_CONFIG[type];
    return Platform.OS === 'ios' ? config.ios : config.android;
};

// Interstitial Ad Hook
export function useInterstitialAd() {
    const [loaded, setLoaded] = useState(false);
    const [adInstance, setAdInstance] = useState<any>(null);

    useEffect(() => {
        // Skip ads in Expo Go
        if (isExpoGo) {
            console.log('Ads not available in Expo Go');
            return;
        }

        const initAd = async () => {
            try {
                const { InterstitialAd, AdEventType } = await import('react-native-google-mobile-ads');
                const interstitial = InterstitialAd.createForAdRequest(getAdUnitId('interstitial'));

                const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
                    setLoaded(true);
                });

                const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
                    setLoaded(false);
                    interstitial.load();
                });

                const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
                    console.log('Interstitial ad error:', error);
                    setLoaded(false);
                });

                setAdInstance(interstitial);
                interstitial.load();

                return () => {
                    unsubscribeLoaded();
                    unsubscribeClosed();
                    unsubscribeError();
                };
            } catch (error) {
                console.log('Ads not available:', error);
            }
        };

        initAd();
    }, []);

    const showAd = useCallback(async () => {
        if (isExpoGo) return false;
        if (adInstance && loaded) {
            await adInstance.show();
            return true;
        }
        return false;
    }, [adInstance, loaded]);

    return { loaded, showAd };
}

// Rewarded Ad Hook
export function useRewardedAd() {
    const [loaded, setLoaded] = useState(false);
    const [adInstance, setAdInstance] = useState<any>(null);
    const [reward, setReward] = useState<{ type: string; amount: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Skip ads in Expo Go
        if (isExpoGo) {
            console.log('Ads not available in Expo Go');
            setIsLoading(false);
            return;
        }

        const initAd = async () => {
            try {
                const { RewardedAd, AdEventType, RewardedAdEventType } = await import('react-native-google-mobile-ads');
                const rewarded = RewardedAd.createForAdRequest(getAdUnitId('rewarded'));

                const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
                    setLoaded(true);
                    setIsLoading(false);
                    setError(null);
                });

                const unsubscribeEarned = rewarded.addAdEventListener(
                    RewardedAdEventType.EARNED_REWARD,
                    (reward: any) => {
                        console.log('User earned reward:', reward);
                        setReward(reward);
                    }
                );

                const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
                    setLoaded(false);
                    setIsLoading(true);
                    rewarded.load();
                });

                const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error: any) => {
                    console.log('Rewarded ad error:', error);
                    setLoaded(false);
                    setIsLoading(false);
                    // Common error codes:
                    // 0 = Internal error, 1 = Invalid request, 2 = Network error, 3 = No fill (no ads available)
                    if (error?.code === 3 || error?.message?.includes('No fill')) {
                        setError('Ads are temporarily unavailable. Please try again later.');
                    } else if (error?.code === 2) {
                        setError('Network error. Check your connection.');
                    } else {
                        setError('Ads are not available right now.');
                    }
                    // Retry loading after a delay
                    setTimeout(() => {
                        setIsLoading(true);
                        rewarded.load();
                    }, 30000); // Retry after 30 seconds
                });

                setAdInstance(rewarded);
                rewarded.load();

                return () => {
                    unsubscribeLoaded();
                    unsubscribeEarned();
                    unsubscribeClosed();
                    unsubscribeError();
                };
            } catch (error) {
                console.log('Ads not available:', error);
                setIsLoading(false);
                setError('Ads module not available.');
            }
        };

        initAd();
    }, []);

    const showAd = useCallback(async (): Promise<boolean> => {
        if (isExpoGo) return false;
        if (adInstance && loaded) {
            setReward(null);
            await adInstance.show();
            return true;
        }
        return false;
    }, [adInstance, loaded]);

    return { loaded, showAd, reward, error, isLoading };
}
