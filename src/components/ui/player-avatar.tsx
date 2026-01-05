"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { getDisplayName } from "@/src/utils/bgmiDisplay";

type PlayerAvatarProps = {
    /** Custom image URL from character gallery - highest priority */
    characterImageUrl?: string | null;
    /** Google/Clerk image URL - fallback if no custom image */
    imageUrl?: string | null;
    /** Player's display name */
    displayName?: string | null;
    /** Player's username - fallback for display name */
    userName?: string | null;
    /** Size of the avatar */
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    /** Additional className for the avatar */
    className?: string;
    /** Whether to show user icon as fallback instead of initials */
    showUserIcon?: boolean;
    /** Whether the player is banned - shows banned stamp overlay */
    isBanned?: boolean;
};

const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-14 w-14",
};

const textSizeClasses = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
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
 * Reusable player avatar component that handles image priority:
 * 1. Custom character image (if set)
 * 2. Google/Clerk image (default)
 * 3. Initials fallback
 */
export function PlayerAvatar({
    characterImageUrl,
    imageUrl,
    displayName,
    userName,
    size = "md",
    className,
    showUserIcon = false,
    isBanned = false,
}: PlayerAvatarProps) {
    // Priority: characterImage > imageUrl > fallback
    const imageSrc = characterImageUrl || imageUrl || undefined;
    const name = getDisplayName(displayName, userName);
    const initials = name?.substring(0, 2).toUpperCase() || "??";

    return (
        <div className="relative">
            <Avatar className={cn(sizeClasses[size], className)}>
                <AvatarImage src={imageSrc} alt={name || "Player"} />
                <AvatarFallback
                    className={cn(
                        "bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold",
                        textSizeClasses[size]
                    )}
                >
                    {showUserIcon ? (
                        <User className={cn("text-gray-400", iconSizeClasses[size])} />
                    ) : (
                        initials
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

