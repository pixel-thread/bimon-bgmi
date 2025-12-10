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
import { useAppContext } from "../hooks/context/useAppContext";
import { useAuth } from "../hooks/context/auth/useAuth";
import { CreateSeasonDialog } from "./admin/season/create-season-dialog";
import { FiPlus } from "react-icons/fi";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

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
  const { activeSeason } = useAppContext();
  const { setTournamentId } = useTournamentStore();
  const { setMatchId } = useMatchStore();
  const { isFetching, data, isLoading } = useGetSeasons();
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

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
          className={cn(className)}
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
