import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../lib/config';
import { AdBanner } from '../components';
import { RootStackParamList } from '../types';

type GamesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Games'>;

export function GamesScreen() {
    const navigation = useNavigation<GamesScreenNavigationProp>();

    const handlePlayMemoryGame = () => {
        navigation.navigate('MemoryGame');
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
                        <Text style={styles.headerSubtitle}>Play games & earn rewards!</Text>
                    </View>
                </View>

                {/* Featured Game - Memory */}
                <TouchableOpacity style={styles.featuredGame} onPress={handlePlayMemoryGame}>
                    <View style={styles.featuredBadge}>
                        <Text style={styles.featuredBadgeText}>⭐ FEATURED</Text>
                    </View>
                    <Text style={styles.featuredEmoji}>🧠</Text>
                    <Text style={styles.featuredTitle}>Memory Challenge</Text>
                    <Text style={styles.featuredDescription}>
                        Match all the BGMI-themed cards before running out of lives!
                    </Text>
                    <View style={styles.featuredMeta}>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaIcon}>⏱️</Text>
                            <Text style={styles.metaText}>2-5 min</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaIcon}>🎯</Text>
                            <Text style={styles.metaText}>Medium</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaIcon}>🏆</Text>
                            <Text style={styles.metaText}>Leaderboard</Text>
                        </View>
                    </View>
                    <View style={styles.playButton}>
                        <Text style={styles.playButtonText}>▶️ Play Now</Text>
                    </View>
                </TouchableOpacity>

                {/* Coming Soon */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Coming Soon</Text>
                    <View style={styles.comingSoonGrid}>
                        <View style={styles.comingSoonCard}>
                            <Text style={styles.comingSoonEmoji}>🎯</Text>
                            <Text style={styles.comingSoonTitle}>Aim Trainer</Text>
                            <Text style={styles.comingSoonStatus}>In Development</Text>
                        </View>
                        <View style={styles.comingSoonCard}>
                            <Text style={styles.comingSoonEmoji}>🧩</Text>
                            <Text style={styles.comingSoonTitle}>Puzzle Rush</Text>
                            <Text style={styles.comingSoonStatus}>In Development</Text>
                        </View>
                    </View>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>💡 How to Earn Rewards</Text>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoBullet}>•</Text>
                        <Text style={styles.infoText}>Watch ads to get extra lives for games</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoBullet}>•</Text>
                        <Text style={styles.infoText}>Compete on the weekly leaderboard</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoBullet}>•</Text>
                        <Text style={styles.infoText}>Top 3 players win UC prizes each week!</Text>
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
        marginBottom: 24,
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
    featuredGame: {
        backgroundColor: COLORS.dark.card,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    featuredBadge: {
        backgroundColor: COLORS.primary + '30',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 16,
    },
    featuredBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.primary,
    },
    featuredEmoji: {
        fontSize: 64,
        marginBottom: 12,
    },
    featuredTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.dark.text,
        marginBottom: 8,
    },
    featuredDescription: {
        fontSize: 15,
        color: COLORS.dark.textMuted,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 22,
    },
    featuredMeta: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 20,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaIcon: {
        fontSize: 14,
    },
    metaText: {
        fontSize: 13,
        color: COLORS.dark.textMuted,
    },
    playButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 14,
    },
    playButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    section: {
        marginTop: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.dark.text,
        marginBottom: 16,
    },
    comingSoonGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    comingSoonCard: {
        flex: 1,
        backgroundColor: COLORS.dark.card,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        opacity: 0.6,
        borderWidth: 1,
        borderColor: COLORS.dark.cardBorder,
    },
    comingSoonEmoji: {
        fontSize: 36,
        marginBottom: 8,
    },
    comingSoonTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.dark.text,
        marginBottom: 4,
    },
    comingSoonStatus: {
        fontSize: 11,
        color: COLORS.dark.textMuted,
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
