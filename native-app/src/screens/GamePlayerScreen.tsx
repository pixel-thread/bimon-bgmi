import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, API_CONFIG } from '../lib/config';
import { useInterstitialAd } from '../hooks/useAds';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'GamePlayer'>;

export function GamePlayerScreen({ route, navigation }: Props) {
    const { gameId, gameUrl } = route.params;
    const [loading, setLoading] = useState(true);
    const [gameCompleted, setGameCompleted] = useState(false);
    const webViewRef = useRef<WebView>(null);
    const { loaded: interstitialLoaded, showAd: showInterstitial } = useInterstitialAd();

    const fullGameUrl = `${API_CONFIG.websiteUrl}${gameUrl}?embedded=true`;

    // Show interstitial ad when leaving the game
    const handleExitGame = async () => {
        if (interstitialLoaded) {
            await showInterstitial();
        }
        navigation.goBack();
    };

    // Handle messages from the WebView (game completion, etc.)
    const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);

            if (message.type === 'GAME_COMPLETED') {
                setGameCompleted(true);
                // Could send score to API here
                console.log('Game completed with score:', message.score);
            }

            if (message.type === 'EXIT_GAME') {
                handleExitGame();
            }
        } catch (error) {
            console.log('WebView message error:', error);
        }
    };

    // Inject JS to communicate with the app
    const injectedJS = `
    (function() {
      // Override window.close to communicate with app
      window.close = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'EXIT_GAME' }));
      };
      
      // Listen for game completion events
      window.addEventListener('gameCompleted', function(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'GAME_COMPLETED',
          score: e.detail?.score || 0
        }));
      });
      
      // Add a class to indicate embedded mode
      document.body.classList.add('embedded-in-app');
      
      true;
    })();
  `;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleExitGame}>
                    <Text style={styles.backText}>← Exit</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{gameId.charAt(0).toUpperCase() + gameId.slice(1)}</Text>
                <View style={styles.headerRight}>
                    {gameCompleted && (
                        <View style={styles.completedBadge}>
                            <Text style={styles.completedText}>✓ Done</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* WebView with Game */}
            <View style={styles.webViewContainer}>
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Loading game...</Text>
                    </View>
                )}

                <WebView
                    ref={webViewRef}
                    source={{ uri: fullGameUrl }}
                    style={styles.webView}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    onMessage={handleWebViewMessage}
                    injectedJavaScript={injectedJS}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsFullscreenVideo={true}
                    mediaPlaybackRequiresUserAction={false}
                    startInLoadingState={true}
                    onError={(error) => {
                        console.log('WebView error:', error);
                        Alert.alert('Error', 'Failed to load game. Please try again.');
                    }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.dark.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.dark.cardBorder,
    },
    backButton: {
        paddingVertical: 8,
        paddingRight: 16,
    },
    backText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.dark.text,
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        width: 60,
        alignItems: 'flex-end',
    },
    completedBadge: {
        backgroundColor: COLORS.success + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    completedText: {
        color: COLORS.success,
        fontSize: 12,
        fontWeight: '600',
    },
    webViewContainer: {
        flex: 1,
        position: 'relative',
    },
    webView: {
        flex: 1,
        backgroundColor: COLORS.dark.background,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.dark.background,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    loadingText: {
        color: COLORS.dark.textMuted,
        marginTop: 12,
        fontSize: 14,
    },
});
