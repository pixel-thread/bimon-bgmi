import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    RefreshControl,
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

export function HomeScreen() {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { user, isAuthenticated } = useAuthStore();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        // TODO: Refresh user data from API
        setTimeout(() => setRefreshing(false), 1000);
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
                        <Text style={styles.greeting}>Welcome back,</Text>
                        <Text style={styles.username}>
                            {isAuthenticated ? user?.displayName : 'Guest'}
                        </Text>
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

                {/* UC Balance Card */}
                {isAuthenticated && (
                    <View style={styles.balanceCard}>
                        <View style={styles.balanceHeader}>
                            <Text style={styles.balanceLabel}>UC Balance</Text>
                            <View style={styles.ucBadge}>
                                <Text style={styles.ucIcon}>💰</Text>
                            </View>
                        </View>
                        <Text style={styles.balanceAmount}>{user?.ucBalance || 0}</Text>
                        <Text style={styles.balanceSubtext}>Play games & watch ads to earn more!</Text>
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionGrid}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('Games')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                                <Text style={styles.actionEmoji}>🎮</Text>
                            </View>
                            <Text style={styles.actionTitle}>Play Games</Text>
                            <Text style={styles.actionSubtitle}>Earn UC rewards</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('Tournaments')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.accent + '20' }]}>
                                <Text style={styles.actionEmoji}>🏆</Text>
                            </View>
                            <Text style={styles.actionTitle}>Tournaments</Text>
                            <Text style={styles.actionSubtitle}>Compete & win</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '20' }]}>
                                <Text style={styles.actionEmoji}>📊</Text>
                            </View>
                            <Text style={styles.actionTitle}>My Stats</Text>
                            <Text style={styles.actionSubtitle}>View progress</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => {/* Open website */ }}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.secondary + '20' }]}>
                                <Text style={styles.actionEmoji}>🌐</Text>
                            </View>
                            <Text style={styles.actionTitle}>Website</Text>
                            <Text style={styles.actionSubtitle}>Full features</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Login CTA for guests */}
                {!isAuthenticated && (
                    <TouchableOpacity
                        style={styles.loginCta}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <View style={styles.loginContent}>
                            <Text style={styles.loginTitle}>Login to Sync Progress</Text>
                            <Text style={styles.loginSubtitle}>
                                Connect with your PUBGMI account to sync UC, stats, and more!
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 14,
        color: COLORS.dark.textMuted,
    },
    username: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.dark.text,
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
    balanceCard: {
        // Note: RN doesn't support linear-gradient directly, using solid color
        // For gradient, use react-native-linear-gradient
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    balanceLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
    },
    ucBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ucIcon: {
        fontSize: 18,
    },
    balanceAmount: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    balanceSubtext: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.dark.text,
        marginBottom: 16,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: '48%',
        backgroundColor: COLORS.dark.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.dark.cardBorder,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionEmoji: {
        fontSize: 24,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.dark.text,
        marginBottom: 2,
    },
    actionSubtitle: {
        fontSize: 12,
        color: COLORS.dark.textMuted,
    },
    loginCta: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.dark.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    loginContent: {
        flex: 1,
    },
    loginTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 4,
    },
    loginSubtitle: {
        fontSize: 13,
        color: COLORS.dark.textMuted,
        lineHeight: 18,
    },
    loginArrow: {
        fontSize: 24,
        color: COLORS.primary,
        marginLeft: 12,
    },
});
