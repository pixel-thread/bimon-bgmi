"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STORAGE_KEYS } from "../constants";

type SoundType = "flip" | "match" | "mismatch" | "win" | "highscore";

// Audio context for low-latency sound
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
    if (typeof window === "undefined") return null;
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContext;
};

// Generate simple tones programmatically
const playTone = (frequency: number, duration: number, type: OscillatorType = "sine", gain = 0.3) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
};

// Sound configurations - soft, gentle tones
const SOUNDS: Record<SoundType, () => void> = {
    flip: () => playTone(300, 0.08, "sine", 0.08), // Very soft click
    match: () => {
        // Gentle ascending chime
        playTone(440, 0.12, "sine", 0.1); // A4
        setTimeout(() => playTone(523, 0.12, "sine", 0.08), 80); // C5
        setTimeout(() => playTone(659, 0.15, "sine", 0.06), 160); // E5
    },
    mismatch: () => {
        // Soft low thud
        playTone(150, 0.1, "sine", 0.08);
    },
    win: () => {
        // Gentle celebration melody
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((note, i) => {
            setTimeout(() => playTone(note, 0.2, "sine", 0.1), i * 120);
        });
    },
    highscore: () => {
        // Soft fanfare
        const melody = [659, 784, 880, 1047]; // E5, G5, A5, C6
        melody.forEach((note, i) => {
            setTimeout(() => playTone(note, 0.25, "sine", 0.12), i * 100);
        });
        setTimeout(() => {
            playTone(1047, 0.4, "sine", 0.15); // Final C6
        }, melody.length * 100 + 50);
    },
};

// Haptic feedback
const triggerHaptic = (type: "light" | "medium" | "heavy" = "medium") => {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;

    const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30],
    };

    navigator.vibrate(patterns[type]);
};

export function useGameSounds() {
    const [isMuted, setIsMuted] = useState(false);
    const initialized = useRef(false);

    // Load mute state from localStorage
    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = localStorage.getItem(STORAGE_KEYS.SOUND_MUTED);
        if (stored === "true") {
            setIsMuted(true);
        }
        initialized.current = true;
    }, []);

    // Save mute state to localStorage
    useEffect(() => {
        if (!initialized.current || typeof window === "undefined") return;
        localStorage.setItem(STORAGE_KEYS.SOUND_MUTED, String(isMuted));
    }, [isMuted]);

    const playSound = useCallback((sound: SoundType, withHaptic = true) => {
        if (isMuted) {
            // Still trigger haptic even when muted
            if (withHaptic) {
                const hapticMap: Record<SoundType, "light" | "medium" | "heavy"> = {
                    flip: "light",
                    match: "medium",
                    mismatch: "light",
                    win: "heavy",
                    highscore: "heavy",
                };
                triggerHaptic(hapticMap[sound]);
            }
            return;
        }

        // Resume audio context if suspended (needed for mobile)
        const ctx = getAudioContext();
        if (ctx?.state === "suspended") {
            ctx.resume();
        }

        SOUNDS[sound]();

        if (withHaptic) {
            const hapticMap: Record<SoundType, "light" | "medium" | "heavy"> = {
                flip: "light",
                match: "medium",
                mismatch: "light",
                win: "heavy",
                highscore: "heavy",
            };
            triggerHaptic(hapticMap[sound]);
        }
    }, [isMuted]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    return {
        isMuted,
        toggleMute,
        playSound,
        triggerHaptic,
    };
}
