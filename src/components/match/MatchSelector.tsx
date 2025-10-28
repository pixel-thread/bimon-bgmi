"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useSeasonStore } from "@/src/store/season";
import { useTournamentStore } from "@/src/store/tournament";
import { SelectGroup } from "@radix-ui/react-select";
import { Ternary } from "../common/Ternary";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import { useMatches } from "@/src/hooks/match/useMatches";
import { Button } from "../ui/button";
import { PlusIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { ADMIN_MATCH_ENDPOINTS } from "@/src/lib/endpoints/admin/match";
import { toast } from "sonner";

interface TournamentSelectorProps {
  className?: string;
  isShowNewMatch?: boolean;
}

export default function MatchSelector({ className }: TournamentSelectorProps) {
  const { setMatchId, matchId } = useMatchStore();

  const { seasonId } = useSeasonStore();

  const { tournamentId } = useTournamentStore();
  const queryclient = useQueryClient();
  const { data: matches } = useMatches();

  const onSelect = (value: string | null) => {
    setMatchId(value || "");
  };

  const { mutate: onClickAddNewMatch } = useMutation({
    mutationFn: () =>
      http.post<{ id: string }>(ADMIN_MATCH_ENDPOINTS.POST_ADD_NEW_MATCH, {
        tournamentId,
        seasonId,
      }),
    onSuccess: (data) => {
      if (data.success) {
        queryclient.invalidateQueries({ queryKey: ["match", tournamentId] });
        onSelect(data?.data?.id || "");
        toast.success(data.message);
        return data;
      }
      toast.success(data.message);
      return data;
    },
  });

  const isMatchExist = matches?.length && matches?.length > 0 ? true : false;

  return (
    <Select
      value={matchId || ""}
      onValueChange={(value) => onSelect(value || null)}
    >
      <SelectTrigger
        disabled={!seasonId || !tournamentId}
        className={className || "w-fit min-w-[200px]"}
      >
        <SelectValue placeholder="Select Match" />
      </SelectTrigger>
      <SelectContent className="max-h-[200px] overflow-y-auto">
        <Ternary
          condition={isMatchExist}
          trueComponent={
            <>
              {matches?.map((match, index) => (
                <SelectItem key={match.id} value={match.id}>
                  Match {index + 1}
                </SelectItem>
              ))}
              <Button
                onClick={() => onClickAddNewMatch()}
                className="w-full text-start flex"
                variant={"ghost"}
              >
                <PlusIcon />
              </Button>
            </>
          }
          falseComponent={
            <SelectGroup>
              <SelectLabel>No Match</SelectLabel>
              <Button
                onClick={() => onClickAddNewMatch()}
                className="w-full text-start flex"
                variant={"ghost"}
              >
                <PlusIcon />
              </Button>
            </SelectGroup>
          }
        />
      </SelectContent>
    </Select>
  );
}
