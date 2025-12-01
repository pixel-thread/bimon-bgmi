"use client";

import React, { useEffect, useState } from "react";
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
import { useTournamentStore } from "../store/tournament";
import { useMatchStore } from "../store/match/useMatchStore";
import { useActiveSeason } from "../hooks/season/useActiveSeason";
import { useAuth } from "../hooks/context/auth/useAuth";
import { CreateSeasonDialog } from "./admin/season/create-season-dialog";
import { FiPlus } from "react-icons/fi";
import { Button } from "./ui/button";

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
  size = "md",
}: SeasonSelectorProps) {
  const { setSeasonId, seasonId: selectedSeason } = useSeasonStore();
  const { isSuperAdmin } = useAuth();
  const { data: activeSeason } = useActiveSeason();
  const { setTournamentId } = useTournamentStore();
  const { setMatchId } = useMatchStore();
  const { isFetching, data, isLoading } = useGetSeasons();
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

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

  const onValueChange = (value: string) => {
    setTournamentId("");
    setMatchId("");
    setSeasonId(value);
  };

  useEffect(() => {
    if (selectedSeason === "" && activeSeason) {
      setSeasonId(activeSeason?.id);
    }
  }, [selectedSeason, activeSeason]);

  return (
    <>
      <Select
        value={selectedSeason === "" ? activeSeason?.id : selectedSeason || ""}
        defaultValue={
          selectedSeason === "" ? activeSeason?.id : selectedSeason || ""
        }
        disabled={isFetching || isLoading}
        onValueChange={onValueChange}
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
          {isSuperAdmin && (
            <SelectGroup>
              <SelectLabel>Manage Seasons</SelectLabel>
              <Button className="w-full" onClick={() => setIsDialogOpen(true)}>
                <FiPlus className="mr-2" />
                Create Season
              </Button>
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
      <CreateSeasonDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
