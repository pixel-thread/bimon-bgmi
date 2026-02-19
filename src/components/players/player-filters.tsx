"use client";

import { Input, Select, SelectItem, Button } from "@heroui/react";
import { Search, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

const tiers = ["All", "S", "A", "B", "C", "D", "Unranked"];

const sortOptions = [
    { label: "K/D Ratio", value: "kd" },
    { label: "Total Kills", value: "kills" },
    { label: "Matches", value: "matches" },
    { label: "Name", value: "name" },
    { label: "Balance", value: "balance" },
];

interface PlayerFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    tier: string;
    onTierChange: (value: string) => void;
    sortBy: string;
    onSortByChange: (value: string) => void;
    sortOrder: "asc" | "desc";
    onSortOrderChange: (value: "asc" | "desc") => void;
}

export function PlayerFilters({
    search,
    onSearchChange,
    tier,
    onTierChange,
    sortBy,
    onSortByChange,
    sortOrder,
    onSortOrderChange,
}: PlayerFiltersProps) {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="space-y-3">
            {/* Search + toggle */}
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Search players..."
                    value={search}
                    onValueChange={onSearchChange}
                    startContent={<Search className="h-4 w-4 text-default-400" />}
                    classNames={{
                        inputWrapper:
                            "bg-default-100 border-none shadow-none hover:bg-default-200 transition-colors",
                    }}
                    size="sm"
                    isClearable
                    onClear={() => onSearchChange("")}
                />
                <Button
                    isIconOnly
                    size="sm"
                    variant={showFilters ? "solid" : "flat"}
                    color={showFilters ? "primary" : "default"}
                    onPress={() => setShowFilters(!showFilters)}
                    className="shrink-0"
                >
                    <SlidersHorizontal className="h-4 w-4" />
                </Button>
            </div>

            {/* Expandable filters */}
            {showFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    {/* Tier chips */}
                    <div className="flex flex-wrap gap-1">
                        {tiers.map((t) => (
                            <Button
                                key={t}
                                size="sm"
                                variant={tier === t ? "solid" : "flat"}
                                color={tier === t ? "primary" : "default"}
                                onPress={() => onTierChange(t)}
                                className="min-w-0 px-3 text-xs"
                            >
                                {t}
                            </Button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="ml-auto flex items-center gap-2">
                        <Select
                            selectedKeys={[sortBy]}
                            onSelectionChange={(keys) => {
                                const key = Array.from(keys)[0] as string;
                                if (key) onSortByChange(key);
                            }}
                            size="sm"
                            className="w-32"
                            classNames={{
                                trigger: "bg-default-100 border-none shadow-none min-h-8 h-8",
                            }}
                            aria-label="Sort by"
                        >
                            {sortOptions.map((opt) => (
                                <SelectItem key={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </Select>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() =>
                                onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")
                            }
                            className="shrink-0"
                        >
                            <ArrowUpDown
                                className={`h-4 w-4 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""
                                    }`}
                            />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
