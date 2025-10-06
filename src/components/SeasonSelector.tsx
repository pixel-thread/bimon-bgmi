"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Season } from "@/src/lib/types";
import { toast } from "sonner";

interface SeasonSelectorProps {
  selectedSeason: string;
  onSeasonChange: (seasonId: string) => void;
  className?: string;
  placeholder?: string;
  showAllSeasons?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "green" | "blue" | "purple";
}

export function SeasonSelector({
  selectedSeason,
  onSeasonChange,
  className = "",
  placeholder = "Season",
  showAllSeasons = true,
  size = "md",
  variant = "green",
}: SeasonSelectorProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSeasons = async () => {
      setIsLoading(true);
      try {
        const seasonsSnapshot = await getDocs(collection(db, "seasons"));
        const seasonsData = seasonsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Season)
        );

        // Sort by creation date, newest first
        seasonsData.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSeasons(seasonsData);

        // If seasons exist and no specific season is selected, default to active season
        if (selectedSeason === "all" && seasonsData.length > 0) {
          const activeSeason = seasonsData.find((season) => season.isActive);
          if (activeSeason) {
            onSeasonChange(activeSeason.id);
          }
        }
      } catch (error) {
        console.error("Error fetching seasons:", error);
        toast.error("Failed to load seasons");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeasons();
  }, []);

  // Size configurations
  const sizeClasses = {
    sm: "h-8 text-sm px-2",
    md: "h-10 px-3",
    lg: "h-11 px-3",
  };

  const triggerClasses = `
    ${sizeClasses[size]} 
    rounded-lg w-fit min-w-[100px] 
    ${className}
  `.trim();

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={triggerClasses}>
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={selectedSeason} onValueChange={onSeasonChange}>
      <SelectTrigger className={triggerClasses}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showAllSeasons && <SelectItem value="all">All Seasons</SelectItem>}
        {seasons.map((season) => (
          <SelectItem key={season.id} value={season.id}>
            {season.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
