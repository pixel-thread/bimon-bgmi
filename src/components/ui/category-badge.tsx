"use client";

import { Chip } from "@heroui/react";

type NormalizedCategory = "bot" | "ultra noob" | "noob" | "pro" | "ultra pro" | "legend";

const CATEGORY_DISPLAY: Record<NormalizedCategory, string> = {
    "bot": "Bot",
    "ultra noob": "Ultra Noob",
    "noob": "Noob",
    "pro": "Pro",
    "ultra pro": "Ultra Pro",
    "legend": "Legend",
};

const CATEGORY_STYLES: Record<NormalizedCategory, string> = {
    "bot": "bg-red-100 text-red-900 border-red-200 dark:bg-red-900/80 dark:text-red-100 dark:border-red-800",
    "ultra noob": "bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-900/80 dark:text-orange-100 dark:border-orange-800",
    "noob": "bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-900/80 dark:text-yellow-100 dark:border-yellow-800",
    "pro": "bg-green-100 text-green-900 border-green-200 dark:bg-green-900/80 dark:text-green-100 dark:border-green-800",
    "ultra pro": "badge-glow-ultrapro",
    "legend": "badge-glow-legend",
};

function normalizeCategory(category: string): NormalizedCategory {
    const normalized = category
        .toLowerCase()
        .replace(/_/g, " ")
        .trim();

    if (normalized in CATEGORY_STYLES) {
        return normalized as NormalizedCategory;
    }
    return "bot";
}

interface CategoryBadgeProps {
    category: string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function CategoryBadge({ category, className, size = "sm" }: CategoryBadgeProps) {
    const normalized = normalizeCategory(category);
    const style = CATEGORY_STYLES[normalized];
    const label = CATEGORY_DISPLAY[normalized];

    return (
        <span
            className={`
                inline-flex items-center rounded-full border font-semibold
                ${size === "sm" ? "text-[10px] px-2 py-0.5" : size === "md" ? "text-xs px-2.5 py-1" : "text-sm px-3 py-1"}
                ${style}
                ${className || ""}
            `}
        >
            {label}
        </span>
    );
}

export { normalizeCategory, CATEGORY_STYLES, CATEGORY_DISPLAY };
export type { NormalizedCategory };
