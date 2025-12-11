"use client";

import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";

// Normalized category type (lowercase)
type NormalizedCategory = "bot" | "ultra noob" | "noob" | "pro" | "ultra pro" | "legend";

// Category display names
const CATEGORY_DISPLAY: Record<NormalizedCategory, string> = {
    "bot": "Bot",
    "ultra noob": "Ultra Noob",
    "noob": "Noob",
    "pro": "Pro",
    "ultra pro": "Ultra Pro",
    "legend": "Legend",
};

// Category short codes with emojis
const CATEGORY_SHORT: Record<NormalizedCategory, { full: string; icon: string }> = {
    "bot": { full: "🔴 B", icon: "🔴" },
    "ultra noob": { full: "🔴 UN", icon: "🔴" },
    "noob": { full: "🟡 N", icon: "🟡" },
    "pro": { full: "🟢 P", icon: "🟢" },
    "ultra pro": { full: "🟣 UP", icon: "🟣" },
    "legend": { full: "👑 L", icon: "👑" },
};

// Category styles
const CATEGORY_STYLES: Record<NormalizedCategory, string> = {
    "bot": "bg-red-100 text-red-900 border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-800",
    "ultra noob": "bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-900 dark:text-orange-100 dark:border-orange-800",
    "noob": "bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-800",
    "pro": "bg-green-100 text-green-900 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800",
    "ultra pro": "badge-glow-ultrapro",
    "legend": "badge-glow-legend",
};

/**
 * Normalize category string to lowercase format
 * Handles: "LEGEND", "Legend", "legend", "ULTRA_PRO", "Ultra Pro", etc.
 */
function normalizeCategory(category: string): NormalizedCategory {
    const normalized = category
        .toLowerCase()
        .replace(/_/g, " ") // ULTRA_PRO -> ultra pro
        .trim();

    if (normalized in CATEGORY_STYLES) {
        return normalized as NormalizedCategory;
    }
    return "bot"; // fallback
}

interface CategoryBadgeProps {
    /** Category string - can be any format (LEGEND, legend, Legend, ULTRA_PRO, etc.) */
    category: string;
    /** Display mode: 'full' shows full name, 'short' shows emoji + abbreviation, 'icon' shows only emoji */
    mode?: "full" | "short" | "icon";
    /** Additional class names */
    className?: string;
    /** Badge size */
    size?: "xs" | "sm" | "md";
}

export function CategoryBadge({
    category,
    mode = "full",
    className,
    size = "sm"
}: CategoryBadgeProps) {
    const normalized = normalizeCategory(category);
    const style = CATEGORY_STYLES[normalized];
    const isPremium = normalized === "legend" || normalized === "ultra pro";

    const sizeClasses = {
        xs: "text-[10px] px-1 py-0",
        sm: "text-xs px-1.5 py-0.5",
        md: "text-sm px-2 py-1",
    };

    const getContent = () => {
        switch (mode) {
            case "icon":
                return CATEGORY_SHORT[normalized].icon;
            case "short":
                return (
                    <>
                        <span className="hidden sm:inline">{CATEGORY_SHORT[normalized].full}</span>
                        <span className="sm:hidden">{CATEGORY_SHORT[normalized].icon}</span>
                    </>
                );
            case "full":
            default:
                return CATEGORY_DISPLAY[normalized];
        }
    };

    return (
        <Badge
            variant={isPremium ? "default" : "outline"}
            className={cn(
                sizeClasses[size],
                style,
                isPremium && "border-0",
                className
            )}
        >
            {getContent()}
        </Badge>
    );
}

// Export utilities for use elsewhere
export { normalizeCategory, CATEGORY_STYLES, CATEGORY_DISPLAY, CATEGORY_SHORT };
export type { NormalizedCategory };
