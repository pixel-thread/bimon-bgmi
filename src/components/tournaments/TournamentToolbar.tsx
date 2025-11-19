"use client";

import { Button } from "@/src/components/ui/button";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";
import { useTournamentStore } from "@/src/store/tournament";
import http from "@/src/utils/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FiPlus } from "react-icons/fi";
import { toast } from "sonner";

interface TournamentToolbarProps {
  setShowCreateModal: (show: boolean) => void;
  setShowBulkCreateModal: (show: boolean) => void;
}

export default function TournamentToolbar({
  setShowCreateModal,
}: TournamentToolbarProps) {
  const { tournamentId } = useTournamentStore();
  const queryClient = useQueryClient();
  const { isPending, mutate: declearWinner } = useMutation({
    mutationFn: () =>
      http.post(
        ADMIN_TOURNAMENT_ENDPOINTS.POST_DECLEAR_TOURNAMENT_WINNER.replace(
          ":id",
          tournamentId || "",
        ),
        { tournamentId },
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Tournament updated successfully!");
        queryClient.invalidateQueries({
          queryKey: ["tournament", tournamentId],
        });
        return data;
      }
    },
  });

  return (
    <div className="flex flex-row gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="h-8 text-xs gap-1 bg-muted/50 hover:bg-muted"
        >
          <FiPlus className="h-3 w-3" />
          New Tournament
        </Button>
      </div>
      {tournamentId && (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isPending}
            size="sm"
            onClick={() => declearWinner()}
            className="h-8 text-xs gap-1 bg-muted/50 hover:bg-muted"
          >
            Declare Winner
          </Button>
        </div>
      )}
    </div>
  );
}
