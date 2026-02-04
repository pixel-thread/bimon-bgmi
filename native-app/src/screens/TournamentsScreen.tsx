import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { COLORS, API_CONFIG } from '../lib/config';
import { RootStackParamList } from '../types';

type TournamentsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tournaments'>;

export function TournamentsScreen() {
    const navigation = useNavigation<TournamentsScreenNavigationProp>();
    const [loading, setLoading] = useState(true);
    const webViewRef = useRef<WebView>(null);

    // Show tournaments page from website in WebView
    const tournamentsUrl = `${API_CONFIG.websiteUrl}/?embedded=true`;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tournaments</Text>
                <View style={styles.headerRight} />
            </View>

            {/* WebView */}
            <View style={styles.webViewContainer}>
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Loading tournaments...</Text>
                    </View>
                )}

                <WebView
                    ref={webViewRef}
                    source={{ uri: tournamentsUrl }}
                    style={styles.webView}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
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
    },
    headerRight: {
        width: 60,
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
