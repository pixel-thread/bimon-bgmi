import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FormField from "@/components/FormField";
import { useTournaments } from "@/hooks/useTournaments";
import { TournamentConfig, Season } from "@/lib/types";
import { toast } from "sonner";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface TournamentCreateModalProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  formData: Partial<TournamentConfig>;
  setFormData: (data: Partial<TournamentConfig>) => void;
  setSelectedTournament: (id: string | null) => void;
}

export default function TournamentCreateModal({
  showCreateModal,
  setShowCreateModal,
  formData,
  setFormData,
  setSelectedTournament,
}: TournamentCreateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const { createTournament } = useTournaments();

  useEffect(() => {
    const fetchActiveSeason = async () => {
      try {
        // Get active season
        const seasonsSnapshot = await getDocs(collection(db, "seasons"));
        const seasons = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season));
        const active = seasons.find(season => season.isActive);
        setActiveSeason(active || null);
      } catch (error) {
        console.error("Error fetching season data:", error);
      }
    };

    if (showCreateModal) {
      fetchActiveSeason();
    }
  }, [showCreateModal]);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const newTournamentId = await createTournament(formData as TournamentConfig);
      setShowCreateModal(false);
      setFormData({ title: "" });
      setSelectedTournament(newTournamentId);
      toast.success(`Tournament created and linked to ${activeSeason?.name || 'Season 1'}!`);
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast.error("Failed to create tournament.");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Tournament</DialogTitle>
          <DialogDescription>
            This tournament will be linked to <strong>{activeSeason?.name || 'Season 1'}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField
            label="Tournament Title"
            value={formData.title || ""}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter tournament title"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}