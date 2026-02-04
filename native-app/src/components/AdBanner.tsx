import React, { useState, useEffect } from 'react';
import { View, Platform, StyleSheet, Text } from 'react-native';
import Constants from 'expo-constants';
import { ADMOB_CONFIG } from '../lib/config';

// Check if we're in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

interface AdBannerProps {
    size?: string;
}

export function AdBanner({ size }: AdBannerProps) {
    const [BannerComponent, setBannerComponent] = useState<React.ComponentType<any> | null>(null);
    const [bannerSize, setBannerSize] = useState<any>(null);

    useEffect(() => {
        if (isExpoGo) return;

        const loadBanner = async () => {
            try {
                const { BannerAd, BannerAdSize } = await import('react-native-google-mobile-ads');
                setBannerComponent(() => BannerAd);
                setBannerSize(BannerAdSize.ANCHORED_ADAPTIVE_BANNER);
            } catch (error) {
                console.log('Banner ads not available:', error);
            }
        };

        loadBanner();
    }, []);

    // Don't render anything in Expo Go
    if (isExpoGo || !BannerComponent) {
        return null;
    }

    const adUnitId = Platform.OS === 'ios'
        ? ADMOB_CONFIG.banner.ios
        : ADMOB_CONFIG.banner.android;

    return (
        <View style={styles.container}>
            <BannerComponent
                unitId={adUnitId}
                size={bannerSize}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdLoaded={() => {
                    console.log('Banner ad loaded');
                }}
                onAdFailedToLoad={(error: any) => {
                    console.log('Banner ad failed to load:', error);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
});
