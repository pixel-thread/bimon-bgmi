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
} from "lucide-react";
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

  return (
    <div className="space-y-6">
      {/* Tournament Selector & Actions */}
      <Card className="bg-gradient-to-br from-card to-muted/20 border-primary/10">

        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl">
                <Gamepad2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Tournament Manager</CardTitle>
                <CardDescription className="text-xs">
                  Select and configure tournaments
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              <Plus className="h-4 w-4" />
              New Tournament
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Season Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Season:</span>
            <SeasonSelector className="w-48" />
          </div>

          {/* Tournament Selector */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={tournamentId || ""}
              onValueChange={(value) => setTournamentId(value)}
            >
              <SelectTrigger className="flex-1 bg-background/50">
                <SelectValue placeholder="Select a tournament to configure..." />
              </SelectTrigger>
              <SelectContent>
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
                    {seasonId ? "No tournaments in this season" : "Select a season first"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {tournamentId && (
              <Button
                onClick={handleDeclareWinnersClick}
                disabled={tournament?.isWinnerDeclared}
                variant="outline"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {tournament?.isWinnerDeclared ? "Winners Declared" : "Declare Winners"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tournament Configuration */}
      <TournamentConfiguration />

      {/* Background Gallery & Upload */}
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
          isLoadingRankings={isLoadingRankings}
        />
      )}
    </div>
  );
}

const TournamentConfiguration = () => {
  const { tournamentId: selectedTournament } = useTournamentStore();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Gamepad2 className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-base">Tournament Configuration</CardTitle>
            <CardDescription className="text-xs">
              Edit tournament details and settings
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <Ternary
          condition={!!selectedTournament}
          trueComponent={<TournamentForm />}
          falseComponent={
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-muted/50 rounded-full mb-4">
                <Gamepad2 className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-medium text-muted-foreground">
                No Tournament Selected
              </h3>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Select a tournament from above to configure it
              </p>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
};

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
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <ImageIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-base">Background Gallery</CardTitle>
            <CardDescription className="text-xs">
              Manage tournament background images
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="gallery" className="w-full">
          <div className="border-b px-4">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger
                value="gallery"
                className="data-[state=active]:bg-muted gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Gallery
                {backgroundGallery && (
                  <Badge variant="secondary" className="ml-1">
                    {backgroundGallery.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="data-[state=active]:bg-muted gap-2"
              >
                <ImagePlus className="h-4 w-4" />
                Upload New
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
