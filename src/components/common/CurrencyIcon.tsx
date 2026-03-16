"use client";

import Image from "next/image";
import { GAME } from "@/lib/game-config";

interface CurrencyIconProps {
    /** Size in pixels (width & height). Default: 16 */
    size?: number;
    /** Extra CSS classes */
    className?: string;
}

/**
 * Renders the game's currency icon — PNG/SVG image, styled text badge, or emoji fallback.
 * Vertically aligned with adjacent text at any size.
 * Usage: <CurrencyIcon size={16} />
 */
export function CurrencyIcon({ size = 16, className }: CurrencyIconProps) {
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
    const fontSize = Math.max(size * 0.6, 8);
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

