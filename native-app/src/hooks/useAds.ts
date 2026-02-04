import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import {
    InterstitialAd,
    RewardedAd,
    AdEventType,
    RewardedAdEventType,
    TestIds,
} from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../lib/config';

// Get the appropriate ad unit ID based on platform
const getAdUnitId = (type: 'interstitial' | 'rewarded') => {
    const config = ADMOB_CONFIG[type];
    return Platform.OS === 'ios' ? config.ios : config.android;
};

// Interstitial Ad Hook
export function useInterstitialAd() {
    const [loaded, setLoaded] = useState(false);
    const [adInstance, setAdInstance] = useState<InterstitialAd | null>(null);

    useEffect(() => {
        const interstitial = InterstitialAd.createForAdRequest(getAdUnitId('interstitial'));

        const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
            setLoaded(true);
        });

        const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
            setLoaded(false);
            // Preload next ad
            interstitial.load();
        });

        const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
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
    }, []);

    const showAd = useCallback(async () => {
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
    const [adInstance, setAdInstance] = useState<RewardedAd | null>(null);
    const [reward, setReward] = useState<{ type: string; amount: number } | null>(null);

    useEffect(() => {
        const rewarded = RewardedAd.createForAdRequest(getAdUnitId('rewarded'));

        const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
            setLoaded(true);
        });

        const unsubscribeEarned = rewarded.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            (reward) => {
                console.log('User earned reward:', reward);
                setReward(reward);
            }
        );

        const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
            setLoaded(false);
            // Preload next ad
            rewarded.load();
        });

        const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
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
    }, []);

    const showAd = useCallback(async (): Promise<boolean> => {
        if (adInstance && loaded) {
            setReward(null);
            await adInstance.show();
            return true;
        }
        return false;
    }, [adInstance, loaded]);

    return { loaded, showAd, reward };
}
