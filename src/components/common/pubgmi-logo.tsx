"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Animated PUBGMI logo that cycles through phases:
 *
 * 1. "PUBGMI" — stable hold
 * 2. Glitch → "PUBG" — MI disappears
 * 3. "MI" rolls in from the top → "PUBGMI"
 * 4. Glitch → "BGMI" — stable hold
 * 5. Glitch → back to "PUBGMI" → repeat
 */
interface PubgmiLogoProps {
    variant?: "hero" | "header";
    className?: string;
}

type Phase =
    | "PUBGMI"       // stable full text
    | "GLITCH_OUT"   // glitching before removing MI
    | "PUBG"         // only PUBG shown, MI gone
    | "ROLL_IN"      // MI rolling in from top
    | "GLITCH_TO_BGMI" // glitch transition to BGMI
    | "BGMI"         // stable BGMI
    | "GLITCH_TO_PUBGMI"; // glitch transition back to PUBGMI

const TIMINGS = {
    PUBGMI: 2400,
    GLITCH_OUT: 500,
    PUBG: 600,
    ROLL_IN: 1000,
    GLITCH_TO_BGMI: 500,
    BGMI: 2400,
    GLITCH_TO_PUBGMI: 500,
};

export function PubgmiLogo({ variant = "header", className }: PubgmiLogoProps) {
    const [phase, setPhase] = useState<Phase>("PUBGMI");
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const advance = (nextPhase: Phase, delay: number) => {
            timeoutRef.current = setTimeout(() => setPhase(nextPhase), delay);
        };

        switch (phase) {
            case "PUBGMI":
                advance("GLITCH_OUT", TIMINGS.PUBGMI);
                break;
            case "GLITCH_OUT":
                advance("PUBG", TIMINGS.GLITCH_OUT);
                break;
            case "PUBG":
                advance("ROLL_IN", TIMINGS.PUBG);
                break;
            case "ROLL_IN":
                advance("GLITCH_TO_BGMI", TIMINGS.ROLL_IN + 800); // hold after roll-in
                break;
            case "GLITCH_TO_BGMI":
                advance("BGMI", TIMINGS.GLITCH_TO_BGMI);
                break;
            case "BGMI":
                advance("GLITCH_TO_PUBGMI", TIMINGS.BGMI);
                break;
            case "GLITCH_TO_PUBGMI":
                advance("PUBGMI", TIMINGS.GLITCH_TO_PUBGMI);
                break;
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [phase]);

    const isGlitching =
        phase === "GLITCH_OUT" ||
        phase === "GLITCH_TO_BGMI" ||
        phase === "GLITCH_TO_PUBGMI";

    // Determine which letters to show and how
    const renderLetters = () => {
        switch (phase) {
            case "PUBGMI":
            case "GLITCH_OUT":
                return renderText("PUBGMI", isGlitching);

            case "PUBG":
                return renderText("PUBG", false);

            case "ROLL_IN":
                return (
                    <>
                        {renderText("PUBG", false)}
                        {"MI".split("").map((letter, i) => (
                            <span
                                key={`roll-${i}`}
                                className="pubgmi-letter pubgmi-roll-in"
                                style={{ animationDelay: `${i * 400}ms` }}
                            >
                                {letter}
                            </span>
                        ))}
                    </>
                );

            case "GLITCH_TO_BGMI":
                return renderText("PUBGMI", true);

            case "BGMI":
                return renderText("BGMI", false);

            case "GLITCH_TO_PUBGMI":
                return renderText("BGMI", true);

            default:
                return renderText("PUBGMI", false);
        }
    };

    const renderText = (text: string, glitching: boolean) =>
        text.split("").map((letter, i) => (
            <span
                key={`${text}-${phase}-${i}`}
                className={`pubgmi-letter ${glitching ? "pubgmi-glitch-letter" : ""}`}
                style={{ animationDelay: `${i * (glitching ? 40 : 50)}ms` }}
            >
                {letter}
            </span>
        ));

    return (
        <span
            className={`pubgmi-logo inline-flex items-baseline select-none overflow-hidden ${className || ""}`}
            aria-label="PUBGMI"
        >
            {renderLetters()}
        </span>
    );
}
