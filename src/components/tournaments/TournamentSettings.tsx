"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { FileUpload } from "@/src/components/ui/file-upload";
import { Button } from "@/src/components/ui/button";
import TournamentForm from "./TournamentForm";
import TournamentCreateModal from "@/src/components/admin/tournaments/TournamentCreateModal";
import { SeasonManagement } from "../admin/season/SeasonManagement";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Check,
  X,
  Plus,
  Gamepad2,
  Sparkles,
  Loader2,
  ImagePlus,
  Globe,
  Undo2,
  ChevronDown,
  Trophy,
  RefreshCw,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Ternary } from "../common/Ternary";
import { useTournamentStore } from "../../store/tournament";
import { useTournament } from "../../hooks/tournament/useTournament";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "../../utils/http";
import { useGallery } from "../../hooks/gallery/useGallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { useTournaments } from "../../hooks/tournament/useTournaments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { DeclareWinnerDialog } from "./DeclareWinnerDialog";
import { SeasonSelector } from "../SeasonSelector";
import { useSeasonStore } from "../../store/season";
import { compressGalleryImage } from "../../utils/image/compressImage";

type TeamRanking = {
  teamId: string;
  name: string;
  total: number;
  kills: number;
  pts: number;
  players?: { id: string; name: string }[];
};

export function TournamentSettings() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeclareWinnerModal, setShowDeclareWinnerModal] = useState(false);
  const { tournamentId, setTournamentId } = useTournamentStore();
  const { seasonId } = useSeasonStore();
  const { data: tournaments, isLoading: isLoadingTournaments } = useTournaments();
  const { data: tournament } = useTournament({ id: tournamentId });
  const queryClient = useQueryClient();

  // Fetch team rankings when tournament is selected
  const { data: rankingsData, isLoading: isLoadingRankings } = useQuery({
    queryKey: ["tournament-rankings", tournamentId],
    queryFn: () => http.get<TeamRanking[]>(`/admin/tournament/${tournamentId}/rankings`),
    enabled: !!tournamentId && showDeclareWinnerModal,
  });

  const teamRankings = rankingsData?.data || [];
  const prizePoolMeta = rankingsData?.meta ? {
    entryFee: rankingsData.meta.entryFee || 0,
    totalPlayers: rankingsData.meta.totalPlayers || 0,
    prizePool: rankingsData.meta.prizePool || 0,
    ucExemptCount: rankingsData.meta.ucExemptCount || 0,
    teamType: rankingsData.meta.teamType || "DUO",
  } : undefined;

  const handleDeclareWinnersClick = () => {
    if (!tournamentId) {
      toast.error("Please select a tournament first");
      return;
    }
    if (tournament?.isWinnerDeclared) {
      toast.error("Winners have already been declared for this tournament");
      return;
    }
    setShowDeclareWinnerModal(true);
  };

  // Undo winner declaration mutation
  const { isPending: isUndoing, mutate: undoWinner } = useMutation({
    mutationFn: () => http.post(`/admin/tournament/${tournamentId}/undo-winner`),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Winner declaration undone! UC transactions have been reversed.");
        queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      } else {
        toast.error(data.message || "Failed to undo winner declaration");
      }
    },
    onError: () => {
      toast.error("Failed to undo winner declaration");
    },
  });

  const handleUndoWinner = () => {
    if (!tournamentId || !tournament?.isWinnerDeclared) return;

    if (confirm("Are you sure you want to undo the winner declaration? This will:\n\n• Reverse all UC transactions\n• Delete winner records\n• Delete income records\n\nThis action cannot be easily undone!")) {
      undoWinner();
    }
  };

  // Update streaks mutation (for manually triggering streak updates)
  const { isPending: isUpdatingStreaks, mutate: updateStreaks } = useMutation({
    mutationFn: () => http.post(`/admin/tournament/${tournamentId}/update-streaks`),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Streaks updated successfully!");
      } else {
        toast.error(data.message || "Failed to update streaks");
      }
    },
    onError: () => {
      toast.error("Failed to update streaks");
    },
  });

  const handleUpdateStreaks = () => {
    if (!tournamentId || !tournament?.isWinnerDeclared) return;
    updateStreaks();
  };

  return (
    <div className="space-y-4">
      {/* Tournament Manager - Merged with Configuration */}
      <Card className="border">
        <CardHeader className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              className="gap-1.5 h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 space-y-3">
          {/* Season Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Season:</span>
            <SeasonSelector className="flex-1" />
          </div>

          {/* Tournament Selector */}
          <Select
            value={tournamentId || ""}
            onValueChange={(value) => setTournamentId(value)}
          >
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue placeholder="Select tournament..." />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {isLoadingTournaments ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : tournaments && tournaments.length > 0 ? (
                tournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="h-3 w-3" />
                      {t.name}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  {seasonId ? "No tournaments" : "Select season first"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          {/* Actions - only show when tournament selected */}
          {tournamentId && (
            <div className="flex gap-2">
              {!tournament?.isWinnerDeclared ? (
                <Button
                  onClick={handleDeclareWinnersClick}
                  variant="outline"
                  className="flex-1 gap-1.5 h-8 text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Declare Winners
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleUpdateStreaks}
                    disabled={isUpdatingStreaks}
                    variant="outline"
                    className="flex-1 gap-1.5 h-8 text-xs"
                    title="Manually update tournament streaks for all participants"
                  >
                    {isUpdatingStreaks ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    {isUpdatingStreaks ? "Updating..." : "Update Streaks"}
                  </Button>
                  <Button
                    onClick={handleUndoWinner}
                    disabled={isUndoing}
                    variant="destructive"
                    className="flex-1 gap-1.5 h-8 text-xs"
                  >
                    {isUndoing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Undo2 className="h-3.5 w-3.5" />
                    )}
                    {isUndoing ? "Undoing..." : "Undo Winners"}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Tournament Configuration - Inline */}
          {tournamentId ? (
            <div className="pt-2 border-t">
              <TournamentForm />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Gamepad2 className="h-6 w-6 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">
                Select a tournament to configure
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Background Gallery */}
      <GallerySection />

      {/* Season Management */}
      <SeasonManagement />

      <TournamentCreateModal
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
      />

      {/* Declare Winner Dialog */}
      {tournamentId && (
        <DeclareWinnerDialog
          isOpen={showDeclareWinnerModal}
          onClose={() => setShowDeclareWinnerModal(false)}
          tournamentId={tournamentId}
          tournamentName={tournaments?.find(t => t.id === tournamentId)?.name || "Tournament"}
          teamRankings={teamRankings}
          prizePoolMeta={prizePoolMeta}
          isLoadingRankings={isLoadingRankings}
        />
      )}
    </div>
  );
}


const GallerySection = () => {
  const { data: backgroundGallery, isLoading: isLoadingGallery } = useGallery();
  const { tournamentId } = useTournamentStore();
  const { data } = useTournament({ id: tournamentId });
  const queryClient = useQueryClient();

  // Find which image is currently set as global background
  const globalBackgroundImage = backgroundGallery?.find(
    (img) => (img as any).isGlobalBackground === true
  );

  const { isPending: isSettingBackground, mutate } = useMutation({
    mutationFn: ({
      tournamentId,
      galleryId,
    }: {
      tournamentId: string;
      galleryId: string;
    }) =>
      http.post("/admin/gallery/tournament-background", {
        tournamentId,
        galleryId,
      }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Background updated!");
        queryClient.invalidateQueries({
          queryKey: ["tournament", tournamentId],
        });
      }
    },
  });

  // Mutation for setting global background
  const { isPending: isSettingGlobal, mutate: setGlobalBackground } = useMutation({
    mutationFn: ({ galleryId }: { galleryId: string }) =>
      http.post("/admin/gallery/global-background", { galleryId }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Global background set! This will be used for all standings.");
        queryClient.invalidateQueries({ queryKey: ["gallery"] });
        queryClient.invalidateQueries({ queryKey: ["global-background"] });
      }
    },
  });

  const { isPending: isUploading, mutate: uploadGallery } = useMutation({
    mutationFn: async (data: { image: File }) => {
      // Auto-compress image before uploading
      const compressedImage = await compressGalleryImage(data.image);
      const formData = new FormData();
      formData.append("image", compressedImage);
      return http.post("/admin/gallery", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Image uploaded to gallery!");
        queryClient.invalidateQueries({ queryKey: ["gallery"] });
      }
    },
    onError: () => {
      toast.error("Failed to upload image");
    },
  });

  const { isPending: isDeleting, mutate: deleteFromGallery } = useMutation({
    mutationFn: ({ id }: { id: string }) => http.delete(`/admin/gallery/${id}`),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Image deleted from gallery");
        queryClient.invalidateQueries({ queryKey: ["gallery"] });
        queryClient.invalidateQueries({ queryKey: ["global-background"] });
      }
    },
  });

  const currentBackgroundImage = backgroundGallery?.find(
    (val) => val.id === data?.gallery?.id
  );

  return (
    <Card className="border">
      <CardHeader className="p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Gallery</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="gallery" className="w-full">
          <div className="border-b px-3">
            <TabsList className="bg-transparent h-9">
              <TabsTrigger
                value="gallery"
                className="data-[state=active]:bg-muted gap-1.5 text-xs"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Images
                {backgroundGallery && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                    {backgroundGallery.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="data-[state=active]:bg-muted gap-1.5 text-xs"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Upload
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="gallery" className="p-4 mt-0">
            {isLoadingGallery ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !backgroundGallery || backgroundGallery.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-medium text-muted-foreground">
                  No Images Yet
                </h3>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Upload images to use as tournament backgrounds
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {backgroundGallery.map((image, index) => {
                  const isSelected = currentBackgroundImage?.id === image.id;
                  const isGlobal = globalBackgroundImage?.id === image.id;
                  return (
                    <div
                      key={image.id || index}
                      className={`relative group rounded-lg overflow-hidden border-2 transition-all ${isGlobal
                        ? "border-green-500 ring-2 ring-green-500/20"
                        : isSelected
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-muted-foreground/30"
                        }`}
                    >
                      <img
                        src={image.publicUrl}
                        alt={`Background ${index + 1}`}
                        className="w-full h-28 sm:h-32 object-cover"
                      />
                      {/* Global background badge */}
                      {isGlobal && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-lg" title="Global Background">
                          <Globe className="h-3 w-3" />
                        </div>
                      )}
                      {/* Selected for tournament badge */}
                      {isSelected && !isGlobal && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isDeleting) {
                            deleteFromGallery({ id: image.id });
                          }
                        }}
                        className="absolute top-2 left-2 bg-destructive/90 hover:bg-destructive text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        aria-label="Delete image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {/* Overlay with Set as Global button */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSettingGlobal && !isGlobal) {
                              setGlobalBackground({ galleryId: image.id });
                            }
                          }}
                          disabled={isGlobal || isSettingGlobal}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${isGlobal
                            ? "bg-green-500/50 text-white cursor-default"
                            : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                        >
                          {isGlobal ? "✓ Global BG" : "Set as Global"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="p-4 mt-0">
            <div className="relative">
              {isUploading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm font-medium">Uploading...</span>
                  </div>
                </div>
              )}
              <div className="border-2 border-dashed rounded-lg transition-colors hover:border-primary/50">
                <FileUpload
                  onChange={(files) => {
                    if (files[0]) {
                      uploadGallery({ image: files[0] });
                    }
                  }}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
