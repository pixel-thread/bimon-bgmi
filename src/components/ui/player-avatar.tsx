"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/src/lib/utils";

type PlayerAvatarProps = {
    /** Profile image URL (uploaded profile or Google) - for circle avatars */
    profileImageUrl?: string | null;
    /** Google/Clerk image URL - fallback if no profile image */
    imageUrl?: string | null;
    /** Player's display name */
    displayName?: string | null;
    /** Player's username - fallback for display name */
    userName?: string | null;
    /** Size of the avatar */
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    /** Additional className for the avatar */
    className?: string;
    /** Whether to show user icon as fallback instead of skeleton */
    showUserIcon?: boolean;
    /** Whether the player is banned - shows banned stamp overlay */
    isBanned?: boolean;
    /** @deprecated Use profileImageUrl instead. This prop is ignored. */
    characterImageUrl?: string | null;
};

const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-14 w-14",
};

const iconSizeClasses = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
};

const bannedStampSizeClasses = {
    xs: "text-[6px] px-1 py-0",
    sm: "text-[7px] px-1.5 py-0",
    md: "text-[8px] px-1.5 py-0.5",
    lg: "text-[10px] px-2 py-0.5",
    xl: "text-xs px-2 py-0.5",
};

/**
 * Reusable player avatar component for CIRCLE avatars.
 * Uses profile image (uploaded or Google), NOT character image.
 * Character image is only for 9:16 podium backgrounds.
 */
export function PlayerAvatar({
    profileImageUrl,
    imageUrl,
    displayName,
    userName,
    size = "md",
    className,
    showUserIcon = false,
    isBanned = false,
}: PlayerAvatarProps) {
    // Priority: profileImageUrl > imageUrl (Google) > skeleton fallback
    // NEVER use characterImageUrl for circle avatars
    const imageSrc = profileImageUrl || imageUrl || undefined;

    return (
        <div className="relative">
            <Avatar className={cn(sizeClasses[size], className)}>
                <AvatarImage src={imageSrc} alt={displayName || userName || "Player"} />
                <AvatarFallback
                    className={cn(
                        "bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600"
                    )}
                >
                    {showUserIcon ? (
                        <User className={cn("text-gray-400", iconSizeClasses[size])} />
                    ) : (
                        // Skeleton shimmer effect
                        <div className="w-full h-full animate-pulse bg-gradient-to-r from-zinc-300 via-zinc-200 to-zinc-300 dark:from-zinc-600 dark:via-zinc-500 dark:to-zinc-600 rounded-full" />
                    )}
                </AvatarFallback>
            </Avatar>
            {/* Banned Stamp Overlay */}
            {isBanned && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 rounded-full" />
                    <div className={cn(
                        "relative rotate-[-20deg] bg-red-600 text-white font-bold rounded border-2 border-red-800 shadow-lg uppercase tracking-wider",
                        bannedStampSizeClasses[size]
                    )}>
                        Banned
                    </div>
                </div>
            )}
        </div>
    );
}


