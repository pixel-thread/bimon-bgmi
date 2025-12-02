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
import { useAuth } from "@/src/hooks/context/auth/useAuth";

interface TournamentSelectorProps {
  className?: string;
  isAllMatch?: boolean;
}

export default function MatchSelector({
  className,
  isAllMatch = true,
}: TournamentSelectorProps) {
  const { setMatchId, matchId } = useMatchStore();
  const { isSuperAdmin } = useAuth();
  const { seasonId } = useSeasonStore();

  const { tournamentId } = useTournamentStore();
  const { data: matches, isFetching, refetch } = useMatches();

  const onSelect = (value: string | null) => {
    setMatchId(value || "");
  };

  const { mutate: onClickAddNewMatch, isPending } = useMutation({
    mutationFn: () =>
      http.post<{ id: string }>(ADMIN_MATCH_ENDPOINTS.POST_ADD_NEW_MATCH, {
        tournamentId,
        seasonId,
      }),
    onSuccess: (data) => {
      if (data.success) {
        refetch();
        onSelect(data?.data?.id || "");
        toast.success(data.message);
        return data;
      }
      toast.success(data.message);
      return data;
    },
  });

  const isMatchExist = matches?.length && matches?.length > 0 ? true : false;

  if (isFetching || isPending) {
    return (
      <Select
        value={matchId}
        onValueChange={(value) => onSelect(value || null)}
      >
        <SelectTrigger
          disabled={true}
          className={className || "w-fit min-w-[200px]"}
        >
          <SelectValue placeholder="Loading" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={matchId} onValueChange={(value) => onSelect(value || null)}>
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
              {isAllMatch && <SelectItem value={"all"}>All Match</SelectItem>}
              {matches?.map((match, index) => (
                <SelectItem key={match.id} value={match.id}>
                  Match {index + 1}
                </SelectItem>
              ))}
              {isSuperAdmin && (
                <Button
                  onClick={() => onClickAddNewMatch()}
                  className="w-full text-start flex"
                >
                  <PlusIcon /> Create Match
                </Button>
              )}
            </>
          }
          falseComponent={
            <SelectGroup>
              <SelectLabel>No Match</SelectLabel>
              <Button
                onClick={() => onClickAddNewMatch()}
                className="w-full text-start flex"
              >
                <PlusIcon /> Create Match
              </Button>
            </SelectGroup>
          }
        />
      </SelectContent>
    </Select>
  );
}
