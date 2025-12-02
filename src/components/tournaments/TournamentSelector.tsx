"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useTournamentStore } from "../../store/tournament";
import { useTournaments } from "../../hooks/tournament/useTournaments";
import { useSeasonStore } from "../../store/season";
import { Ternary } from "../common/Ternary";
import { SelectGroup } from "@radix-ui/react-select";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import { useEffect, useState } from "react";
import TournamentCreateModal from "../admin/tournaments/TournamentCreateModal";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { Button } from "../ui/button";
import { FiPlus } from "react-icons/fi";
import { cn } from "@/src/lib/utils";

interface TournamentSelectorProps {
  className?: string;
}

export default function TournamentSelector({
  className,
}: TournamentSelectorProps) {
  const { isSuperAdmin } = useAuth();
  const { setTournamentId, tournamentId } = useTournamentStore();
  const { setMatchId } = useMatchStore();
  const [createTournamentModal, setCreateTournamentModal] =
    useState<boolean>(false);
  const { data: allTournaments, isFetching } = useTournaments();

  const onSelect = (value: string | null) => {
    setMatchId("");
    setTournamentId(value || "");
  };

  const isTournamentExist =
    allTournaments?.length && allTournaments?.length > 0 ? true : false;

  if (isFetching) {
    return (
      <Select
        value={tournamentId}
        onValueChange={(value) => onSelect(value || null)}
      >
        <SelectTrigger disabled={true} className={cn(className, "w-fit")}>
          <SelectValue placeholder="Loading" />
        </SelectTrigger>
      </Select>
    );
  }
  return (
    <>
      <Select
        value={tournamentId || ""}
        onValueChange={(value) => onSelect(value || null)}
      >
        <SelectTrigger className={cn(className, "w-fit")}>
          <SelectValue placeholder="Tournament" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px] overflow-y-auto">
          <Ternary
            condition={isTournamentExist}
            trueComponent={
              <>
                {allTournaments?.map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </SelectItem>
                ))}
              </>
            }
            falseComponent={
              <SelectGroup>
                <SelectLabel>No Tournaments</SelectLabel>
              </SelectGroup>
            }
          />
          {isSuperAdmin && (
            <SelectGroup>
              <Button
                className="w-full"
                onClick={() => setCreateTournamentModal(!createTournamentModal)}
              >
                <FiPlus size={20} /> Create Tournament
              </Button>
            </SelectGroup>
          )}
        </SelectContent>
      </Select>

      <TournamentCreateModal
        showCreateModal={createTournamentModal}
        setShowCreateModal={setCreateTournamentModal}
      />
    </>
  );
}
