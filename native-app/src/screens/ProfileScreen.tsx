import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
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

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

export function ProfileScreen() {
    const navigation = useNavigation<ProfileScreenNavigationProp>();
    const { user, isAuthenticated, logout } = useAuthStore();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                        });
                    },
                },
            ]
        );
    };

    const openWebsite = () => {
        Linking.openURL(API_CONFIG.websiteUrl);
    };

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />

                <View style={styles.guestContainer}>
                    <Text style={styles.guestEmoji}>👤</Text>
                    <Text style={styles.guestTitle}>Not Logged In</Text>
                    <Text style={styles.guestSubtitle}>
                        Login to view your profile, sync UC, and track your stats
                    </Text>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.loginButtonText}>Login to PUBGMI</Text>
                    </TouchableOpacity>
                </View>

                <AdBanner />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {user?.imageUrl ? (
                            <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                            </View>
                        )}
                        {user?.royalPass && (
                            <View style={styles.royalPassBadge}>
                                <Text style={styles.royalPassText}>👑</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.displayName}>{user?.displayName}</Text>
                    {user?.bgmiId && (
                        <Text style={styles.bgmiId}>BGMI ID: {user.bgmiId}</Text>
                    )}

                    {user?.royalPass && (
                        <View style={styles.rpBadge}>
                            <Text style={styles.rpBadgeText}>✨ Royal Pass Active</Text>
                        </View>
                    )}
                </View>

                {/* UC Balance */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceRow}>
                        <View>
                            <Text style={styles.balanceLabel}>UC Balance</Text>
                            <Text style={styles.balanceAmount}>{user?.ucBalance || 0}</Text>
                        </View>
                        <TouchableOpacity style={styles.earnButton} onPress={() => navigation.navigate('Games')}>
                            <Text style={styles.earnButtonText}>Earn More</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Info</Text>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Role</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleText}>{user?.role}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Member Since</Text>
                            <Text style={styles.infoValue}>
                                {user?.createdAt
                                    ? new Date(user.createdAt).toLocaleDateString()
                                    : 'Unknown'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Actions</Text>

                    <TouchableOpacity style={styles.actionRow} onPress={openWebsite}>
                        <Text style={styles.actionIcon}>🌐</Text>
                        <Text style={styles.actionText}>Open Full Website</Text>
                        <Text style={styles.actionArrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
                        <Text style={styles.actionIcon}>🚪</Text>
                        <Text style={[styles.actionText, { color: COLORS.error }]}>Logout</Text>
                        <Text style={styles.actionArrow}>→</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

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
    guestContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    guestEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    guestTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.dark.text,
        marginBottom: 8,
    },
    guestSubtitle: {
        fontSize: 14,
        color: COLORS.dark.textMuted,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 40,
        fontWeight: '700',
    },
    royalPassBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    royalPassText: {
        fontSize: 16,
    },
    displayName: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.dark.text,
        marginBottom: 4,
    },
    bgmiId: {
        fontSize: 14,
        color: COLORS.dark.textMuted,
        marginBottom: 12,
    },
    rpBadge: {
        backgroundColor: COLORS.accent + '20',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    rpBadgeText: {
        color: COLORS.accent,
        fontWeight: '600',
        fontSize: 13,
    },
    balanceCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    balanceLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
    },
    earnButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    earnButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.dark.textMuted,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoCard: {
        backgroundColor: COLORS.dark.card,
        borderRadius: 16,
        padding: 4,
        borderWidth: 1,
        borderColor: COLORS.dark.cardBorder,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    infoLabel: {
        fontSize: 14,
        color: COLORS.dark.textMuted,
    },
    infoValue: {
        fontSize: 14,
        color: COLORS.dark.text,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.dark.cardBorder,
        marginHorizontal: 16,
    },
    roleBadge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    roleText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.dark.cardBorder,
    },
    actionIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    actionText: {
        flex: 1,
        fontSize: 15,
        color: COLORS.dark.text,
        fontWeight: '500',
    },
    actionArrow: {
        fontSize: 18,
        color: COLORS.dark.textMuted,
    },
});
