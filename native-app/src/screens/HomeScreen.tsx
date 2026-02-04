import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    RefreshControl,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { COLORS, API_CONFIG } from '../lib/config';
import { useAuthStore } from '../hooks/useAuth';
import { AdBanner } from '../components';
import { RootStackParamList } from '../types';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const WEBSITE_URL = 'https://pubgmi.games';

export function HomeScreen() {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { user, isAuthenticated } = useAuthStore();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const openWebsite = () => {
        Linking.openURL(WEBSITE_URL);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Welcome to</Text>
                        <Text style={styles.appName}>PUBGMI Games</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        {user?.imageUrl ? (
                            <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Featured Game - Memory Game */}
                <Text style={styles.sectionTitle}>🎮 Featured Game</Text>
                <TouchableOpacity
                    style={styles.featuredCard}
                    onPress={() => navigation.navigate('MemoryGame')}
                >
                    <View style={styles.featuredContent}>
                        <Text style={styles.featuredEmoji}>🧠</Text>
                        <View style={styles.featuredInfo}>
                            <Text style={styles.featuredTitle}>Memory Challenge</Text>
                            <Text style={styles.featuredDesc}>Match all pairs to win! Test your memory.</Text>
                        </View>
                    </View>
                    <View style={styles.playBadge}>
                        <Text style={styles.playBadgeText}>▶️ Play</Text>
                    </View>
                </TouchableOpacity>

                {/* Coming Soon Games */}
                <Text style={styles.sectionTitle}>🔜 Coming Soon</Text>
                <View style={styles.comingSoonGrid}>
                    <View style={styles.comingSoonCard}>
                        <Text style={styles.comingSoonEmoji}>🎯</Text>
                        <Text style={styles.comingSoonTitle}>Quiz Battle</Text>
                        <Text style={styles.comingSoonTag}>Soon</Text>
                    </View>
                    <View style={styles.comingSoonCard}>
                        <Text style={styles.comingSoonEmoji}>🎰</Text>
                        <Text style={styles.comingSoonTitle}>Spin & Win</Text>
                        <Text style={styles.comingSoonTag}>Soon</Text>
                    </View>
                    <View style={styles.comingSoonCard}>
                        <Text style={styles.comingSoonEmoji}>🃏</Text>
                        <Text style={styles.comingSoonTitle}>Card Match</Text>
                        <Text style={styles.comingSoonTag}>Soon</Text>
                    </View>
                    <View style={styles.comingSoonCard}>
                        <Text style={styles.comingSoonEmoji}>🎲</Text>
                        <Text style={styles.comingSoonTitle}>Lucky Dice</Text>
                        <Text style={styles.comingSoonTag}>Soon</Text>
                    </View>
                </View>

                {/* Website Link */}
                <TouchableOpacity style={styles.websiteCard} onPress={openWebsite}>
                    <View style={styles.websiteContent}>
                        <View style={styles.websiteIcon}>
                            <Text style={styles.websiteEmoji}>🌐</Text>
                        </View>
                        <View>
                            <Text style={styles.websiteTitle}>Visit Website</Text>
                            <Text style={styles.websiteSubtitle}>Tournaments, voting, leaderboard & more!</Text>
                        </View>
                    </View>
                    <Text style={styles.websiteArrow}>→</Text>
                </TouchableOpacity>

                {/* Login CTA for guests */}
                {!isAuthenticated && (
                    <TouchableOpacity
                        style={styles.loginCta}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <View style={styles.loginContent}>
                            <Text style={styles.loginTitle}>🔗 Login to Sync</Text>
                            <Text style={styles.loginSubtitle}>
                                Connect your PUBGMI account to save progress
                            </Text>
                        </View>
                        <Text style={styles.loginArrow}>→</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Banner Ad */}
            <AdBanner />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0f',
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    greeting: {
        fontSize: 14,
        color: '#666',
    },
    appName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        marginTop: 2,
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
        marginTop: 8,
    },

    // Featured Game Card
    featuredCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    featuredContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    featuredEmoji: {
        fontSize: 48,
        marginRight: 16,
    },
    featuredInfo: {
        flex: 1,
    },
    featuredTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    featuredDesc: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 18,
    },
    playBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    playBadgeText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },

    // Coming Soon Grid
    comingSoonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    comingSoonCard: {
        width: '48%',
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2a2a4e',
        opacity: 0.6,
    },
    comingSoonEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    comingSoonTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 6,
    },
    comingSoonTag: {
        fontSize: 10,
        fontWeight: '700',
        color: '#888',
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        overflow: 'hidden',
    },

    // Website Card
    websiteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2a2a4e',
        marginBottom: 16,
    },
    websiteContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    websiteIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#0066ff20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    websiteEmoji: {
        fontSize: 22,
    },
    websiteTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    websiteSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    websiteArrow: {
        fontSize: 20,
        color: '#666',
    },

    // Login CTA
    loginCta: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.primary + '40',
    },
    loginContent: {
        flex: 1,
    },
    loginTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 4,
    },
    loginSubtitle: {
        fontSize: 12,
        color: '#666',
    },
    loginArrow: {
        fontSize: 20,
        color: COLORS.primary,
    },
});
