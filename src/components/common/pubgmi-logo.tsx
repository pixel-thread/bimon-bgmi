"use client";

import { useEffect, useState, useRef } from "react";
import { GAME, GAME_MODE } from "@/lib/game-config";

/**
 * Animated game logo — adapts to GAME_MODE:
 *
 * BGMI mode: PUBGMI ↔ BGMI slot-machine animation
 * Free Fire mode: BOO-YAH bounce animation
 */
interface PubgmiLogoProps {
    variant?: "hero" | "header";
    className?: string;
}

// ─── BGMI Phases ───
type BgmiPhase =
    | "PUBGMI"
    | "DROP_PU"
    | "BGMI"
    | "SWAP"
    | "PUBGMI_MID"
    | "DROP_MI"
    | "PUBG"
    | "ROLL_MI"
    ;

const BGMI_TIMINGS = {
    PUBGMI: 2400,
    DROP_PU: 900,
    BGMI: 1500,
    SWAP: 2000,
    PUBGMI_MID: 2000,
    DROP_MI: 900,
    PUBG: 1200,
    ROLL_MI: 1400,
};

// ─── BGMI Logo ───
function BgmiLogo({ className }: PubgmiLogoProps) {
    const [phase, setPhase] = useState<BgmiPhase>("PUBGMI");
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const advance = (nextPhase: BgmiPhase, delay: number) => {
            timeoutRef.current = setTimeout(() => setPhase(nextPhase), delay);
        };

        switch (phase) {
            case "PUBGMI":
                advance("DROP_PU", BGMI_TIMINGS.PUBGMI);
                break;
            case "DROP_PU":
                advance("BGMI", BGMI_TIMINGS.DROP_PU);
                break;
            case "BGMI":
                advance("SWAP", BGMI_TIMINGS.BGMI);
                break;
            case "SWAP":
                advance("PUBGMI_MID", BGMI_TIMINGS.SWAP);
                break;
            case "PUBGMI_MID":
                advance("DROP_MI", BGMI_TIMINGS.PUBGMI_MID);
                break;
            case "DROP_MI":
                advance("PUBG", BGMI_TIMINGS.DROP_MI);
                break;
            case "PUBG":
                advance("ROLL_MI", BGMI_TIMINGS.PUBG);
                break;
            case "ROLL_MI":
                advance("PUBGMI", BGMI_TIMINGS.ROLL_MI + 600);
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

            case "SWAP":
                return (
                    <span className="pubgmi-swap-container">
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

// ─── Free Fire Logo — simple: show → fall all → roll back in ───
type FFPhase = "SHOW" | "FALL" | "EMPTY" | "ROLL";

function FreeFireLogo({ className }: PubgmiLogoProps) {
    const [phase, setPhase] = useState<FFPhase>("SHOW");
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const letters = ["B", "O", "O", "-", "Y", "A", "H"];

    useEffect(() => {
        const advance = (next: FFPhase, delay: number) => {
            timeoutRef.current = setTimeout(() => setPhase(next), delay);
        };

        switch (phase) {
            case "SHOW":
                advance("FALL", 3000);       // show for 3 sec
                break;
            case "FALL":
                advance("EMPTY", 900);       // letters fall (takes ~900ms)
                break;
            case "EMPTY":
                advance("ROLL", 500);        // brief pause while empty
                break;
            case "ROLL":
                advance("SHOW", 1200);       // letters roll back in
                break;
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [phase]);

    const renderLetters = () => {
        switch (phase) {
            case "SHOW":
                return letters.map((l, i) => (
                    <span key={`s-${i}`} className="pubgmi-letter">{l}</span>
                ));

            case "FALL":
                return letters.map((l, i) => (
                    <span
                        key={`fall-${i}`}
                        className="pubgmi-letter pubgmi-fall-down"
                        style={{ "--fall-delay": `${i * 80}ms` } as React.CSSProperties}
                    >
                        {l}
                    </span>
                ));

            case "EMPTY":
                return null;

            case "ROLL":
                return letters.map((l, i) => (
                    <span
                        key={`roll-${i}`}
                        className="pubgmi-letter pubgmi-roll-in"
                        style={{ "--roll-delay": `${i * 100}ms` } as React.CSSProperties}
                    >
                        {l}
                    </span>
                ));

            default:
                return null;
        }
    };

    return (
        <span
            className={`pubgmi-logo inline-flex items-baseline select-none ${className || ""}`}
            aria-label="BOO-YAH"
        >
            {renderLetters()}
        </span>
    );
}

// ─── Exported Component — picks based on GAME_MODE ───
export function PubgmiLogo(props: PubgmiLogoProps) {
    if (GAME_MODE === "freefire") {
        return <FreeFireLogo {...props} />;
    }
    return <BgmiLogo {...props} />;
}
