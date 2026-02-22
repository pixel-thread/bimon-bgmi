"use client";

import { memo, useCallback, useRef, useState } from "react";
import { Crown, Medal, Award } from "lucide-react";
import { Avatar } from "@heroui/react";
import type { PlayerDTO } from "@/hooks/use-players";

const positionConfig = {
    1: {
        size: "w-24 sm:w-32 aspect-[9/16]",
        border: "border-2 border-yellow-400",
        glow: "shadow-[0_0_25px_rgba(250,204,21,0.4)]",
        bg: "from-yellow-900/60 to-yellow-950/80",
        icon: Crown,
        iconColor: "text-yellow-400",
        order: "order-2",
        mt: "mt-0",
    },
    2: {
        size: "w-20 sm:w-28 aspect-[9/16]",
        border: "border-2 border-slate-300",
        glow: "shadow-[0_0_20px_rgba(148,163,184,0.3)]",
        bg: "from-slate-700/60 to-slate-800/80",
        icon: Medal,
        iconColor: "text-slate-300",
        order: "order-1",
        mt: "mt-6 sm:mt-8",
    },
    3: {
        size: "w-20 sm:w-28 aspect-[9/16]",
        border: "border-2 border-amber-600",
        glow: "shadow-[0_0_20px_rgba(217,119,6,0.3)]",
        bg: "from-amber-800/60 to-amber-900/80",
        icon: Award,
        iconColor: "text-amber-600",
        order: "order-3",
        mt: "mt-6 sm:mt-8",
    },
} as const;

function getDisplayName(
    displayName: string | null,
    username: string
): string {
    return displayName || username;
}

interface PodiumCardProps {
    player: PlayerDTO;
    position: 1 | 2 | 3;
    onPlayerClick: (id: string) => void;
}

/**
 * A single podium card showing character image, position badge, name and K/D.
 * Memoized to prevent video/GIF re-renders.
 */
export const PodiumCard = memo(function PodiumCard({
    player,
    position,
    onPlayerClick,
}: PodiumCardProps) {
    const config = positionConfig[position];
    const Icon = config.icon;
    const kdValue = player.stats.kd;
    const displayKd = isFinite(kdValue) ? kdValue.toFixed(2) : "0.00";
    const videoRef = useRef<HTMLVideoElement>(null);
    const [mediaLoaded, setMediaLoaded] = useState(false);

    const handleMouseEnter = useCallback(() => {
        if (videoRef.current?.paused) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => { });
        }
    }, []);

    const charImg = player.characterImage;
    const isVideo = charImg?.isVideo ?? false;
    const isAnimated = charImg?.isAnimated ?? false;
    const mediaUrl = charImg?.url;
    const thumbnailUrl = charImg?.thumbnailUrl;

    return (
        <div className={`${config.mt} ${config.order} flex flex-col items-center gap-2`}>
            {/* Card */}
            <div
                onClick={() => onPlayerClick(player.id)}
                onMouseEnter={isVideo ? handleMouseEnter : undefined}
                className={`
                    ${config.size} relative cursor-pointer group
                    rounded-2xl ${config.border} ${config.glow}
                    bg-gradient-to-b ${config.bg}
                    overflow-hidden transition-all duration-200
                    hover:scale-105 hover:shadow-xl
                `}
            >
                {/* Character image / video / GIF */}
                {charImg?.url ? (
                    isVideo && mediaUrl ? (
                        <>
                            {thumbnailUrl && (
                                <img
                                    src={thumbnailUrl}
                                    alt=""
                                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                                />
                            )}
                            <video
                                ref={videoRef}
                                src={mediaUrl}
                                muted
                                loop
                                playsInline
                                preload="none"
                                poster={thumbnailUrl || undefined}
                                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${mediaLoaded ? "opacity-90" : "opacity-0"
                                    }`}
                                onCanPlay={() => setMediaLoaded(true)}
                            />
                        </>
                    ) : isAnimated && mediaUrl ? (
                        <>
                            {thumbnailUrl && (
                                <img
                                    src={thumbnailUrl}
                                    alt=""
                                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${mediaLoaded ? "opacity-0" : "opacity-90"
                                        }`}
                                />
                            )}
                            <img
                                src={mediaUrl}
                                alt=""
                                loading="lazy"
                                onLoad={() => setMediaLoaded(true)}
                                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${mediaLoaded ? "opacity-90" : "opacity-0"
                                    }`}
                            />
                        </>
                    ) : (
                        <img
                            src={charImg.url}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-cover opacity-90"
                        />
                    )
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white/20">
                            {getDisplayName(player.displayName, player.username)
                                .charAt(0)
                                .toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Position badge */}
                <div className="absolute left-1.5 top-1.5">
                    <Icon className={`h-5 w-5 drop-shadow-lg ${config.iconColor}`} />
                </div>
            </div>

            {/* Player info — below the card */}
            <div
                className="flex flex-col items-center gap-0.5 cursor-pointer"
                onClick={() => onPlayerClick(player.id)}
            >
                <Avatar
                    src={player.imageUrl || undefined}
                    name={getDisplayName(player.displayName, player.username)}
                    size="sm"
                    className="h-8 w-8 ring-2 ring-background"
                />
                <p className="max-w-[100px] truncate text-[11px] font-bold text-foreground sm:text-xs">
                    {getDisplayName(player.displayName, player.username)}
                </p>
                <p className="text-[10px] font-medium text-foreground/50">
                    KD {displayKd}
                </p>
            </div>
        </div>
    );
});

/**
 * Top-3 podium display with centered first place.
 */
export function PlayerPodium({
    players,
    onPlayerClick,
}: {
    players: PlayerDTO[];
    onPlayerClick: (id: string) => void;
}) {
    if (players.length < 3) return null;

    return (
        <div className="flex items-end justify-center gap-3 py-4 sm:gap-6 sm:py-6">
            {[2, 1, 3].map((pos) => (
                <PodiumCard
                    key={players[pos - 1].id}
                    player={players[pos - 1]}
                    position={pos as 1 | 2 | 3}
                    onPlayerClick={onPlayerClick}
                />
            ))}
        </div>
    );
}
