"use client";
import React from "react";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Search } from "lucide-react";
import { SeasonSelector } from "../SeasonSelector";

interface PlayerFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
  selectedTier: string;
  onTierChange: (tier: string) => void;
  sortBy: "name" | "kd" | "kills" | "matches" | "balance" | "banned";
  onSortByChange: (
    sortBy: "name" | "kd" | "kills" | "matches" | "balance" | "banned"
  ) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (order: "asc" | "desc") => void;
}

export function PlayerFilters({
  searchQuery,
  onSearchChange,
  selectedSeason,
  onSeasonChange,
  selectedTier,
  onTierChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: PlayerFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
      {/* Left side: Search and Season */}
      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11 pl-10 pr-4"
          />
        </div>
        <SeasonSelector
          selectedSeason={selectedSeason}
          onSeasonChange={onSeasonChange}
          className="h-11 w-full sm:w-40"
          showAllSeasons={true}
        />
      </div>

      {/* Right side: Filter dropdowns */}
      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
        <div className="flex gap-3">
          <Select value={selectedTier} onValueChange={onTierChange}>
            <SelectTrigger className="h-11 w-full sm:w-36">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              <SelectItem value="Ultra Noob">Ultra Noob</SelectItem>
              <SelectItem value="Noob">Noob</SelectItem>
              <SelectItem value="Pro">Pro</SelectItem>
              <SelectItem value="Ultra Pro">Ultra Pro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger
              className={`h-11 w-full sm:w-32 ${
                sortBy === "banned"
                  ? "text-red-600 dark:text-red-400 font-medium"
                  : ""
              }`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kd">K/D Ratio</SelectItem>
              <SelectItem value="kills">Total Kills</SelectItem>
              <SelectItem value="matches">Matches</SelectItem>
              <SelectItem value="balance">Balance</SelectItem>
              <SelectItem
                value="banned"
                className="text-red-600 dark:text-red-400 font-medium"
              >
                Banned
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={sortOrder} onValueChange={onSortOrderChange}>
          <SelectTrigger className="h-11 w-full sm:w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">High to Low</SelectItem>
            <SelectItem value="asc">Low to High</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
