"use client";

import {
    Input,
    Button,
    Select,
    SelectItem,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Chip,
} from "@heroui/react";
import { Search, SlidersHorizontal, MapPin, ChevronRight } from "lucide-react";
import { type PlayerFilters } from "@/hooks/use-player-filters";
import { useQuery } from "@tanstack/react-query";
import { GAME } from "@/lib/game-config";

interface LocationItem {
    id: string;
    name: string;
}

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
 * Contains: search input, filter popover, and location drill-down chips.
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
    locationState,
    setLocationState,
    locationDistrict,
    setLocationDistrict,
    locationTown,
    setLocationTown,
    hasActiveFilters,
    resetFilters,
    onFilterOpen,
}: PlayerFilters) {
    const totalPlayers = Object.values(tierCounts).reduce((a, b) => a + b, 0);

    // Fetch location options from DB for drill-down chips
    const { data: states = [] } = useQuery<LocationItem[]>({
        queryKey: ["locations", "states"],
        queryFn: async () => {
            const res = await fetch("/api/locations?level=states");
            if (!res.ok) return [];
            return (await res.json()).data ?? [];
        },
        staleTime: 60_000,
    });

    // Find selected state's ID for fetching districts
    const selectedStateId = states.find((s) => s.name === locationState)?.id;

    const { data: districts = [] } = useQuery<LocationItem[]>({
        queryKey: ["locations", "districts", selectedStateId],
        queryFn: async () => {
            const res = await fetch(`/api/locations?level=districts&stateId=${selectedStateId}`);
            if (!res.ok) return [];
            return (await res.json()).data ?? [];
        },
        staleTime: 60_000,
        enabled: !!selectedStateId,
    });

    const selectedDistrictId = districts.find((d) => d.name === locationDistrict)?.id;

    const { data: towns = [] } = useQuery<LocationItem[]>({
        queryKey: ["locations", "towns", selectedDistrictId],
        queryFn: async () => {
            const res = await fetch(`/api/locations?level=towns&districtId=${selectedDistrictId}`);
            if (!res.ok) return [];
            return (await res.json()).data ?? [];
        },
        staleTime: 60_000,
        enabled: !!selectedDistrictId,
    });

    // Current drill-down level and next options
    const locationLevel = locationTown ? 3 : locationDistrict ? 2 : locationState ? 1 : 0;
    const nextOptions: LocationItem[] =
        locationLevel === 0
            ? states
            : locationLevel === 1
              ? districts
              : locationLevel === 2
                ? towns
                : [];

    return (
        <div className="space-y-2">
            {/* Search + filter button */}
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
                                    classNames={{
                                        trigger: "bg-default-100",
                                        value: "text-foreground",
                                    }}
                                    onSelectionChange={(keys) => {
                                        const val = Array.from(keys)[0] as string;
                                        if (val) {
                                            setSortBy(val);
                                            setSortOrder("desc");
                                        }
                                    }}
                                    aria-label="Sort by"
                                >
                                    {(GAME.features.hasBR
                                        ? [
                                            { key: "kd", label: "K/D Ratio" },
                                            { key: "kills", label: "Total Kills" },
                                        ]
                                        : [
                                            { key: "wins", label: "Wins" },
                                            { key: "winRate", label: "Win Rate" },
                                        ]
                                    ).concat([
                                        { key: "balance", label: `Balance (${GAME.currency})` },
                                        { key: "matches", label: "Matches Played" },
                                    ]).map(item => (
                                        <SelectItem key={item.key} textValue={item.label}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
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

            {/* Location filter chips — drill-down: State → District → Town */}
            {(states.length > 0 || locationState) && (
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
                    <MapPin className="h-3.5 w-3.5 text-foreground/40 shrink-0" />

                    {/* Active selection breadcrumbs */}
                    {locationState && (
                        <Chip
                            size="sm"
                            variant="flat"
                            color="primary"
                            onClose={() => {
                                setLocationState("");
                                setLocationDistrict("");
                                setLocationTown("");
                            }}
                            className="shrink-0"
                        >
                            {locationState}
                        </Chip>
                    )}
                    {locationState && locationDistrict && (
                        <>
                            <ChevronRight className="h-3 w-3 text-foreground/30 shrink-0" />
                            <Chip
                                size="sm"
                                variant="flat"
                                color="primary"
                                onClose={() => {
                                    setLocationDistrict("");
                                    setLocationTown("");
                                }}
                                className="shrink-0"
                            >
                                {locationDistrict}
                            </Chip>
                        </>
                    )}
                    {locationState && locationDistrict && locationTown && (
                        <>
                            <ChevronRight className="h-3 w-3 text-foreground/30 shrink-0" />
                            <Chip
                                size="sm"
                                variant="flat"
                                color="primary"
                                onClose={() => setLocationTown("")}
                                className="shrink-0"
                            >
                                {locationTown}
                            </Chip>
                        </>
                    )}

                    {/* Next-level options */}
                    {nextOptions.length > 0 && (
                        <>
                            {locationLevel > 0 && (
                                <ChevronRight className="h-3 w-3 text-foreground/30 shrink-0" />
                            )}
                            {nextOptions.map((opt) => (
                                <Chip
                                    key={opt.id}
                                    size="sm"
                                    variant="bordered"
                                    className="shrink-0 cursor-pointer hover:bg-primary/10 transition-colors"
                                    onClick={() => {
                                        if (locationLevel === 0) setLocationState(opt.name);
                                        else if (locationLevel === 1) setLocationDistrict(opt.name);
                                        else if (locationLevel === 2) setLocationTown(opt.name);
                                    }}
                                >
                                    {opt.name}
                                </Chip>
                            ))}
                        </>
                    )}

                    {/* Reset to all */}
                    {locationState && (
                        <Chip
                            size="sm"
                            variant="bordered"
                            className="shrink-0 cursor-pointer hover:bg-default-100 transition-colors"
                            onClick={() => {
                                setLocationState("");
                                setLocationDistrict("");
                                setLocationTown("");
                            }}
                        >
                            ✕ All
                        </Chip>
                    )}
                </div>
            )}
        </div>
    );
}
