"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AnimatedButton } from "@/components/ui/animated-button";

interface BulkCreateModalProps {
  showBulkCreateModal: boolean;
  setShowBulkCreateModal: (show: boolean) => void;
  setShowPlayerSelectionModal: (show: boolean) => void;
  selectedTournament: string | null;
}

export default function BulkCreateModal({
  showBulkCreateModal,
  setShowBulkCreateModal,
  setShowPlayerSelectionModal,
  selectedTournament,
}: BulkCreateModalProps) {
  const handleNext = () => {
    setShowBulkCreateModal(false);
    setShowPlayerSelectionModal(true);
  };

  return (
    <Dialog open={showBulkCreateModal} onOpenChange={setShowBulkCreateModal}>
      <DialogContent className="w-[95vw] max-w-[400px] p-4 bg-white rounded-lg shadow-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Bulk Team Creation
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-600">
            You'll select players and team configuration in the next step
          </DialogDescription>
        </DialogHeader>

        <div className="py-3">
          {selectedTournament && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="font-medium text-blue-800 text-sm">
                Tournament:{" "}
                <span className="font-normal">{selectedTournament}</span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <AnimatedButton
            onClick={() => setShowBulkCreateModal(false)}
            className="w-full h-8 text-xs"
          >
            Cancel
          </AnimatedButton>
          <AnimatedButton
            onClick={handleNext}
            className="w-full h-8 text-xs bg-orange-500 hover:bg-orange-600"
          >
            Select Players
          </AnimatedButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
