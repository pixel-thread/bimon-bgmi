import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { FiAlertTriangle } from "react-icons/fi";
import { useTournament } from "@/src/hooks/tournament/useTournament";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { useTournamentStore } from "@/src/store/tournament";
import { useSeasonStore } from "@/src/store/season";

type ConfirmDeleteTournamentProps = {
  open: boolean;
  onValueChange: () => void;
};

export const ConfirmDeleteTournamentDialog = ({
  open,
  onValueChange,
}: ConfirmDeleteTournamentProps) => {
  const { tournamentId, setTournamentId } = useTournamentStore();
  const { seasonId } = useSeasonStore();
  const queryClient = useQueryClient();
  const { data } = useTournament({ id: tournamentId });

  const { mutate: deleteTournament, isPending: isLoading } = useMutation({
    mutationFn: () => http.delete("/admin/tournament/" + tournamentId),
    onSuccess: (data) => {
      if (data.success) {
        setTournamentId("");
        toast.success("Tournament updated successfully!");
        queryClient.refetchQueries({ queryKey: ["tournaments", seasonId] });
        queryClient.refetchQueries({ queryKey: ["tournaments"] });
        onValueChange();
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onValueChange}>
      <DialogContent className="max-w-xs sm:max-w-md p-6 rounded-xl shadow-2xl">
        <DialogHeader className="flex flex-col items-center gap-2">
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-2">
            <FiAlertTriangle className="text-red-500 w-8 h-8" />
          </span>
          <DialogTitle className="text-lg font-bold text-red-600">
            Confirm Delete Tournament
          </DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-3 mb-4">
          <p className="text-gray-700">
            Are you sure you want to delete this tournament?
          </p>

          {/* Tournament Details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <div className="font-semibold text-red-800">
              {data?.name || "Unknown Tournament"}
            </div>
            {data?.seasonId && (
              <div className="text-sm text-red-600">
                Season: {data.seasonId}
              </div>
            )}
            {data?.createdAt && (
              <div className="text-xs text-red-500">
                Created: {new Date(data.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>

          <p className="text-xs text-red-500 font-semibold">
            ⚠️ This action cannot be undone. All tournament data, teams, and
            results will be permanently deleted.
          </p>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">
          <Button
            onClick={() => onValueChange()}
            variant="outline"
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => deleteTournament()}
            variant="destructive"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Deleting..." : "Yes, Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
