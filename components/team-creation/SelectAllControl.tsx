"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface SelectAllControlProps {
  isAllSelected: boolean;
  onSelectAll: () => void;
  availableCount: number;
}

export function SelectAllControl({
  isAllSelected,
  onSelectAll,
  availableCount,
}: SelectAllControlProps) {
  if (availableCount === 0) return null;

  return (
    <div className="flex items-center justify-between p-2.5 sm:p-3 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2">
        <Checkbox
          id="select-all"
          checked={isAllSelected}
          onCheckedChange={onSelectAll}
          aria-label="Select all players in current category"
          className="h-4 w-4 sm:h-5 sm:w-5"
        />
        <Label htmlFor="select-all" className="text-xs sm:text-sm font-medium">
          Select All
        </Label>
      </div>
      <Badge variant="secondary" className="text-xs px-2 py-1">
        {availableCount} available
      </Badge>
    </div>
  );
}
