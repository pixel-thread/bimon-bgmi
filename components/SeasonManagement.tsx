"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { PlusCircle, Calendar, Trophy } from "lucide-react";
import { ensureSingleActiveSeason } from "@/utils/seasonUtils";

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  description?: string;
}

export function SeasonManagement() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newSeason, setNewSeason] = useState({
    name: "",
    startDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    setIsLoading(true);
    try {
      const seasonsSnapshot = await getDocs(collection(db, "seasons"));
      const seasonsData = seasonsSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Season)
      );

      seasonsData.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSeasons(seasonsData);
    } catch (error) {
      console.error("Error fetching seasons:", error);
      toast.error("Failed to load seasons");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSeason = async () => {
    if (!newSeason.name.trim()) {
      toast.error("Season name is required");
      return;
    }

    setIsSaving(true);
    try {
      const seasonId = `season_${Date.now()}`;
      const seasonData: any = {
        id: seasonId,
        name: newSeason.name,
        startDate: newSeason.startDate,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      if (newSeason.description && newSeason.description.trim()) {
        seasonData.description = newSeason.description.trim();
      }

      await setDoc(doc(db, "seasons", seasonId), seasonData);
      await ensureSingleActiveSeason(seasonId);

      const activeSeason = seasons.find((s) => s.isActive && s.id !== seasonId);
      if (activeSeason) {
        await updateDoc(doc(db, "seasons", activeSeason.id), {
          endDate: new Date().toISOString().split("T")[0],
        });
      }

      toast.success(`${newSeason.name} created successfully!`);
      setNewSeason({
        name: "",
        startDate: new Date().toISOString().split("T")[0],
        description: "",
      });
      setIsDialogOpen(false);
      fetchSeasons();
    } catch (error) {
      console.error("Error creating season:", error);
      toast.error("Failed to create season");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "Not set";

    try {
      // Handle Firestore Timestamp objects
      const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);

      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-3">
          <div className="text-center text-xs">Loading seasons...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="p-3 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Seasons
            </CardTitle>
            <Button
              onClick={() => setIsDialogOpen(true)}
              size="sm"
              className="h-6 gap-1 text-xs"
            >
              <PlusCircle className="w-3 h-3" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            {seasons.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs">
                <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No seasons found.
              </div>
            ) : (
              seasons.map((season) => (
                <div
                  key={season.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-muted/20 rounded-md"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{season.name}</h3>
                      {season.isActive && (
                        <Badge className="bg-green-100 text-green-800 text-[10px] py-0">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        Started: {formatDate(season.startDate)}
                      </span>
                      {season.endDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          Ended: {formatDate(season.endDate)}
                        </span>
                      )}
                    </div>
                    {season.description && (
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                        {season.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Season Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Create New Season</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="seasonName" className="text-xs">
                Season Name
              </Label>
              <Input
                id="seasonName"
                value={newSeason.name}
                onChange={(e) =>
                  setNewSeason((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Season 2, Winter 2024"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="startDate" className="text-xs">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={newSeason.startDate}
                onChange={(e) =>
                  setNewSeason((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-xs">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                value={newSeason.description}
                onChange={(e) =>
                  setNewSeason((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of this season..."
                rows={3}
                className="text-sm"
              />
            </div>
            <div className="bg-yellow-50 rounded-md p-2">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> Creating a new season will end the
                current active season and start fresh statistics tracking.
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="h-8 text-xs"
              onClick={handleCreateSeason}
              disabled={isSaving}
            >
              {isSaving ? "Creating..." : "Create Season"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
