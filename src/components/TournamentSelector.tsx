"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Prisma } from "../lib/db/prisma/generated/prisma";
import { useTournamentStore } from "../store/tournament";
import { useTournaments } from "../hooks/tournament/useTournaments";
import { useSeasonStore } from "../store/season";

interface TournamentSelectorProps {
  selected: string | null;
  onSelect: (value: string | null) => void;
  className?: string;
  data: Prisma.TournamentGetPayload<{}>[];
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

  return (
    <Select
      value={tournamentId || ""}
      onValueChange={(value) => onSelect(value || null)}
    >
      <SelectTrigger className={className || "w-fit min-w-[200px]"}>
        <SelectValue placeholder="Select Tournament" />
      </SelectTrigger>
      <SelectContent className="max-h-[200px] overflow-y-auto">
        {allTournaments?.map((tournament) => (
          <SelectItem key={tournament.id} value={tournament.id}>
            {tournament.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
