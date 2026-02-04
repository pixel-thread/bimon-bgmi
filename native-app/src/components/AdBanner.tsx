import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../lib/config';

interface AdBannerProps {
    size?: BannerAdSize;
}

export function AdBanner({ size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER }: AdBannerProps) {
    const adUnitId = Platform.OS === 'ios'
        ? ADMOB_CONFIG.banner.ios
        : ADMOB_CONFIG.banner.android;

    return (
        <View style={styles.container}>
            <BannerAd
                unitId={adUnitId}
                size={size}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdLoaded={() => {
                    console.log('Banner ad loaded');
                }}
                onAdFailedToLoad={(error) => {
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
