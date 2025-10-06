"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import TournamentSelector from "./TournamentSelector";
import { SeasonSelector } from "./SeasonSelector";
import WinnerReveal from "./WinnerReveal";
import { useTeams, useTournaments } from "./teamManagementImports";
import { getBestTournamentForAutoSelect } from "@/src/lib/utils";
import { LoaderFive } from "@/src/components/ui/loader";
import { Trophy, Settings, Calendar, Users } from "lucide-react";

interface RevealTabProps {
  readOnly?: boolean;
  hideSelectors?: boolean;
  showSelectorsForSuperAdmin?: boolean;
}

export function RevealTab({
  readOnly = false,
  hideSelectors = false,
  showSelectorsForSuperAdmin = false,
}: RevealTabProps) {
  const [selectedTournament, setSelectedTournament] = useState<string | null>(
    null
  );
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [isInitializing, setIsInitializing] = useState(true);

  const { teams, loading } = useTeams(selectedTournament);
  const { tournaments: allTournaments } = useTournaments();

  // Auto-select the latest tournament (preferring those with teams)
  useEffect(() => {
    if (allTournaments.length > 0 && !selectedTournament) {
      // Use the new utility function to get the best tournament (preferring those with teams)
      getBestTournamentForAutoSelect(allTournaments)
        .then((bestTournamentId) => {
          if (bestTournamentId) {
            setSelectedTournament(bestTournamentId);
          }
        })
        .catch((error) => {
          console.error("Error selecting best tournament:", error);
          // Fallback to the old logic if there's an error
          const sortedTournaments = [...allTournaments].sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          );
          setSelectedTournament(sortedTournaments[0].id);
        });
    }
    // Set initializing to false once we've processed tournaments
    if (allTournaments.length >= 0) {
      setIsInitializing(false);
    }
  }, [allTournaments, selectedTournament]);

  // Get selected tournament config
  const selectedConfig = allTournaments.find(
    (t) => t.id === selectedTournament
  );

  // Show loader during initial loading or when loading teams
  if (isInitializing || loading) {
    return (
      <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <LoaderFive text="Loading winner reveal..." />
            <p className="text-sm text-muted-foreground text-center">
              Preparing tournament data and player information...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loader if no tournaments exist (should be rare since there's always a tournament)
  if (allTournaments.length === 0) {
    return (
      <div className="min-h-[400px] bg-background flex items-center justify-center">
        <LoaderFive text="Loading..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Selectors - Show for super admin or when not hidden */}
      {(!hideSelectors || showSelectorsForSuperAdmin) && (
        <Card
          className={
            showSelectorsForSuperAdmin
              ? "border-2 border-dashed border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20"
              : ""
          }
        >
          {showSelectorsForSuperAdmin && (
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                  <Settings className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                Super Admin Controls
                <Badge variant="default" className="bg-amber-600 text-white">
                  <Trophy className="w-3 h-3 mr-1" />
                  Super Admin
                </Badge>
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className={showSelectorsForSuperAdmin ? "pt-0" : "p-4"}>
            <div
              className={`flex flex-col sm:flex-row gap-3 ${
                !showSelectorsForSuperAdmin
                  ? "p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border"
                  : ""
              }`}
            >
              <div className="flex-1 space-y-2">
                {showSelectorsForSuperAdmin && (
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Tournament Selection
                  </div>
                )}
                <TournamentSelector
                  selected={selectedTournament}
                  onSelect={setSelectedTournament}
                  tournaments={allTournaments}
                  className="w-full"
                />
                {showSelectorsForSuperAdmin && selectedConfig && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {teams.length} teams registered
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                {showSelectorsForSuperAdmin && (
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Season Filter
                  </div>
                )}
                <SeasonSelector
                  selectedSeason={selectedSeason}
                  onSeasonChange={setSelectedSeason}
                  className="w-full"
                  size="md"
                />
                {showSelectorsForSuperAdmin && (
                  <div className="text-xs text-muted-foreground">
                    {selectedSeason === "all"
                      ? "Showing all seasons"
                      : "Filtered by season"}
                  </div>
                )}
              </div>
              {!readOnly && !showSelectorsForSuperAdmin && (
                <Badge variant="secondary" className="self-start">
                  <Settings className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>

            {/* Tournament Info for Super Admin */}
            {showSelectorsForSuperAdmin && selectedConfig && (
              <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">{selectedConfig.title}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {teams.length} Teams
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {teams.reduce((acc, team) => acc + team.players.length, 0)}{" "}
                    Players
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Winner Reveal */}
      {selectedTournament && selectedConfig && (
        <WinnerReveal
          teams={teams}
          tournamentId={selectedTournament}
          tournamentTitle={selectedConfig.title}
          seasonId={selectedSeason !== "all" ? selectedSeason : undefined}
          isAdmin={!readOnly}
        />
      )}
    </div>
  );
}
