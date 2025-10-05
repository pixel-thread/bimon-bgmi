"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface PlayerSearchInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: "ultraNoobs" | "noobs" | "pros" | "ultraPros" | "solo";
}

export function PlayerSearchInput({
  searchQuery,
  setSearchQuery,
  activeTab,
}: PlayerSearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={
          activeTab === "solo"
            ? "Search players to add to solo..."
            : "Search players..."
        }
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 pr-20 sm:pr-10 h-11 sm:h-9 text-base sm:text-sm"
        aria-label="Search players by name"
      />
      {activeTab === "solo" && !searchQuery && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:block">
          <Badge variant="outline" className="text-xs">
            Type to search
          </Badge>
        </div>
      )}
    </div>
  );
}
