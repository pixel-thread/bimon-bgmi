import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as ExpoLinking from 'expo-linking';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { COLORS, API_CONFIG } from '../lib/config';
import { useAuthStore } from '../hooks/useAuth';
import { RootStackParamList, User } from '../types';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

// Warm up the browser for faster opening
WebBrowser.warmUpAsync();

export function LoginScreen() {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const { login } = useAuthStore();
    const [loading, setLoading] = useState(false);

    // Handle deep link when app opens from browser
    useEffect(() => {
        const handleDeepLink = async (event: { url: string }) => {
            console.log('Deep link received:', event.url);

            try {
                const url = new URL(event.url);

                if (url.protocol === 'pubgmi-games:' && url.hostname === 'auth') {
                    const success = url.searchParams.get('success');
                    const userDataStr = url.searchParams.get('user');

                    if (success === 'true' && userDataStr) {
                        const userData = JSON.parse(decodeURIComponent(userDataStr)) as User;

                        // Login with the user data
                        await login('session', userData);

                        // Navigate to home
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                        });

                        Alert.alert(
                            '🎉 Welcome!',
                            `Logged in as ${userData.displayName}`,
                            [{ text: 'OK' }]
                        );
                    }
                }
            } catch (error) {
                console.error('Error handling deep link:', error);
            }

            setLoading(false);
        };

        // Listen for deep links
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check if app was opened with a deep link
        Linking.getInitialURL().then((url) => {
            if (url) {
                handleDeepLink({ url });
            }
        });

        return () => {
            subscription.remove();
            WebBrowser.coolDownAsync();
        };
    }, [login, navigation]);

    const handleLogin = async () => {
        setLoading(true);

        try {
            // Go directly to the callback URL
            // If logged in: returns user data and redirects back to app
            // If not logged in: callback redirects to sign-in, then back to callback
            const loginUrl = `${API_CONFIG.websiteUrl}/api/auth/mobile-callback`;

            // Open in the real browser (not WebView!)
            // This is trusted by Google and allows OAuth
            const result = await WebBrowser.openAuthSessionAsync(
                loginUrl,
                'pubgmi-games://auth' // The URL scheme to redirect back to
            );

            console.log('Browser result:', result);

            if (result.type === 'cancel' || result.type === 'dismiss') {
                setLoading(false);
            }
            // If successful, the deep link handler above will process the result

        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Login Failed', 'Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.content}>
                {/* Logo/Header */}
                <View style={styles.header}>
                    <Text style={styles.emoji}>🎮</Text>
                    <Text style={styles.title}>PUBGMI Games</Text>
                    <Text style={styles.subtitle}>
                        Login with your PUBGMI account to sync your progress, UC balance, and more!
                    </Text>
                </View>

                {/* Benefits */}
                <View style={styles.benefits}>
                    <View style={styles.benefitItem}>
                        <Text style={styles.benefitIcon}>💰</Text>
                        <Text style={styles.benefitText}>Sync UC Balance</Text>
                    </View>
                    <View style={styles.benefitItem}>
                        <Text style={styles.benefitIcon}>📊</Text>
                        <Text style={styles.benefitText}>Track Your Stats</Text>
                    </View>
                    <View style={styles.benefitItem}>
                        <Text style={styles.benefitIcon}>🏆</Text>
                        <Text style={styles.benefitText}>Join Tournaments</Text>
                    </View>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                    style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Text style={styles.googleIcon}>G</Text>
                            <Text style={styles.loginButtonText}>Continue with Google</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.helperText}>
                    Opens your browser for secure login
                </Text>

                {/* Skip Button */}
                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.skipText}>Skip for now</Text>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    🔒 Secure login via Google
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.dark.background,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.dark.text,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.dark.textMuted,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    benefits: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 40,
        paddingHorizontal: 10,
    },
    benefitItem: {
        alignItems: 'center',
        gap: 8,
    },
    benefitIcon: {
        fontSize: 28,
    },
    benefitText: {
        fontSize: 12,
        color: COLORS.dark.textMuted,
        fontWeight: '500',
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4285F4', // Google blue
        paddingVertical: 16,
        borderRadius: 12,
        gap: 12,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    googleIcon: {
        fontSize: 20,
        fontWeight: '700',
        color: '#4285F4',
        backgroundColor: '#fff',
        width: 28,
        height: 28,
        textAlign: 'center',
        lineHeight: 28,
        borderRadius: 4,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    helperText: {
        textAlign: 'center',
        color: COLORS.dark.textMuted,
        fontSize: 13,
        marginTop: 12,
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 20,
    },
    skipText: {
        color: COLORS.dark.textMuted,
        fontSize: 15,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    footerText: {
        color: COLORS.dark.textMuted,
        fontSize: 13,
    },
});
