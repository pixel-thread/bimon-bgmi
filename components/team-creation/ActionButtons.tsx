"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ActionButtonsProps {
  loading: boolean;
  generating: boolean;
  saving: boolean;
  hasSelectedPlayers: boolean;
  hasSavedPlayers: boolean;
  onCancel: () => void;
  onSave: () => void;
  onGenerate: () => void;
}

export function ActionButtons({
  loading,
  generating,
  saving,
  hasSelectedPlayers,
  hasSavedPlayers,
  onCancel,
  onSave,
  onGenerate,
}: ActionButtonsProps) {
  return (
    <div className="border-t bg-background flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4">
      {/* Mobile: Single row with icons only */}
      <div className="flex sm:hidden justify-between items-center gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading || generating}
          className="flex-1"
          title="Cancel"
        >
          ✕
        </Button>
        <Button
          variant="secondary"
          onClick={onSave}
          disabled={loading || generating || saving || !hasSelectedPlayers}
          className="flex-1"
          title="Save Selection"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "💾"}
        </Button>
        <Button
          onClick={onGenerate}
          disabled={loading || generating || !hasSavedPlayers}
          className="flex-1"
          title="Generate Teams"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : "🚀"}
        </Button>
      </div>

      {/* Desktop: Normal layout with text */}
      <div className="hidden sm:flex justify-between items-center">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading || generating}
            className="px-6 py-2.5 font-medium text-sm min-h-[40px]"
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={onSave}
            disabled={loading || generating || saving || !hasSelectedPlayers}
            className="px-6 py-2.5 font-medium text-sm min-h-[40px] flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Selection
          </Button>
        </div>
        <Button
          onClick={onGenerate}
          disabled={loading || generating || !hasSavedPlayers}
          className="px-8 py-2.5 font-medium text-sm min-h-[40px] flex items-center gap-2"
        >
          {generating && <Loader2 className="h-4 w-4 animate-spin" />}
          Generate Teams
        </Button>
      </div>
    </div>
  );
}
