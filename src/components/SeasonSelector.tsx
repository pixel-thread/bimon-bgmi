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
import { useGetSeasons } from "../hooks/season/useGetSeasons";

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
  const { isFetching, data, isLoading } = useGetSeasons();

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

  return (
    <Select
      value={selectedSeason}
      disabled={isFetching || isLoading}
      onValueChange={onSeasonChange}
    >
      <SelectTrigger className={triggerClasses}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showAllSeasons && <SelectItem value="all">All Seasons</SelectItem>}
        {data?.map((season) => (
          <SelectItem key={season.id} value={season.id}>
            {season.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
