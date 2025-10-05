"use client";

import { useTournaments } from "@/hooks/useTournaments";
import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TournamentSelectorProps {
  selected: string | null;
  onSelect: (value: string | null) => void;
  className?: string;
  tournaments?: any[]; // Accept tournaments as prop for filtering
}

export default function TournamentSelector({
  selected,
  onSelect,
  className,
  tournaments: propTournaments,
}: TournamentSelectorProps) {
  const { tournaments: allTournaments } = useTournaments();
  
  // Use prop tournaments if provided, otherwise use all tournaments
  const tournaments = propTournaments || allTournaments;

  // Reverse tournaments order (assuming newly added ones are last in the array)
  const sortedTournaments = useMemo(() => {
    return [...tournaments].reverse();
  }, [tournaments]);

  // Display label with truncation for long tournament names
  const displayLabel = selected
    ? sortedTournaments.find((t) => t.id === selected)?.title || "Select Tournament"
    : "Select Tournament";

  // Truncate long tournament names for display
  const truncatedLabel = displayLabel.length > 25 
    ? displayLabel.substring(0, 22) + "..." 
    : displayLabel;

  return (
    <Select value={selected || ""} onValueChange={(value) => onSelect(value || null)}>
      <SelectTrigger className={className || "w-fit min-w-[200px]"}>
        <SelectValue placeholder="Select Tournament">
          <span className="truncate block max-w-full">{truncatedLabel}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[200px] overflow-y-auto">
        {sortedTournaments.map((tournament) => (
          <SelectItem
            key={tournament.id}
            value={tournament.id}
          >
            {tournament.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}