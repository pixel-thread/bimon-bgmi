import { Button } from "@/src/components/ui/button";
import FormField from "@/src/components/FormField";
import { useTournaments } from "@/src/hooks/useTournaments";
import { TournamentConfig } from "@/src/lib/types";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { FiAlertTriangle } from "react-icons/fi";

interface TournamentFormProps {
  formData: Partial<TournamentConfig>;
  setFormData: (data: Partial<TournamentConfig>) => void;
  selectedConfig: TournamentConfig;
  selectedTournament: string;
}

export default function TournamentForm({
  formData,
  setFormData,
  selectedConfig,
  selectedTournament,
}: TournamentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { updateTournament, deleteTournament } = useTournaments();

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await updateTournament(selectedTournament, formData as TournamentConfig);
      toast.success("Tournament updated successfully!");
    } catch (error) {
      console.error("Error updating tournament:", error);
      toast.error("Failed to update tournament.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteTournament(selectedTournament);
      toast.success("Tournament deleted successfully!");
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting tournament:", error);
      toast.error("Failed to delete tournament.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-12">
      <FormField
        label="Tournament Title"
        value={formData.title || selectedConfig.title || ""}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Enter tournament title"
        className="sm:col-span-7"
      />
      <FormField
        label="Entry Fee (₹)"
        type="number"
        value={
          typeof formData.entryFee === "number"
            ? formData.entryFee.toString()
            : (selectedConfig.entryFee ?? 20).toString()
        }
        onChange={(e) =>
          setFormData({ ...formData, entryFee: Number(e.target.value) })
        }
        placeholder="e.g. 20"
        className="sm:col-span-5"
      />
      <div className="col-span-full flex items-center justify-end gap-3 mt-6">
        <Button onClick={handleUpdate} disabled={isLoading}>
          {isLoading ? "Updating..." : "Save Changes"}
        </Button>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isLoading}
        >
          {isLoading ? "Deleting..." : "Delete"}
        </Button>
      </div>
      {showDeleteConfirm && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
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
                  {selectedConfig?.title || "Unknown Tournament"}
                </div>
                {selectedConfig?.seasonId && (
                  <div className="text-sm text-red-600">
                    Season: {selectedConfig.seasonId}
                  </div>
                )}
                {selectedConfig?.createdAt && (
                  <div className="text-xs text-red-500">
                    Created:{" "}
                    {new Date(selectedConfig.createdAt).toLocaleDateString()}
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
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Deleting..." : "Yes, Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
