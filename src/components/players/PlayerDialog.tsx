"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Player } from "@/src/lib/types";
import { sanitizeDisplayName } from "@/src/lib/unicodeSanitizer";

interface PlayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  onPlayerChange: (player: Player) => void;
  onSave: () => void;
  isSaving: boolean;
  title: string;
  saveButtonText: string;
}

export function PlayerDialog({
  isOpen,
  onClose,
  player,
  onPlayerChange,
  onSave,
  isSaving,
  title,
  saveButtonText,
}: PlayerDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={player.name}
              onChange={(e) =>
                onPlayerChange({
                  ...player,
                  name: sanitizeDisplayName(e.target.value),
                })
              }
              placeholder="Enter player name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <Select
              value={player.category}
              onValueChange={(value) =>
                onPlayerChange({ ...player, category: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ultra Noob">Ultra Noob</SelectItem>
                <SelectItem value="Noob">Noob</SelectItem>
                <SelectItem value="Pro">Pro</SelectItem>
                <SelectItem value="Ultra Pro">Ultra Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">
              {title.includes("Edit") ? "Balance" : "Initial Balance"}
            </label>
            <Input
              type="number"
              value={player.balance}
              onChange={(e) =>
                onPlayerChange({
                  ...player,
                  balance: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : saveButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
