"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Animated PUBGMI logo — slot-machine style:
 *
 * PUBGMI → PU falls → BGMI
 * → BGMI falls while PUBGMI rolls in simultaneously
 * → PUBGMI → MI falls → PUBG → MI rolls in → PUBGMI → repeat
 */
interface PubgmiLogoProps {
    variant?: "hero" | "header";
    className?: string;
}

type Phase =
    | "PUBGMI"
    | "DROP_PU"          // P then U fall
    | "BGMI"
    | "SWAP"             // BGMI falls + PUBGMI rolls in simultaneously
    | "PUBGMI_MID"
    | "DROP_MI"          // M then I fall
    | "PUBG"
    | "ROLL_MI"          // M then I roll in
    ;

const TIMINGS = {
    PUBGMI: 2400,
    DROP_PU: 900,
    BGMI: 1500,
    SWAP: 2000,
    PUBGMI_MID: 2000,
    DROP_MI: 900,
    PUBG: 1200,
    ROLL_MI: 1400,
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
                advance("DROP_PU", TIMINGS.PUBGMI);
                break;
            case "DROP_PU":
                advance("BGMI", TIMINGS.DROP_PU);
                break;
            case "BGMI":
                advance("SWAP", TIMINGS.BGMI);
                break;
            case "SWAP":
                advance("PUBGMI_MID", TIMINGS.SWAP);
                break;
            case "PUBGMI_MID":
                advance("DROP_MI", TIMINGS.PUBGMI_MID);
                break;
            case "DROP_MI":
                advance("PUBG", TIMINGS.DROP_MI);
                break;
            case "PUBG":
                advance("ROLL_MI", TIMINGS.PUBG);
                break;
            case "ROLL_MI":
                advance("PUBGMI", TIMINGS.ROLL_MI + 600);
                break;
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [phase]);

    const s = (letter: string, pos: number) => (
        <span key={`s-${pos}`} className="pubgmi-letter">{letter}</span>
    );

    const fall = (letter: string, i: number, prefix: string) => (
        <span
            key={`fall-${prefix}-${i}`}
            className="pubgmi-letter pubgmi-fall-down"
            style={{ "--fall-delay": `${i * 150}ms` } as React.CSSProperties}
        >
            {letter}
        </span>
    );

    const roll = (letter: string, i: number, prefix: string) => (
        <span
            key={`roll-${prefix}-${i}`}
            className="pubgmi-letter pubgmi-roll-in"
            style={{ "--roll-delay": `${i * 150}ms` } as React.CSSProperties}
        >
            {letter}
        </span>
    );

    const renderLetters = () => {
        switch (phase) {
            case "PUBGMI":
            case "PUBGMI_MID":
                return (
                    <>
                        {s("P", 0)}{s("U", 1)}{s("B", 2)}{s("G", 3)}{s("M", 4)}{s("I", 5)}
                    </>
                );

            case "DROP_PU":
                return (
                    <>
                        {fall("P", 0, "pu")}{fall("U", 1, "pu")}
                        {s("B", 2)}{s("G", 3)}{s("M", 4)}{s("I", 5)}
                    </>
                );

            case "BGMI":
                return (
                    <>
                        {s("B", 2)}{s("G", 3)}{s("M", 4)}{s("I", 5)}
                    </>
                );

            // BGMI falls out while PUBGMI rolls in — layered
            case "SWAP":
                return (
                    <span className="pubgmi-swap-container">
                        {/* Falling BGMI — absolute so it doesn't affect layout */}
                        <span className="pubgmi-swap-out">
                            {"BGMI".split("").map((letter, i) => (
                                <span
                                    key={`swap-out-${i}`}
                                    className="pubgmi-letter pubgmi-fall-down"
                                    style={{ "--fall-delay": `${i * 100}ms` } as React.CSSProperties}
                                >
                                    {letter}
                                </span>
                            ))}
                        </span>
                        {/* Rolling in PUBGMI — starts slightly after */}
                        {"PUBGMI".split("").map((letter, i) => (
                            <span
                                key={`swap-in-${i}`}
                                className="pubgmi-letter pubgmi-roll-in"
                                style={{ "--roll-delay": `${300 + i * 120}ms` } as React.CSSProperties}
                            >
                                {letter}
                            </span>
                        ))}
                    </span>
                );

            case "DROP_MI":
                return (
                    <>
                        {s("P", 0)}{s("U", 1)}{s("B", 2)}{s("G", 3)}
                        {fall("M", 0, "mi")}{fall("I", 1, "mi")}
                    </>
                );

            case "PUBG":
                return (
                    <>
                        {s("P", 0)}{s("U", 1)}{s("B", 2)}{s("G", 3)}
                    </>
                );

            case "ROLL_MI":
                return (
                    <>
                        {s("P", 0)}{s("U", 1)}{s("B", 2)}{s("G", 3)}
                        {roll("M", 0, "mi")}{roll("I", 1, "mi")}
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <span
            className={`pubgmi-logo inline-flex items-baseline select-none ${className || ""}`}
            aria-label="PUBGMI"
        >
            {renderLetters()}
        </span>
    );
}
