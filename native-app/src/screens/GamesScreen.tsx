import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { COLORS, GAMES, API_CONFIG } from '../lib/config';
import { useRewardedAd } from '../hooks/useAds';
import { useAuthStore } from '../hooks/useAuth';
import { GameCard, AdBanner, RewardedAdButton } from '../components';
import { RootStackParamList } from '../types';

type GamesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Games'>;

export function GamesScreen() {
    const navigation = useNavigation<GamesScreenNavigationProp>();
    const { user, setUser } = useAuthStore();
    const { loaded: rewardedAdLoaded, showAd: showRewardedAd, reward } = useRewardedAd();
    const [watchingAd, setWatchingAd] = useState(false);

    const handlePlayGame = (gameId: string, gameUrl: string) => {
        navigation.navigate('GamePlayer', { gameId, gameUrl });
    };

    const handleWatchRewardedAd = async () => {
        if (!rewardedAdLoaded) {
            Alert.alert('Ad Not Ready', 'Please wait a moment and try again.');
            return;
        }

        setWatchingAd(true);
        try {
            const shown = await showRewardedAd();
            if (shown) {
                // Ad was shown, reward will be handled by the hook
                // The reward state will be updated when ad completes
                setTimeout(() => {
                    if (user) {
                        // Update local UC balance
                        const newBalance = (user.ucBalance || 0) + 5;
                        setUser({ ...user, ucBalance: newBalance });

                        Alert.alert(
                            '🎉 Reward Earned!',
                            `You earned 5 UC!\nNew balance: ${newBalance} UC`,
                            [{ text: 'Awesome!' }]
                        );
                    }
                }, 500);
            }
        } catch (error) {
            console.log('Error showing rewarded ad:', error);
            Alert.alert('Error', 'Failed to show ad. Please try again.');
        } finally {
            setWatchingAd(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerEmoji}>🎮</Text>
                    <View>
                        <Text style={styles.headerTitle}>Game Arcade</Text>
                        <Text style={styles.headerSubtitle}>Play games & earn UC rewards!</Text>
                    </View>
                </View>

                {/* Rewarded Ad CTA */}
                <RewardedAdButton
                    onPress={handleWatchRewardedAd}
                    loading={watchingAd}
                    available={rewardedAdLoaded}
                    ucReward={5}
                />

                {/* Games Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Available Games</Text>
                    <View style={styles.gamesGrid}>
                        {GAMES.map((game) => (
                            <GameCard
                                key={game.id}
                                game={game}
                                onPress={() => handlePlayGame(game.id, game.gameUrl)}
                            />
                        ))}
                    </View>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>💡 How to Earn UC</Text>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoBullet}>•</Text>
                        <Text style={styles.infoText}>Complete games to earn bonus UC</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoBullet}>•</Text>
                        <Text style={styles.infoText}>Watch rewarded ads for +5 UC each</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoBullet}>•</Text>
                        <Text style={styles.infoText}>UC syncs with your website account</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Banner Ad */}
            <AdBanner />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.dark.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    headerEmoji: {
        fontSize: 40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.dark.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.dark.textMuted,
        marginTop: 2,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.dark.text,
        marginBottom: 16,
    },
    gamesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    infoCard: {
        backgroundColor: COLORS.dark.card,
        borderRadius: 16,
        padding: 20,
        marginTop: 24,
        borderWidth: 1,
        borderColor: COLORS.dark.cardBorder,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.dark.text,
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    infoBullet: {
        color: COLORS.primary,
        fontSize: 16,
        marginRight: 8,
        lineHeight: 20,
    },
    infoText: {
        flex: 1,
        color: COLORS.dark.textMuted,
        fontSize: 14,
        lineHeight: 20,
    },
});
