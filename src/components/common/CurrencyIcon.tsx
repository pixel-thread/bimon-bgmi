"use client";

import Image from "next/image";
import { GAME } from "@/lib/game-config";

interface CurrencyIconProps {
    /** Size in pixels (width & height). Default: 16 */
    size?: number;
    /** Extra CSS classes */
    className?: string;
    /** For dual-currency games: "entry" shows BP (default), "reward" shows Diamond */
    variant?: "entry" | "reward";
}

/**
 * Renders the game's currency icon — PNG/SVG image, styled text badge, or emoji fallback.
 * For dual-currency games (MLBB), defaults to entry currency (BP).
 * Use variant="reward" to show the reward currency (Diamond).
 */
export function CurrencyIcon({ size = 16, className, variant = "entry" }: CurrencyIconProps) {
    // For dual-currency games, show entry currency (BP) by default
    if (GAME.hasDualCurrency && variant === "entry") {
        const label = GAME.entryCurrency ?? "BP";
        const fontSize = Math.max(size * 0.85, 10);
        return (
            <span
                className={`inline-flex items-center justify-center font-bold text-primary ${className ?? ""}`}
                style={{
                    fontSize,
                    lineHeight: 1,
                    verticalAlign: "middle",
                    position: "relative",
                    top: "-1px",
                }}
            >
                {label}
            </span>
        );
    }

    // For dual-currency reward variant, show Diamond icon
    if (GAME.hasDualCurrency && variant === "reward" && GAME.currencyIconPath) {
        return (
            <Image
                src={GAME.currencyIconPath}
                alt={GAME.currency}
                width={size}
                height={size}
                className={`inline-block shrink-0 ${className ?? ""}`}
                style={{
                    width: size,
                    height: size,
                    verticalAlign: "middle",
                    position: "relative",
                    top: "-1px",
                }}
                unoptimized
            />
        );
    }

    // Single-currency games — use icon or text
    if (GAME.currencyIconPath) {
        return (
            <Image
                src={GAME.currencyIconPath}
                alt={GAME.currency}
                width={size}
                height={size}
                className={`inline-block shrink-0 ${className ?? ""}`}
                style={{
                    width: size,
                    height: size,
                    verticalAlign: "middle",
                    position: "relative",
                    top: "-1px",
                }}
                unoptimized
            />
        );
    }

    // Text-based currency (e.g. "UC" for BGMI)
    const fontSize = Math.max(size * 0.85, 10);
    return (
        <span
            className={`inline-flex items-center justify-center font-bold text-primary ${className ?? ""}`}
            style={{
                fontSize,
                lineHeight: 1,
                verticalAlign: "middle",
                position: "relative",
                top: "-1px",
            }}
        >
            {GAME.currency}
        </span>
    );
}

