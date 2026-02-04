import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { COLORS } from '../lib/config';

interface RewardedAdButtonProps {
    onPress: () => void;
    loading: boolean;
    available: boolean;
    ucReward?: number;
}

export function RewardedAdButton({
    onPress,
    loading,
    available,
    ucReward = 5,
}: RewardedAdButtonProps) {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                !available && styles.buttonDisabled,
            ]}
            onPress={onPress}
            disabled={!available || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color="#fff" size="small" />
            ) : (
                <>
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>🎬</Text>
                    </View>
                    <View style={styles.content}>
                        <Text style={styles.title}>Watch Ad for Bonus</Text>
                        <Text style={styles.subtitle}>
                            {available ? `Earn ${ucReward} UC` : 'Loading ad...'}
                        </Text>
                    </View>
                    <View style={styles.rewardBadge}>
                        <Text style={styles.rewardText}>+{ucReward}</Text>
                        <Text style={styles.ucText}>UC</Text>
                    </View>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
        gap: 12,
    },
    buttonDisabled: {
        backgroundColor: COLORS.dark.cardBorder,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 24,
    },
    content: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        marginTop: 2,
    },
    rewardBadge: {
        backgroundColor: COLORS.accent,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
    },
    rewardText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 18,
    },
    ucText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        fontWeight: '600',
    },
});
