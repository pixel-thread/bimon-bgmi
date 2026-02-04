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

    useEffect(() => {
        // Skip ads in Expo Go
        if (isExpoGo) {
            console.log('Ads not available in Expo Go');
            return;
        }

        const initAd = async () => {
            try {
                const { RewardedAd, AdEventType, RewardedAdEventType } = await import('react-native-google-mobile-ads');
                const rewarded = RewardedAd.createForAdRequest(getAdUnitId('rewarded'));

                const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
                    setLoaded(true);
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
                    rewarded.load();
                });

                const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error: any) => {
                    console.log('Rewarded ad error:', error);
                    setLoaded(false);
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

    return { loaded, showAd, reward };
}
