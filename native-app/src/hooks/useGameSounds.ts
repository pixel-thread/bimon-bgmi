import { useRef, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';

// Sound configuration - load lazily to not block app
type SoundType = 'flip' | 'match' | 'mismatch' | 'win' | 'button';

const SOUND_URLS: Record<SoundType, string> = {
    flip: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    match: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    mismatch: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Very soft click
    win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
    button: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
};

export function useGameSounds() {
    const soundsRef = useRef<Map<SoundType, Audio.Sound>>(new Map());
    const enabledRef = useRef(true);
    const loadingRef = useRef(false);

    // Load sounds in background - don't block
    useEffect(() => {
        if (loadingRef.current) return;
        loadingRef.current = true;

        const loadSounds = async () => {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: false,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                });
            } catch (e) {
                console.log('Audio mode setup failed:', e);
            }

            // Load each sound separately - don't wait for all
            for (const [key, url] of Object.entries(SOUND_URLS)) {
                try {
                    const { sound } = await Audio.Sound.createAsync(
                        { uri: url },
                        { shouldPlay: false, volume: 0.25 }
                    );
                    soundsRef.current.set(key as SoundType, sound);
                } catch (e) {
                    // Silently fail - sounds are optional
                }
            }
        };

        // Run in background, don't block
        loadSounds();

        return () => {
            soundsRef.current.forEach(sound => {
                try { sound.unloadAsync(); } catch { }
            });
        };
    }, []);

    const playSound = useCallback(async (type: SoundType) => {
        if (!enabledRef.current) return;

        const sound = soundsRef.current.get(type);
        if (sound) {
            try {
                await sound.setPositionAsync(0);
                await sound.playAsync();
            } catch { }
        }
    }, []);

    const setEnabled = useCallback((enabled: boolean) => {
        enabledRef.current = enabled;
    }, []);

    return {
        playFlip: useCallback(() => playSound('flip'), [playSound]),
        playMatch: useCallback(() => playSound('match'), [playSound]),
        playMismatch: useCallback(() => playSound('mismatch'), [playSound]),
        playWin: useCallback(() => playSound('win'), [playSound]),
        playButton: useCallback(() => playSound('button'), [playSound]),
        setEnabled,
    };
}
