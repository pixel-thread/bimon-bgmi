"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useGetSeasons } from "../hooks/season/useGetSeasons";
import { useSeasonStore } from "../store/season";
import { Ternary } from "./common/Ternary";
import { SelectGroup } from "@radix-ui/react-select";

interface SeasonSelectorProps {
  className?: string;
  placeholder?: string;
  showAllSeasons?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "green" | "blue" | "purple";
}

export function SeasonSelector({
  className = "",
  placeholder = "Season",
  showAllSeasons = true,
  size = "md",
  variant = "green",
}: SeasonSelectorProps) {
  const { setSeasonId: onSeasonChange, seasonId: selectedSeason } =
    useSeasonStore();
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
      <SelectTrigger
        disabled={isFetching || isLoading}
        className={triggerClasses}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <Ternary
          condition={data?.length && data?.length > 0 ? true : false}
          trueComponent={
            <>
              {showAllSeasons && (
                <SelectItem value="all">All Seasons</SelectItem>
              )}
              {data?.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name}
                </SelectItem>
              ))}
            </>
          }
          falseComponent={
            <SelectGroup>
              <SelectLabel>No Seasons</SelectLabel>
            </SelectGroup>
          }
        />
      </SelectContent>
    </Select>
  );
}
