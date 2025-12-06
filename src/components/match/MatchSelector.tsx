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
import { Loader2, PlusIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { ADMIN_MATCH_ENDPOINTS } from "@/src/lib/endpoints/admin/match";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { cn } from "@/src/lib/utils";

interface TournamentSelectorProps {
  className?: string;
  isAllMatch?: boolean;
}

export default function MatchSelector({
  className,
  isAllMatch = true,
}: TournamentSelectorProps) {
  const { setMatchId, setMatch, matchId } = useMatchStore();
  const { isSuperAdmin } = useAuth();
  const { seasonId } = useSeasonStore();

  const { tournamentId } = useTournamentStore();
  const { data: matches, isLoading, refetch } = useMatches();

  const onSelect = (value: string | null) => {
    const id = value || "";
    if (id === "all") {
      setMatch("all", null);
      return;
    }
    // compute a stable 1-based match number from the current list ordering
    const idx = matches?.findIndex((m) => m.id === id) ?? -1;
    const number = idx >= 0 ? idx + 1 : null;
    setMatch(id, number);
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

  // Only show loading on initial load, not during background polling
  if (isLoading && !matches) {
    return (
      <Select
        value={matchId}
        onValueChange={(value) => onSelect(value || null)}
      >
        <SelectTrigger disabled={true} className={className}>
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={matchId} onValueChange={(value) => onSelect(value || null)}>
      <SelectTrigger
        disabled={!seasonId || !tournamentId || isPending}
        className={cn(className, "w-fit")}
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating...
          </span>
        ) : (
          <SelectValue placeholder="Select Match" />
        )}
      </SelectTrigger>
      <SelectContent className="max-h-[200px] overflow-y-auto">
        <Ternary
          condition={isMatchExist}
          trueComponent={
            <>
              {isAllMatch && <SelectItem value={"all"}>All Match</SelectItem>}
              {matches?.map((match, index) => (
                <SelectItem key={match.id} value={match.id}>
                  <span className="flex items-center gap-1.5">
                    Match {index + 1}
                    {match.status === "PROCESSING" && (
                      <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    )}
                  </span>
                </SelectItem>
              ))}
              {isSuperAdmin && (
                <Button
                  onClick={() => onClickAddNewMatch()}
                  disabled={isPending}
                  className="w-full text-start flex"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="mr-1" /> Create Match
                    </>
                  )}
                </Button>
              )}
            </>
          }
          falseComponent={
            <SelectGroup>
              <SelectLabel>No Match</SelectLabel>
              <Button
                onClick={() => onClickAddNewMatch()}
                disabled={isPending}
                className="w-full text-start flex"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusIcon className="mr-1" /> Create Match
                  </>
                )}
              </Button>
            </SelectGroup>
          }
        />
      </SelectContent>
    </Select>
  );
}
