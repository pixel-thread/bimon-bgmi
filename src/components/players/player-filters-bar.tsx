"use client";

import {
    Input,
    Button,
    Select,
    SelectItem,
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@heroui/react";
import { Search, SlidersHorizontal } from "lucide-react";
import { type PlayerFilters } from "@/hooks/use-player-filters";

const TIERS = [
    { key: "All", label: "All Tiers" },
    { key: "LEGEND", label: "Legend" },
    { key: "ULTRA_PRO", label: "Ultra Pro" },
    { key: "PRO", label: "Pro" },
    { key: "NOOB", label: "Noob" },
    { key: "ULTRA_NOOB", label: "Ultra Noob" },
    { key: "BOT", label: "Bot" },
] as const;

/**
 * Reusable search + filter popover bar for player pages.
 * Contains: search input, and a filter popover with season, category, sort, order, and reset.
 * Seasons & tier counts are lazy-loaded when the popover opens.
 */
export function PlayerFiltersBar({
    search,
    setSearch,
    tier,
    setTier,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    season,
    setSeason,
    seasons,
    tierCounts,
    hasActiveFilters,
    resetFilters,
    onFilterOpen,
}: PlayerFilters) {
    const totalPlayers = Object.values(tierCounts).reduce((a, b) => a + b, 0);

    return (
        <div className="flex items-center gap-2">
            <Input
                placeholder="Search players..."
                value={search}
                onValueChange={setSearch}
                startContent={<Search className="h-4 w-4 text-default-400" />}
                classNames={{
                    inputWrapper: "bg-default-100 border-none shadow-none",
                }}
                className="flex-1 sm:max-w-xs"
                size="sm"
                isClearable
                onClear={() => setSearch("")}
            />
            <Popover placement="bottom-end" onOpenChange={(open) => { if (open) onFilterOpen(); }}>
                <PopoverTrigger>
                    <Button
                        size="sm"
                        variant="flat"
                        startContent={<SlidersHorizontal className="h-4 w-4" />}
                        className="bg-default-100 shrink-0"
                    >
                        <span className="hidden sm:inline">Filters</span>
                        {hasActiveFilters && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                                !
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4">
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold">Filters & Sort</h4>

                        {/* Season */}
                        {seasons.length > 0 && season && (
                            <div className="space-y-1.5">
                                <label className="text-xs text-foreground/50">Season</label>
                                <Select
                                    size="sm"
                                    items={seasons}
                                    selectedKeys={[season]}
                                    disallowEmptySelection
                                    onSelectionChange={(keys) => {
                                        const val = Array.from(keys)[0] as string;
                                        if (val) setSeason(val);
                                    }}
                                    aria-label="Season"
                                >
                                    {(s) => (
                                        <SelectItem key={s.id} textValue={`${s.name}${s.isCurrent ? " ✦" : ""}`}>
                                            {s.name}{s.isCurrent ? " ✦" : ""}
                                        </SelectItem>
                                    )}
                                </Select>
                            </div>
                        )}

                        {/* Category */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-foreground/50">Category</label>
                            <Select
                                size="sm"
                                selectedKeys={[tier]}
                                disallowEmptySelection
                                onSelectionChange={(keys) => {
                                    const val = Array.from(keys)[0] as string;
                                    if (val) setTier(val);
                                }}
                                aria-label="Category"
                            >
                                {TIERS.map((t) => {
                                    const count = t.key === "All"
                                        ? totalPlayers
                                        : tierCounts[t.key] ?? 0;
                                    return (
                                        <SelectItem key={t.key} textValue={t.label}>
                                            <div className="flex items-center justify-between w-full">
                                                <span>{t.label}</span>
                                                {count > 0 && (
                                                    <span className="text-xs text-foreground/40">{count}</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </Select>
                        </div>

                        {/* Sort by */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-foreground/50">Sort by</label>
                            <Select
                                size="sm"
                                selectedKeys={[sortBy]}
                                disallowEmptySelection
                                onSelectionChange={(keys) => {
                                    const val = Array.from(keys)[0] as string;
                                    if (val) {
                                        setSortBy(val);
                                        setSortOrder("desc");
                                    }
                                }}
                                aria-label="Sort by"
                            >
                                <SelectItem key="kd">K/D Ratio</SelectItem>
                                <SelectItem key="balance">Balance (UC)</SelectItem>
                                <SelectItem key="matches">Matches Played</SelectItem>
                                <SelectItem key="kills">Total Kills</SelectItem>
                            </Select>
                        </div>

                        {/* Order */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-foreground/50">Order</label>
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    variant={sortOrder === "desc" ? "solid" : "flat"}
                                    color={sortOrder === "desc" ? "primary" : "default"}
                                    onPress={() => setSortOrder("desc")}
                                    className="flex-1"
                                >
                                    Highest First
                                </Button>
                                <Button
                                    size="sm"
                                    variant={sortOrder === "asc" ? "solid" : "flat"}
                                    color={sortOrder === "asc" ? "primary" : "default"}
                                    onPress={() => setSortOrder("asc")}
                                    className="flex-1"
                                >
                                    Lowest First
                                </Button>
                            </div>
                        </div>

                        {/* Reset */}
                        {hasActiveFilters && (
                            <Button
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={resetFilters}
                                className="w-full"
                            >
                                Reset to Default
                            </Button>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
