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
 * Renders the game's currency icon — either a PNG image or emoji fallback.
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

    return <span className={className}>{GAME.currencyEmoji}</span>;
}
