import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Vibration,
    Modal,
    ScrollView,
    Image,
    ActivityIndicator,
    InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { COLORS, API_CONFIG } from '../lib/config';
import { useRewardedAd } from '../hooks/useAds';
import { useAuthStore } from '../hooks/useAuth';
import { useGameSounds } from '../hooks/useGameSounds';
import { RootStackParamList } from '../types';

type MemoryGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MemoryGame'>;

const { width } = Dimensions.get('window');
const GRID_PADDING = 12;
const CARD_GAP = 6;
const COLUMNS = 4;
const CARD_SIZE = (width - GRID_PADDING * 2 - CARD_GAP * (COLUMNS - 1)) / COLUMNS;

const isExpoGo = Constants.appOwnership === 'expo';

const CARD_ICONS = ["🎯", "🔫", "💣", "🪖", "🎮", "🏆", "⚡", "🛡️", "🚁", "🚙", "🎒", "💊"];

const GAME_CONFIG = {
    MATCH_DELAY: 400,
    MISMATCH_DELAY: 800,
    INITIAL_LIVES: 3,
    MAX_LIVES: 3,
};

interface CardType {
    id: number;
    icon: string;
    isFlipped: boolean;
    isMatched: boolean;
}

interface LeaderboardEntry {
    rank: number;
    id: string;
    name: string;
    imageUrl?: string;
    score: number;
}

type GameState = 'idle' | 'playing' | 'won' | 'lost';
type ModalType = 'none' | 'giveUp' | 'noLives' | 'leaderboard' | 'adReward';

// Custom Modal component - defined outside to prevent recreation on each render
const CustomModal = ({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) => (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <View style={modalStyles.overlay}>
            <View style={modalStyles.content}>
                {children}
            </View>
        </View>
    </Modal>
);

// Modal styles defined outside component
const modalStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
    content: { backgroundColor: '#1a1a2e', borderRadius: 20, padding: 24, width: '90%', maxHeight: '80%', alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4e' },
});

export function MemoryGameScreen() {
    const navigation = useNavigation<MemoryGameNavigationProp>();
    const { loaded: adLoaded, showAd, error: adError, isLoading: adLoading } = useRewardedAd();
    const { user, isAuthenticated } = useAuthStore();
    const { playFlip, playMatch, playMismatch, playWin, playButton, setEnabled: setSoundEnabled } = useGameSounds();

    const [cards, setCards] = useState<CardType[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [gameState, setGameState] = useState<GameState>('idle');
    const [isProcessing, setIsProcessing] = useState(false);
    const [modalType, setModalType] = useState<ModalType>('none');
    const [soundEnabled, setSoundEnabledState] = useState(true);

    const [lives, setLives] = useState(GAME_CONFIG.INITIAL_LIVES);
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const [matchedPairs, setMatchedPairs] = useState(0);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [globalTopScore, setGlobalTopScore] = useState(0);
    const [playerRank, setPlayerRank] = useState(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

    const flipAnims = useRef<Animated.Value[]>([]);
    const lastMatch = useRef(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const initializeCards = useCallback(() => {
        const shuffled = [...CARD_ICONS, ...CARD_ICONS]
            .sort(() => Math.random() - 0.5)
            .map((icon, index) => ({ id: index, icon, isFlipped: false, isMatched: false }));
        flipAnims.current = shuffled.map(() => new Animated.Value(0));
        setCards(shuffled);
        setFlippedCards([]);
        setMoves(0);
        setTime(0);
        setMatchedPairs(0);
        setScore(0);
        setCombo(0);
        lastMatch.current = false;
    }, []);

    // Fetch global top score and player data
    const fetchGameData = useCallback(async () => {
        try {
            // Get global top score from admin/games (same as web)
            const leaderboardRes = await fetch(`${API_CONFIG.baseUrl}/admin/games`);
            const leaderboardData = await leaderboardRes.json();
            if (leaderboardData.leaderboard && leaderboardData.leaderboard.length > 0) {
                setGlobalTopScore(leaderboardData.leaderboard[0].highScore);
            }

            // Get player's personal score if logged in
            if (user?.id) {
                const playerRes = await fetch(`${API_CONFIG.baseUrl}/games/memory?playerId=${user.id}`);
                const playerData = await playerRes.json();
                if (playerData.highScore) setHighScore(playerData.highScore);
                if (playerData.rank) setPlayerRank(playerData.rank);
            }
        } catch (e) {
            console.log('Failed to fetch game data:', e);
        }
    }, [user?.id]);

    // Fetch leaderboard (same endpoint as web: /api/admin/games)
    const fetchLeaderboard = async () => {
        // Only show loading if we don't have cached data
        const hasData = leaderboard.length > 0;
        if (!hasData) setLoadingLeaderboard(true);

        try {
            const res = await fetch(`${API_CONFIG.baseUrl}/admin/games`);
            const data = await res.json();
            if (data.leaderboard && data.leaderboard.length > 0) {
                // Map to our format (web returns: rank, playerId, playerName, playerImage, highScore)
                const mapped = data.leaderboard.map((entry: { rank: number; playerId: string; playerName: string; playerImage?: string; highScore: number }) => ({
                    rank: entry.rank,
                    id: entry.playerId,
                    name: entry.playerName,
                    imageUrl: entry.playerImage,
                    score: entry.highScore,
                }));
                setLeaderboard(mapped);
                setGlobalTopScore(data.leaderboard[0].highScore);
            }
        } catch (e) {
            console.log('Failed to fetch leaderboard:', e);
        }
        if (!hasData) setLoadingLeaderboard(false);
    };

    // Submit score to API
    const submitScore = async (finalScore: number) => {
        if (!user?.id) return;
        try {
            const res = await fetch(`${API_CONFIG.baseUrl}/games/memory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: user.id, score: finalScore })
            });
            const data = await res.json();
            if (data.highScore) setHighScore(data.highScore);
            if (data.rank) setPlayerRank(data.rank);
        } catch (e) {
            console.log('Failed to submit score:', e);
        }
    };

    useEffect(() => {
        const loadSavedData = async () => {
            try {
                const savedLives = await SecureStore.getItemAsync('memory_lives');
                if (savedLives) setLives(Math.min(parseInt(savedLives, 10), GAME_CONFIG.MAX_LIVES));

                // Also load local high score as fallback
                const savedHighScore = await SecureStore.getItemAsync('memory_high_score');
                if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));
            } catch { }
        };
        loadSavedData();
        initializeCards();
        fetchGameData();
        // Pre-fetch leaderboard in background so it's ready when user opens it
        fetchLeaderboard();
    }, [initializeCards, fetchGameData]);

    useEffect(() => {
        SecureStore.setItemAsync('memory_lives', lives.toString());
    }, [lives]);

    useEffect(() => {
        if (gameState === 'playing') {
            timerRef.current = setInterval(() => setTime(prev => prev + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameState]);

    useEffect(() => {
        if (matchedPairs === CARD_ICONS.length && gameState === 'playing') {
            setGameState('won');
            if (soundEnabled) {
                playWin();
                Vibration.vibrate([0, 100, 50, 100]);
            }
            // Score calculation (same as web)
            // BASE_SCORE = 1000, TIME_BONUS_MAX = 1000, MOVE_BONUS_MAX = 500
            // TIME_PENALTY = 10 per second, MOVE_PENALTY = 20 per move
            const timeBonus = Math.max(0, 1000 - time * 10);
            const moveBonus = Math.max(0, 500 - moves * 20);
            const finalScore = 1000 + timeBonus + moveBonus;
            setScore(finalScore);

            // Save locally
            if (finalScore > highScore) {
                setHighScore(finalScore);
                SecureStore.setItemAsync('memory_high_score', finalScore.toString());
            }

            // Submit to server
            submitScore(finalScore);
        }
    }, [matchedPairs, gameState, time, moves, highScore, soundEnabled]);

    const flipCard = (cardIndex: number, toFlipped: boolean) => {
        if (flipAnims.current[cardIndex]) {
            Animated.spring(flipAnims.current[cardIndex], {
                toValue: toFlipped ? 1 : 0,
                friction: 8,
                tension: 100,
                useNativeDriver: true,
            }).start();
        }
    };

    const handleCardPress = useCallback((cardId: number) => {
        if (isProcessing || gameState !== 'playing') return;
        if (flippedCards.includes(cardId) || cards[cardId]?.isMatched) return;
        if (flippedCards.length >= 2) return;

        flipCard(cardId, true);
        if (soundEnabled) playFlip();
        setCards(prev => prev.map(c => c.id === cardId ? { ...c, isFlipped: true } : c));
        setFlippedCards(prev => [...prev, cardId]);
    }, [isProcessing, gameState, flippedCards, cards]);

    useEffect(() => {
        if (flippedCards.length === 2) {
            setIsProcessing(true);
            setMoves(prev => prev + 1);

            const [first, second] = flippedCards;
            const card1 = cards[first];
            const card2 = cards[second];

            if (card1.icon === card2.icon) {
                if (lastMatch.current) setCombo(prev => prev + 1);
                else setCombo(1);
                lastMatch.current = true;
                if (soundEnabled) {
                    playMatch();
                    Vibration.vibrate(50);
                }

                setTimeout(() => {
                    setCards(prev => prev.map(c =>
                        c.id === first || c.id === second ? { ...c, isMatched: true } : c
                    ));
                    setMatchedPairs(prev => prev + 1);
                    setFlippedCards([]);
                    setIsProcessing(false);
                }, GAME_CONFIG.MATCH_DELAY);
            } else {
                lastMatch.current = false;
                setCombo(0);
                if (soundEnabled) playMismatch();

                setTimeout(() => {
                    flipCard(first, false);
                    flipCard(second, false);
                    setCards(prev => prev.map(c =>
                        c.id === first || c.id === second ? { ...c, isFlipped: false } : c
                    ));
                    setFlippedCards([]);
                    setIsProcessing(false);
                }, GAME_CONFIG.MISMATCH_DELAY);
            }
        }
    }, [flippedCards, cards, soundEnabled]);

    const startGame = () => {
        if (lives <= 0) {
            setModalType('noLives');
            return;
        }
        setLives(prev => prev - 1);
        initializeCards();
        setGameState('playing');
        setModalType('none');
    };

    const [adErrorShown, setAdErrorShown] = useState(false);

    const handleWatchAd = async () => {
        if (lives >= GAME_CONFIG.MAX_LIVES) return;

        if (isExpoGo) {
            setLives(prev => Math.min(prev + 1, GAME_CONFIG.MAX_LIVES));
            setModalType('adReward');
            return;
        }

        // Show error if ads aren't available
        if (adError && !adLoaded) {
            setAdErrorShown(true);
            return;
        }

        if (!adLoaded) {
            // Still loading
            return;
        }

        try {
            const shown = await showAd();
            if (shown) {
                setLives(prev => Math.min(prev + 1, GAME_CONFIG.MAX_LIVES));
                setModalType('adReward');
            }
        } catch (e) {
            console.log('Failed to show ad:', e);
            setAdErrorShown(true);
        }
    };

    // Render ad button with proper state
    const renderAdButton = () => {
        if (lives >= GAME_CONFIG.MAX_LIVES) return null;

        const isDisabled = !isExpoGo && !adLoaded && !adError;
        const buttonText = adLoading && !adError
            ? '⏳ Loading Ad...'
            : adError && !adLoaded
                ? '😔 Ads Unavailable'
                : '📺 Watch Ad = +1 ❤️';

        return (
            <TouchableOpacity
                style={[styles.adBtn, isDisabled && styles.adBtnDisabled, adError && !adLoaded && styles.adBtnError]}
                onPress={handleWatchAd}
                disabled={isDisabled}
            >
                <Text style={styles.adBtnText}>{buttonText}</Text>
            </TouchableOpacity>
        );
    };

    const openLeaderboard = () => {
        setModalType('leaderboard');
        // Wait for modal animation to complete before fetching
        InteractionManager.runAfterInteractions(() => {
            fetchLeaderboard();
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Progress towards #1 score (your high score / top leaderboard score)
    const scoreProgress = globalTopScore > 0 ? Math.min(highScore / globalTopScore, 1) : 0;

    const renderCard = (card: CardType, index: number) => {
        const flipAnim = flipAnims.current[index] || new Animated.Value(0);

        return (
            <TouchableOpacity
                key={card.id}
                onPress={() => handleCardPress(card.id)}
                disabled={card.isMatched || card.isFlipped || isProcessing || gameState !== 'playing'}
                activeOpacity={0.8}
                style={styles.cardWrapper}
            >
                <View style={[styles.cardContainer, card.isMatched && styles.cardMatched]}>
                    <Animated.View style={[styles.card, styles.cardBack, {
                        transform: [{ rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }]
                    }]}>
                        <Text style={styles.cardBackIcon}>?</Text>
                    </Animated.View>
                    <Animated.View style={[styles.card, styles.cardFront, {
                        transform: [{ rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }) }]
                    }]}>
                        <Text style={styles.cardIcon}>{card.icon}</Text>
                    </Animated.View>
                </View>
            </TouchableOpacity>
        );
    };

    // Top Stats Bar (like web: star=your score, progress=vs #1, crown=#1 score)
    const renderTopBar = () => (
        <View style={styles.topBar}>
            {/* Your High Score */}
            <View style={styles.topBarItem}>
                <Text style={styles.topBarIcon}>⭐</Text>
                <Text style={styles.topBarValue}>{highScore}</Text>
            </View>

            {/* Progress towards #1 */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${scoreProgress * 100}%` }]} />
            </View>

            {/* #1 Leaderboard Score */}
            <View style={styles.topBarItem}>
                <Text style={styles.topBarIcon}>👑</Text>
                <Text style={styles.topBarValue}>{globalTopScore}</Text>
            </View>

            <TouchableOpacity style={styles.topBarButton} onPress={() => {
                const newState = !soundEnabled;
                setSoundEnabledState(newState);
                setSoundEnabled(newState);
            }}>
                <Text style={styles.topBarIcon}>{soundEnabled ? '🔊' : '🔇'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.leaderboardBtn} onPress={openLeaderboard}>
                <Text style={styles.leaderboardIcon}>🏆</Text>
            </TouchableOpacity>
        </View>
    );

    // Leaderboard Modal Content
    const renderLeaderboardContent = () => (
        <>
            <Text style={styles.modalTitle}>🏆 Leaderboard</Text>
            {playerRank > 0 && (
                <Text style={styles.yourRank}>Your Rank: #{playerRank} ({highScore} pts)</Text>
            )}
            {loadingLeaderboard && leaderboard.length === 0 ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
            ) : leaderboard.length === 0 ? (
                <Text style={styles.modalText}>No scores yet. Be the first!</Text>
            ) : (
                <ScrollView style={styles.leaderboardList}>
                    {leaderboard.map((entry) => (
                        <View key={entry.id} style={[styles.leaderboardItem, entry.id === user?.id && styles.leaderboardItemHighlight]}>
                            <Text style={styles.rankBadge}>#{entry.rank}</Text>
                            {entry.imageUrl ? (
                                <Image source={{ uri: entry.imageUrl }} style={styles.leaderboardAvatar} />
                            ) : (
                                <View style={styles.leaderboardAvatarPlaceholder}>
                                    <Text style={styles.avatarText}>{entry.name?.charAt(0) || '?'}</Text>
                                </View>
                            )}
                            <Text style={styles.leaderboardName} numberOfLines={1}>{entry.name || 'Player'}</Text>
                            <Text style={styles.leaderboardScore}>{entry.score}</Text>
                        </View>
                    ))}
                </ScrollView>
            )}
            <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => setModalType('none')}>
                <Text style={styles.modalBtnPrimaryText}>Close</Text>
            </TouchableOpacity>
        </>
    );

    // START SCREEN
    if (gameState === 'idle') {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar style="light" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                        <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>
                    {renderTopBar()}
                </View>

                <View style={styles.centerContent}>
                    <Text style={styles.bigEmoji}>🧠</Text>
                    <Text style={styles.title}>Memory Challenge</Text>
                    <Text style={styles.subtitle}>Match all 12 pairs to win!</Text>

                    <View style={styles.livesDisplay}>
                        {[0, 1, 2].map(i => (
                            <Text key={i} style={styles.heart}>{i < lives ? '❤️' : '🩶'}</Text>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.playBtn, lives <= 0 && styles.btnDisabled]}
                        onPress={startGame}
                        disabled={lives <= 0}
                    >
                        <Text style={styles.playBtnText}>{lives > 0 ? '▶️ Play Game' : '😢 No Lives'}</Text>
                    </TouchableOpacity>

                    {renderAdButton()}
                </View>

                <CustomModal visible={modalType === 'noLives'} onClose={() => setModalType('none')}>
                    <Text style={styles.modalEmoji}>😢</Text>
                    <Text style={styles.modalTitle}>No Lives Left!</Text>
                    <Text style={styles.modalText}>Watch an ad to get 1 life</Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setModalType('none')}>
                            <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalBtnPrimary, (!adLoaded && !isExpoGo) && styles.btnDisabled]}
                            onPress={() => { setModalType('none'); handleWatchAd(); }}
                            disabled={!adLoaded && !isExpoGo}
                        >
                            <Text style={styles.modalBtnPrimaryText}>
                                {adLoading && !adError ? 'Loading...' : adError ? 'Unavailable' : 'Watch Ad'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </CustomModal>

                {/* Ad Error Modal */}
                <CustomModal visible={adErrorShown} onClose={() => setAdErrorShown(false)}>
                    <Text style={styles.modalEmoji}>😔</Text>
                    <Text style={styles.modalTitle}>Ads Unavailable</Text>
                    <Text style={styles.modalText}>
                        {adError || 'Ads are being reviewed and will be available soon. Please check back later!'}
                    </Text>
                    <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => setAdErrorShown(false)}>
                        <Text style={styles.modalBtnPrimaryText}>OK</Text>
                    </TouchableOpacity>
                </CustomModal>

                <CustomModal visible={modalType === 'adReward'} onClose={() => setModalType('none')}>
                    <Text style={styles.modalEmoji}>🎉</Text>
                    <Text style={styles.modalTitle}>+1 Life!</Text>
                    <Text style={styles.modalText}>You earned a life!</Text>
                    <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => setModalType('none')}>
                        <Text style={styles.modalBtnPrimaryText}>Awesome!</Text>
                    </TouchableOpacity>
                </CustomModal>

                <CustomModal visible={modalType === 'leaderboard'} onClose={() => setModalType('none')}>
                    {renderLeaderboardContent()}
                </CustomModal>
            </SafeAreaView>
        );
    }

    // WIN SCREEN
    if (gameState === 'won') {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar style="light" />
                <View style={styles.centerContent}>
                    <Text style={styles.bigEmoji}>🎉</Text>
                    <Text style={styles.title}>You Won!</Text>
                    <Text style={styles.scoreDisplay}>{score} pts</Text>
                    {score >= highScore && <Text style={styles.newRecord}>🏆 New Record!</Text>}

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}><Text style={styles.statValue}>{formatTime(time)}</Text><Text style={styles.statLabel}>Time</Text></View>
                        <View style={styles.statBox}><Text style={styles.statValue}>{moves}</Text><Text style={styles.statLabel}>Moves</Text></View>
                    </View>

                    <View style={styles.livesDisplay}>
                        {[0, 1, 2].map(i => <Text key={i} style={styles.heart}>{i < lives ? '❤️' : '🩶'}</Text>)}
                    </View>

                    <TouchableOpacity style={[styles.playBtn, lives <= 0 && styles.btnDisabled]} onPress={startGame} disabled={lives <= 0}>
                        <Text style={styles.playBtnText}>🔄 Play Again</Text>
                    </TouchableOpacity>

                    {lives < GAME_CONFIG.MAX_LIVES && renderAdButton()}

                    <TouchableOpacity style={styles.menuBtn} onPress={() => { setGameState('idle'); fetchGameData(); }}>
                        <Text style={styles.menuBtnText}>Menu</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // LOST SCREEN
    if (gameState === 'lost') {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar style="light" />
                <View style={styles.centerContent}>
                    <Text style={styles.bigEmoji}>💔</Text>
                    <Text style={styles.title}>Game Over</Text>
                    <Text style={styles.subtitle}>Matched {matchedPairs}/{CARD_ICONS.length} pairs</Text>

                    <View style={styles.livesDisplay}>
                        {[0, 1, 2].map(i => <Text key={i} style={styles.heart}>{i < lives ? '❤️' : '🩶'}</Text>)}
                    </View>

                    {lives > 0 ? (
                        <TouchableOpacity style={styles.playBtn} onPress={startGame}>
                            <Text style={styles.playBtnText}>🔄 Try Again</Text>
                        </TouchableOpacity>
                    ) : (
                        renderAdButton()
                    )}

                    <TouchableOpacity style={styles.menuBtn} onPress={() => { setGameState('idle'); fetchGameData(); }}>
                        <Text style={styles.menuBtnText}>Menu</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // PLAYING SCREEN
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => setModalType('giveUp')} style={styles.closeBtn}>
                    <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
                {renderTopBar()}
            </View>

            <View style={styles.gameStatsBar}>
                <Text style={styles.gameStat}>⏱️ {formatTime(time)}</Text>
                <Text style={styles.gameStat}>👆 {moves}</Text>
                <Text style={styles.gameStat}>{matchedPairs}/{CARD_ICONS.length}</Text>
            </View>

            <View style={styles.gameArea}>
                <View style={styles.cardGrid}>
                    {cards.map((card, index) => renderCard(card, index))}
                </View>
            </View>

            <CustomModal visible={modalType === 'giveUp'} onClose={() => setModalType('none')}>
                <Text style={styles.modalEmoji}>🤔</Text>
                <Text style={styles.modalTitle}>Give Up?</Text>
                <Text style={styles.modalText}>You will lose this attempt.</Text>
                <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setModalType('none')}>
                        <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalBtnDanger} onPress={() => { setModalType('none'); setGameState('lost'); }}>
                        <Text style={styles.modalBtnPrimaryText}>Give Up</Text>
                    </TouchableOpacity>
                </View>
            </CustomModal>

            <CustomModal visible={modalType === 'leaderboard'} onClose={() => setModalType('none')}>
                {renderLeaderboardContent()}
            </CustomModal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0f' },

    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    closeBtnText: { fontSize: 16, color: '#fff' },

    topBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 10 },
    topBarItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    topBarIcon: { fontSize: 16 },
    topBarValue: { fontSize: 14, fontWeight: '700', color: '#f59e0b' },
    topBarButton: { padding: 4 },
    progressContainer: { flex: 1, height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#6366f1', borderRadius: 3 },
    leaderboardBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#2a2a4e', alignItems: 'center', justifyContent: 'center' },
    leaderboardIcon: { fontSize: 18 },

    gameStatsBar: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 8 },
    gameStat: { fontSize: 13, color: '#888' },

    centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    bigEmoji: { fontSize: 80, marginBottom: 16 },
    title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#666', marginBottom: 24, textAlign: 'center' },

    livesDisplay: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    heart: { fontSize: 28 },

    playBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16, marginBottom: 12 },
    playBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
    btnDisabled: { backgroundColor: '#333', opacity: 0.5 },
    adBtn: { backgroundColor: '#059669', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginBottom: 12 },
    adBtnDisabled: { backgroundColor: '#444', opacity: 0.7 },
    adBtnError: { backgroundColor: '#6b7280' },
    adBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
    menuBtn: { marginTop: 8 },
    menuBtnText: { fontSize: 14, color: '#666', textDecorationLine: 'underline' },

    scoreDisplay: { fontSize: 36, fontWeight: '800', color: COLORS.primary, marginBottom: 8 },
    newRecord: { fontSize: 16, fontWeight: '600', color: '#f59e0b', marginBottom: 16 },
    statsRow: { flexDirection: 'row', gap: 32, marginBottom: 24 },
    statBox: { alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
    statLabel: { fontSize: 12, color: '#666', marginTop: 4 },

    gameArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: GRID_PADDING },
    cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', width: width - GRID_PADDING * 2, gap: CARD_GAP },
    cardWrapper: { width: CARD_SIZE, height: CARD_SIZE },
    cardContainer: { width: '100%', height: '100%' },
    card: { position: 'absolute', width: '100%', height: '100%', borderRadius: 8, alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden' },
    cardBack: { backgroundColor: COLORS.primary },
    cardFront: { backgroundColor: '#1a1a2e', borderWidth: 2, borderColor: '#10b981' },
    cardMatched: { opacity: 0.3 },
    cardBackIcon: { fontSize: 22, fontWeight: '800', color: '#fff8' },
    cardIcon: { fontSize: 26 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
    modalContent: { backgroundColor: '#1a1a2e', borderRadius: 20, padding: 24, width: '90%', maxHeight: '80%', alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4e' },
    modalEmoji: { fontSize: 56, marginBottom: 12 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
    modalText: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 20 },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalBtnPrimary: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
    modalBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    modalBtnSecondary: { backgroundColor: '#333', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
    modalBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: '#aaa' },
    modalBtnDanger: { backgroundColor: '#dc2626', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },

    yourRank: { fontSize: 14, color: COLORS.primary, marginBottom: 16, fontWeight: '600' },
    leaderboardList: { width: '100%', maxHeight: 300 },
    leaderboardItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#252540', borderRadius: 10, marginBottom: 8 },
    leaderboardItemHighlight: { backgroundColor: COLORS.primary + '30', borderWidth: 1, borderColor: COLORS.primary },
    rankBadge: { fontSize: 14, fontWeight: '700', color: '#f59e0b', width: 36 },
    leaderboardAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
    leaderboardAvatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#444', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    avatarText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    leaderboardName: { flex: 1, fontSize: 14, color: '#fff' },
    leaderboardScore: { fontSize: 14, fontWeight: '700', color: '#10b981' },
});
