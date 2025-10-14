"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useTournamentStore } from "../store/tournament";
import { useTournaments } from "../hooks/tournament/useTournaments";
import { useSeasonStore } from "../store/season";
import { Ternary } from "./common/Ternary";
import { SelectGroup } from "@radix-ui/react-select";

interface TournamentSelectorProps {
  className?: string;
}
export default function TournamentSelector({
  className,
}: TournamentSelectorProps) {
  const { setTournamentId, tournamentId } = useTournamentStore();

  const { seasonId } = useSeasonStore();

  const { data: allTournaments } = useTournaments({ seasonId });

  const onSelect = (value: string | null) => {
    setTournamentId(value || "");
  };

  const isTournamentExist =
    allTournaments?.length && allTournaments?.length > 0 ? true : false;
  return (
    <Select
      value={tournamentId || ""}
      onValueChange={(value) => onSelect(value || null)}
    >
      <SelectTrigger
        disabled={!seasonId}
        className={className || "w-fit min-w-[200px]"}
      >
        <SelectValue placeholder="Select Tournament" />
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
      </SelectContent>
    </Select>
  );
}
