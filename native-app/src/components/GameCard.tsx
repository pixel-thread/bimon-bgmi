import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Dimensions,
} from 'react-native';
import { Game } from '../types';
import { COLORS } from '../lib/config';

interface GameCardProps {
    game: Game;
    onPress: () => void;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with padding

export function GameCard({ game, onPress }: GameCardProps) {
    const getDifficultyColor = () => {
        switch (game.difficulty) {
            case 'Easy':
                return COLORS.success;
            case 'Medium':
                return COLORS.warning;
            case 'Hard':
                return COLORS.error;
            default:
                return COLORS.dark.textMuted;
        }
    };

    return (
        <TouchableOpacity
            style={[styles.card, !game.available && styles.cardDisabled]}
            onPress={onPress}
            disabled={!game.available}
            activeOpacity={0.8}
        >
            {/* Game Icon/Preview */}
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>{game.icon}</Text>
                {!game.available && (
                    <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>Coming Soon</Text>
                    </View>
                )}
            </View>

            {/* Game Info */}
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                    {game.name}
                </Text>
                <Text style={styles.description} numberOfLines={2}>
                    {game.description}
                </Text>

                {/* Badges */}
                <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: getDifficultyColor() + '20' }]}>
                        <Text style={[styles.badgeText, { color: getDifficultyColor() }]}>
                            {game.difficulty}
                        </Text>
                    </View>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>⏱️ {game.playTime}</Text>
                    </View>
                </View>
            </View>

            {/* Play Button */}
            {game.available && (
                <View style={styles.playButton}>
                    <Text style={styles.playText}>▶ Play</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: cardWidth,
        backgroundColor: COLORS.dark.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.dark.cardBorder,
        overflow: 'hidden',
        marginBottom: 16,
    },
    cardDisabled: {
        opacity: 0.6,
    },
    iconContainer: {
        height: 80,
        backgroundColor: COLORS.dark.background,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    icon: {
        fontSize: 40,
    },
    comingSoonBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: COLORS.dark.cardBorder,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    comingSoonText: {
        fontSize: 10,
        color: COLORS.dark.textMuted,
        fontWeight: '600',
    },
    info: {
        padding: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.dark.text,
        marginBottom: 4,
    },
    description: {
        fontSize: 12,
        color: COLORS.dark.textMuted,
        marginBottom: 12,
        lineHeight: 16,
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: COLORS.dark.cardBorder,
    },
    badgeText: {
        fontSize: 11,
        color: COLORS.dark.textMuted,
        fontWeight: '600',
    },
    playButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        alignItems: 'center',
    },
    playText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});
