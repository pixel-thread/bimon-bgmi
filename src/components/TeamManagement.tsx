"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { FiEdit, FiAward, FiDownload, FiPlus } from "react-icons/fi";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/src/components/ui/tooltip";
import * as imports from "./teamManagementImports";
import {
  handleSetTempEdit,
  handleExportCSV,
  handleSequentialClose,
  handleSequentialSave,
} from "./teamManagementUtils";
import { motion, AnimatePresence } from "framer-motion";
import {
  calculatePlacementPoints,
  getPositionFromPoints,
  sortTeamsWithTiebreaker,
  getBestTournamentForAutoSelect,
} from "@/src/lib/utils";
import { formatDateDDMMYYYY } from "../utils/dateFormat";
import { SeasonSelector } from "./SeasonSelector";
import { LoaderFive } from "@/src/components/ui/loader";
import { useAuth } from "@/src/hooks/useAuth";

interface TeamManagementProps {
  readOnly?: boolean;
}

export default function TeamManagement({
  readOnly = false,
}: TeamManagementProps) {
  // Auth state for role-based UI
  const { user } = useAuth();
  const role = user?.role;

  // Basic states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<string>("All");
  const [selectedTournament, setSelectedTournament] = useState<string | null>(
    null,
  );
  const [editingTeam, setEditingTeam] =
    useState<imports.CombinedTeamData | null>(null);
  const [editingPlayer1Ign, setEditingPlayer1Ign] = useState("");
  const [editingPlayer2Ign, setEditingPlayer2Ign] = useState("");
  const [showSequentialModal, setShowSequentialModal] = useState(false);
  const [showStandingsModal, setShowStandingsModal] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [placementErrors, setPlacementErrors] = useState<{
    [teamId: string]: string;
  }>({});
  const [totalPlayersPlayed, setTotalPlayersPlayed] = useState("");
  const [totalKillsError, setTotalKillsError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [showNoTeamsMessage, setShowNoTeamsMessage] = useState(false);

  // Example usage:
  const todayFormatted = formatDateDDMMYYYY(new Date());

  // Use teams from Firestore
  const { teams, loading, deleteTeams } = imports.useTeams(selectedTournament);
  const { tournaments: allTournaments } = imports.useTournaments();

  // Filter tournaments by selected season
  const tournaments = useMemo(() => {
    if (selectedSeason === "all") {
      return allTournaments;
    }
    return allTournaments.filter(
      (tournament) => tournament.seasonId === selectedSeason,
    );
  }, [allTournaments, selectedSeason]);

  // Reset selected tournament if it's not in the filtered list
  useEffect(() => {
    if (selectedTournament && tournaments.length > 0) {
      const isSelectedTournamentInList = tournaments.some(
        (t) => t.id === selectedTournament,
      );
      if (!isSelectedTournamentInList) {
        // Select the first tournament from the filtered list
        const sorted = [...tournaments].sort((a, b) =>
          b.id.localeCompare(a.id),
        );
        setSelectedTournament(sorted[0]?.id || null);
      }
    }
  }, [tournaments, selectedTournament]);
  const {
    tempEdits,
    setTempEdit,
    saveEdits,
    matchOptions,
    sequentialMatch,
    setSequentialMatch,
    resetTempEdits,
    hasUnsavedChanges, // Updated function from useSequentialEditing
  } = imports.useSequentialEditing(teams, selectedMatch);

  const selectedConfig =
    tournaments.find((t) => t.id === selectedTournament) || null;

  // Local matchCount state defaulted to 0
  const [matchCount, setMatchCount] = useState(0);

  // Once teams are loaded, find the highest match number in Firestore.
  useEffect(() => {
    if (!loading && teams.length > 0) {
      let highest = 0;
      for (const team of teams) {
        const scores = team.matchScores || {};
        for (const key of Object.keys(scores)) {
          const num = parseInt(key, 10);
          if (!isNaN(num) && num > highest) {
            highest = num;
          }
        }
      }
      setMatchCount(highest);
      if (parseInt(selectedMatch, 10) > highest) {
        setSelectedMatch(highest > 0 ? highest.toString() : "");
        setSequentialMatch(highest > 0 ? highest.toString() : "");
      }
    }
  }, [loading, teams, selectedMatch, setSequentialMatch]);

  useEffect(() => {
    if (tournaments.length > 0 && !selectedTournament) {
      // Use the new utility function to get the best tournament (preferring those with teams)
      getBestTournamentForAutoSelect(tournaments)
        .then((bestTournamentId) => {
          if (bestTournamentId) {
            setSelectedTournament(bestTournamentId);
          }
        })
        .catch((error) => {
          console.error("Error selecting best tournament:", error);
          // Fallback to the old logic if there's an error
          const sorted = [...tournaments].sort((a, b) =>
            b.id.localeCompare(a.id),
          );
          setSelectedTournament(sorted[0].id);
        });
    }
    // Set default match to 'All' if not already set
    if (!selectedMatch) {
      setSelectedMatch("All");
    }
  }, [tournaments, selectedTournament, selectedMatch]);

  // When adding a match, increment the local matchCount.
  const handleAddMatch = async () => {
    if (!selectedTournament) return;
    setIsSaving(true);
    const newMatchNumber = (matchCount + 1).toString();

    const batch = imports.writeBatch(imports.db);
    for (const team of teams) {
      const updatedScores = { ...team.matchScores };
      const editablePlayers = team.players.filter(
        (p) => p.ign.trim() !== "",
      ).length;
      if (!updatedScores[newMatchNumber]) {
        updatedScores[newMatchNumber] = {
          kills: 0,
          placementPoints: 0,
          playerKills: Array(editablePlayers).fill(0),
          playerKD: Array(editablePlayers).fill(0),
        };
      }
      const docRef = imports.doc(imports.db, "tournamentEntries", team.id);
      batch.update(docRef, { matchScores: updatedScores });
    }
    await batch.commit();

    setMatchCount(matchCount + 1);
    setSelectedMatch(newMatchNumber);
    setSequentialMatch(newMatchNumber);
    setIsSaving(false);
  };

  const handleTournamentSelect = useCallback((value: string | null) => {
    setSelectedTournament((prev) => {
      if (prev !== value) {
        return value;
      }
      return prev;
    });
  }, []);

  // Filtering and sorting
  const filteredTeams = useMemo(() => {
    return teams.filter(
      (team) =>
        team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.players.some((player) =>
          player.ign.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );
  }, [teams, searchTerm]);

  const sortedTeams = useMemo(() => {
    if (selectedMatch === "All") {
      // Use the new tiebreaker system for official competitions
      const sortedWithTiebreaker = sortTeamsWithTiebreaker(filteredTeams);
      return sortedWithTiebreaker.map((team, idx) => ({
        team,
        position: idx + 1,
      }));
    } else {
      return filteredTeams.map((team) => ({ team, position: undefined }));
    }
  }, [filteredTeams, selectedMatch]);

  // Handle delayed no-teams message - placed after sortedTeams is defined
  useEffect(() => {
    if (!loading && teams.length === 0) {
      // Show loader first for empty database
      setShowNoTeamsMessage(false);
      const timer = setTimeout(() => {
        setShowNoTeamsMessage(true);
      }, 10000); // 10 second delay - much longer to prefer loader

      return () => clearTimeout(timer);
    } else {
      setShowNoTeamsMessage(false);
    }
  }, [loading, teams.length]);

  // Removed: const hasUnsavedChanges = Object.keys(tempEdits).length > 0;
  // Now using hasUnsavedChanges from useSequentialEditing

  const handleTempEditChange = (
    teamId: string,
    field: "placement" | "kills" | "teamName",
    value: string,
  ) => {
    setTempEdit(teamId, field, value);
  };

  // Migration function to update existing tournament entries with seasonId
  // const migrateTournamentEntries = async () => {
  //   try {
  //     console.log("Starting migration of tournament entries...");
  //     const entriesSnapshot = await imports.getDocs(
  //       imports.collection(imports.db, "tournamentEntries")
  //     );
  //     const batch = imports.writeBatch(imports.db);
  //     let updateCount = 0;

  //     for (const entryDoc of entriesSnapshot.docs) {
  //       const entry = entryDoc.data();

  //       // Only update entries that don't have seasonId
  //       if (!entry.seasonId && entry.tournamentId) {
  //         const tournament = allTournaments.find(
  //           (t) => t.id === entry.tournamentId
  //         );
  //         if (tournament && tournament.seasonId) {
  //           const docRef = imports.doc(
  //             imports.db,
  //             "tournamentEntries",
  //             entryDoc.id
  //           );
  //           batch.update(docRef, { seasonId: tournament.seasonId });
  //           updateCount++;
  //         }
  //       }
  //     }

  //     if (updateCount > 0) {
  //       await batch.commit();
  //       console.log(
  //         `Migration completed: Updated ${updateCount} tournament entries with seasonId`
  //       );
  //       imports.toast.success(
  //         `Updated ${updateCount} tournament entries with season information`
  //       );
  //     } else {
  //       console.log("No tournament entries needed migration");
  //     }
  //   } catch (error) {
  //     console.error("Error during migration:", error);
  //     imports.toast.error("Failed to migrate tournament entries");
  //   }
  // };

  // // Run migration when tournaments are loaded (only once)
  // const [migrationRun, setMigrationRun] = useState(false);
  // useEffect(() => {
  //   if (allTournaments.length > 0 && !migrationRun) {
  //     migrateTournamentEntries();
  //     setMigrationRun(true);
  //   }
  // }, [allTournaments, migrationRun]);

  const handleAddTeam = async (teamData: {
    teamName: string;
    players: string[];
  }) => {
    if (!selectedTournament) return;
    setIsSaving(true);
    try {
      const matchScores: { [matchNumber: string]: imports.MatchScore } = {};
      for (let i = 1; i <= matchCount; i++) {
        matchScores[i.toString()] = {
          kills: 0,
          placementPoints: 0,
          playerKills: Array(teamData.players.length).fill(0),
          playerKD: Array(teamData.players.length).fill(0),
        };
      }

      // Get the season ID from the selected tournament
      const selectedTournamentData = allTournaments.find(
        (t) => t.id === selectedTournament,
      );
      const seasonId = selectedTournamentData?.seasonId || undefined;

      const newTeam: imports.CombinedTeamData = {
        id: "",
        phoneNumber: "",
        teamName: teamData.teamName,
        players: teamData.players.map((ign) => ({ ign, kills: 0 })),
        tournamentId: selectedTournament,
        teamMode: "Squad 4+1",
        matchScores,
        status: "approved",
        approvedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        seasonId: seasonId,
      };

      const docRef = await imports.addDoc(
        imports.collection(imports.db, "tournamentEntries"),
        newTeam,
      );
      setShowAddTeamModal(false);
    } catch (error) {
      console.error("Error adding team:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // One-click data fix: backfill seasonId, ensure player docs, normalize matchScores
  const handleFixData = async () => {
    try {
      if (!selectedTournament) {
        imports.toast.error("Select a tournament first");
        return;
      }
      setIsSaving(true);

      // Load tournament for seasonId
      const tDoc = await imports.getDoc(
        imports.doc(imports.db, "tournaments", selectedTournament),
      );
      const seasonId = tDoc.exists() ? (tDoc.data() as any).seasonId : null;

      // Load all players into maps (exclude soft-deleted)
      const playersSnapshot = await imports.getDocs(
        imports.collection(imports.db, "players"),
      );
      const playerByName = new Map<string, any>();
      playersSnapshot.forEach((p) => {
        const data = { id: p.id, ...(p.data() as any) };
        if (!data.deleted) {
          if (data.name) playerByName.set(String(data.name), data);
        }
      });

      // Fetch entries for the selected tournament
      const entriesSnapshot = await imports.getDocs(
        imports.query(
          imports.collection(imports.db, "tournamentEntries"),
          imports.where("tournamentId", "==", selectedTournament),
        ),
      );

      const batch = imports.writeBatch(imports.db);
      let updated = 0;
      const now = new Date().toISOString();

      for (const entryDoc of entriesSnapshot.docs) {
        const entry = entryDoc.data() as any;
        const docRef = imports.doc(
          imports.db,
          "tournamentEntries",
          entryDoc.id,
        );

        let changed = false;

        // Ensure seasonId
        if (!entry.seasonId && seasonId) {
          batch.update(docRef, { seasonId });
          changed = true;
        }

        // Ensure players exist as docs
        const playersArr = Array.isArray(entry.players) ? entry.players : [];
        for (const p of playersArr) {
          const ign = (p?.ign || "").trim();
          if (!ign) continue;
          if (!playerByName.has(ign)) {
            const newRef = imports.doc(
              imports.collection(imports.db, "players"),
            );
            const newDoc = {
              name: ign,
              category: "Uncategorized",
              phoneNumber: null,
              balance: 0,
              createdAt: now,
            } as any;
            batch.set(newRef, newDoc);
            playerByName.set(ign, { id: newRef.id, ...newDoc });
            changed = true;
          }
        }

        // Normalize matchScores to have arrays per player
        const scores = entry.matchScores || {};
        const playerLen = playersArr.length;
        let scoresChanged = false;
        const updatedScores: any = { ...scores };
        Object.keys(updatedScores).forEach((k) => {
          const ms = updatedScores[k] || {};
          const pk = Array.isArray(ms.playerKills) ? ms.playerKills : [];
          const part = Array.isArray(ms.playerParticipation)
            ? ms.playerParticipation
            : [];
          const normPK = pk
            .slice(0, playerLen)
            .concat(Array(Math.max(0, playerLen - pk.length)).fill(0));
          const basePart = part.length > 0 ? part : Array(playerLen).fill(true);
          const normPart = basePart
            .slice(0, playerLen)
            .concat(Array(Math.max(0, playerLen - basePart.length)).fill(true));
          const needUpdate =
            pk.length !== normPK.length || part.length !== normPart.length;
          if (needUpdate || !Array.isArray(ms.playerKD)) {
            ms.playerKills = normPK;
            ms.playerParticipation = normPart;
            ms.playerKD = normPK.map((kills: number, idx: number) =>
              normPart[idx] ? parseFloat((kills / 1).toFixed(1)) : 0,
            );
            updatedScores[k] = ms;
            scoresChanged = true;
          }
        });

        if (scoresChanged) {
          batch.update(docRef, { matchScores: updatedScores });
          changed = true;
        }

        if (changed) updated++;
      }

      if (updated > 0) {
        await batch.commit();
        imports.toast.success(`Fixed ${updated} team entries`);
      } else {
        imports.toast.info("No fixes were needed");
      }
    } catch (err) {
      console.error("Data fix failed:", err);
      imports.toast.error("Data fix failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] bg-background flex items-center justify-center">
        <LoaderFive text="Loading Teams..." />
      </div>
    );
  }

  return (
    <>
      <div className="border-none shadow-lg bg-background text-foreground">
        <div className="p-6 bg-background text-foreground">
          <imports.ActionToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            actions={
              <div className="flex flex-col gap-2 w-full">
                {/* First row: Season and Tournament selectors */}
                <div className="flex flex-wrap gap-2">
                  <SeasonSelector
                    selectedSeason={selectedSeason}
                    onSeasonChange={setSelectedSeason}
                    size="sm"
                    variant="blue"
                    placeholder="Season"
                    showAllSeasons={true}
                    className="w-28 sm:w-32 md:w-36 flex-1 min-w-0"
                  />
                  <imports.TournamentSelector
                    selected={selectedTournament}
                    onSelect={handleTournamentSelect}
                    tournaments={tournaments}
                    className="w-40 sm:w-48 md:w-56 flex-1 min-w-0"
                  />
                </div>
                {/* Second row: Match dropdown and buttons */}
                <div className="flex flex-nowrap gap-1.5 items-center overflow-x-auto pb-1 -mx-1 px-1">
                  <imports.MatchDropdown
                    selected={selectedMatch}
                    options={[
                      "All",
                      ...Array.from({ length: matchCount }, (_, i) =>
                        (i + 1).toString(),
                      ),
                    ]}
                    onSelect={setSelectedMatch}
                    onAddMatch={
                      !readOnly && teams.length > 0 ? handleAddMatch : undefined
                    }
                    className="w-20 sm:w-24 md:w-28 flex-shrink-0"
                    disabled={isSaving || !selectedTournament}
                  />
                  {!readOnly && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <imports.Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSequentialMatch(selectedMatch);
                              setShowSequentialModal(true);
                            }}
                            disabled={
                              selectedMatch === "All" || selectedMatch === ""
                            }
                            className="flex items-center gap-1.5 hover:bg-gray-100 transition-colors flex-shrink-0 px-2 py-1 text-xs sm:text-sm"
                          >
                            <FiEdit className="h-4 w-4" />
                            <span className="hidden lg:inline">
                              Sequential Edit
                            </span>
                          </imports.Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sequential Edit</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <imports.Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddTeamModal(true)}
                            disabled={!selectedTournament}
                            className="flex items-center gap-1.5 hover:bg-gray-100 transition-colors flex-shrink-0 px-2 py-1 text-xs sm:text-sm"
                          >
                            <FiPlus className="h-4 w-4" />
                            <span className="hidden lg:inline">Add Team</span>
                          </imports.Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add New Team</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <imports.Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStandingsModal(true)}
                        disabled={
                          !selectedTournament ||
                          teams.length === 0 ||
                          selectedMatch === ""
                        }
                        className="flex items-center gap-1.5 hover:bg-gray-100 transition-colors flex-shrink-0 px-2 py-1 text-xs sm:text-sm"
                      >
                        <FiAward className="h-4 w-4" />
                        <span className="hidden lg:inline">Standings</span>
                      </imports.Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Standings</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <imports.Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleExportCSV(
                            sortedTeams.map(({ team }) => team),
                            selectedMatch,
                            selectedConfig?.title || "Tournament",
                            tempEdits,
                          )
                        }
                        disabled={!selectedTournament || teams.length === 0}
                        className="flex items-center gap-1.5 hover:bg-gray-100 transition-colors flex-shrink-0 px-2 py-1 text-xs sm:text-sm"
                      >
                        <FiDownload className="h-4 w-4" />
                        <span className="hidden lg:inline">Export CSV</span>
                      </imports.Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export to CSV</p>
                    </TooltipContent>
                  </Tooltip>

                  {role === "SUPER_ADMIN" && (
                    <button
                      onClick={handleFixData}
                      className="ml-2 px-3 h-8 rounded bg-amber-500 text-white text-xs hover:bg-amber-600 flex-shrink-0"
                      title="Backfill seasonId, ensure players exist, and normalize match scores for the selected tournament"
                    >
                      Fix Data
                    </button>
                  )}
                </div>
              </div>
            }
          />
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Hunting for teams...
                </p>
              </div>
            </div>
          ) : sortedTeams.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <div className="w-12 h-12 mx-auto mb-4 opacity-50">
                <svg
                  className="w-full h-full"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">
                No teams match your filters
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or match selection
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <AnimatePresence>
                {sortedTeams.map(({ team, position }) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.4 }}
                  >
                    <imports.TeamCard
                      team={team}
                      searchTerm={searchTerm}
                      selectedMatch={selectedMatch}
                      onClick={
                        !readOnly && selectedMatch !== "All"
                          ? () => {
                              resetTempEdits();
                              setEditingTeam(team);
                              setEditingPlayer1Ign(team.players[0]?.ign || "");
                              setEditingPlayer2Ign(team.players[1]?.ign || "");
                            }
                          : undefined
                      }
                      onDelete={
                        !readOnly
                          ? async () => {
                              if (
                                window.confirm(
                                  `Are you sure you want to delete ${team.teamName}?`,
                                )
                              ) {
                                await deleteTeams([team.id]);
                              }
                            }
                          : undefined
                      }
                      tempEdits={tempEdits}
                      onTempEditChange={
                        !readOnly ? handleTempEditChange : undefined
                      }
                      position={position}
                      readOnly={readOnly}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      {/* Edit Team Modal */}
      {editingTeam && (
        <imports.EditTeamModal
          team={editingTeam}
          playerKills={
            editingTeam.matchScores?.[selectedMatch]?.playerKills?.map(
              String,
            ) ||
            Array(
              editingTeam.players.filter((p) => p.ign.trim() !== "").length,
            ).fill("0")
          }
          setPlayerKills={(kills) => {
            const updatedTeam = { ...editingTeam };
            if (!updatedTeam.matchScores) updatedTeam.matchScores = {};
            if (!updatedTeam.matchScores[selectedMatch])
              updatedTeam.matchScores[selectedMatch] = {
                kills: 0,
                placementPoints: 0,
                playerKills: [],
                playerParticipation: [],
                playerKD: [],
              };
            updatedTeam.matchScores[selectedMatch].playerKills = kills.map(
              (k) => parseInt(k) || 0,
            );
            setEditingTeam(updatedTeam);
          }}
          playerParticipation={
            editingTeam.matchScores?.[selectedMatch]?.playerParticipation ||
            Array(
              editingTeam.players.filter((p) => p.ign.trim() !== "").length,
            ).fill(true)
          }
          setPlayerParticipation={(participation) => {
            const updatedTeam = { ...editingTeam };
            if (!updatedTeam.matchScores) updatedTeam.matchScores = {};
            if (!updatedTeam.matchScores[selectedMatch])
              updatedTeam.matchScores[selectedMatch] = {
                kills: 0,
                placementPoints: 0,
                playerKills: [],
                playerParticipation: [],
                playerKD: [],
              };
            updatedTeam.matchScores[selectedMatch].playerParticipation =
              participation;
            setEditingTeam(updatedTeam);
          }}
          placementInput={
            editingTeam.matchScores?.[selectedMatch]?.placementPoints
              ? getPositionFromPoints(
                  editingTeam.matchScores[selectedMatch].placementPoints,
                ).toString()
              : "0"
          }
          setPlacementInput={(val) => {
            const updatedTeam = { ...editingTeam };
            if (!updatedTeam.matchScores) updatedTeam.matchScores = {};
            if (!updatedTeam.matchScores[selectedMatch])
              updatedTeam.matchScores[selectedMatch] = {
                kills: 0,
                placementPoints: 0,
                playerKills: [],
                playerParticipation: [],
                playerKD: [],
              };
            const position = parseInt(val) || 0;
            updatedTeam.matchScores[selectedMatch].placementPoints =
              calculatePlacementPoints(position);
            setEditingTeam(updatedTeam);
          }}
          player1Ign={editingPlayer1Ign}
          setPlayer1Ign={setEditingPlayer1Ign}
          player2Ign={editingPlayer2Ign}
          setPlayer2Ign={setEditingPlayer2Ign}
          // Pass the original teamName for the modal title, it won't be directly editable here
          teamName={editingTeam.teamName} // Used for modal title, not for direct edit in modal now
          kills={
            editingTeam.matchScores?.[selectedMatch]?.kills.toString() || "0"
          }
          setKills={(kills) => {
            const updatedTeam = { ...editingTeam };
            if (!updatedTeam.matchScores) updatedTeam.matchScores = {};
            if (!updatedTeam.matchScores[selectedMatch])
              updatedTeam.matchScores[selectedMatch] = {
                kills: 0,
                placementPoints: 0,
                playerKills: [],
                playerParticipation: [],
                playerKD: [],
              };
            updatedTeam.matchScores[selectedMatch].kills = parseInt(kills) || 0;
            setEditingTeam(updatedTeam);
          }}
          onClose={() => setEditingTeam(null)}
          onSave={async () => {
            if (editingTeam) {
              const updatedScores = editingTeam.matchScores || {};
              if (!updatedScores[selectedMatch])
                updatedScores[selectedMatch] = {
                  kills: 0,
                  placementPoints: 0,
                  playerKills: [],
                  playerParticipation: [],
                  playerKD: [],
                };
              updatedScores[selectedMatch].kills =
                parseInt(updatedScores[selectedMatch].kills.toString()) || 0;
              const totalPlayerKills = updatedScores[
                selectedMatch
              ].playerKills.reduce((sum, k) => sum + (k || 0), 0);
              const editablePlayers = editingTeam.players.filter(
                (p) => p.ign.trim() !== "",
              ).length;
              updatedScores[selectedMatch].playerKills = updatedScores[
                selectedMatch
              ].playerKills.slice(0, editablePlayers);
              while (
                updatedScores[selectedMatch].playerKills.length <
                editablePlayers
              ) {
                updatedScores[selectedMatch].playerKills.push(0);
              }
              const docRef = imports.doc(
                imports.db,
                "tournamentEntries",
                editingTeam.id,
              );

              // Construct the new team name from player IGNs
              let newTeamName = editingPlayer1Ign.trim();
              if (editingPlayer2Ign.trim()) {
                newTeamName += `_${editingPlayer2Ign.trim()}`;
              }

              const updatedPlayersData = [...editingTeam.players];
              if (updatedPlayersData[0]) {
                updatedPlayersData[0] = {
                  ...updatedPlayersData[0],
                  ign: editingPlayer1Ign.trim(),
                };
              } else {
                updatedPlayersData[0] = {
                  ign: editingPlayer1Ign.trim(),
                  kills: 0,
                }; // Assuming new player starts with 0 kills
              }

              if (editingPlayer2Ign.trim()) {
                if (updatedPlayersData[1]) {
                  updatedPlayersData[1] = {
                    ...updatedPlayersData[1],
                    ign: editingPlayer2Ign.trim(),
                  };
                } else {
                  updatedPlayersData[1] = {
                    ign: editingPlayer2Ign.trim(),
                    kills: 0,
                  }; // Assuming new player starts with 0 kills
                }
              } else if (updatedPlayersData.length > 1) {
                // If player 2 IGN is cleared, remove player 2 from the array
                updatedPlayersData.splice(1, 1);
              }

              // Ensure playerKills and playerParticipation in matchScores matches the new number of players
              const finalPlayersCount = updatedPlayersData.filter(
                (p) => p.ign.trim() !== "",
              ).length;
              const finalPlayerKills = (
                updatedScores[selectedMatch]?.playerKills || []
              ).slice(0, finalPlayersCount);
              const finalPlayerParticipation = (
                updatedScores[selectedMatch]?.playerParticipation || []
              ).slice(0, finalPlayersCount);

              while (finalPlayerKills.length < finalPlayersCount) {
                finalPlayerKills.push(0);
              }
              while (finalPlayerParticipation.length < finalPlayersCount) {
                finalPlayerParticipation.push(true); // Default to participated
              }

              if (updatedScores[selectedMatch]) {
                updatedScores[selectedMatch].playerKills = finalPlayerKills;
                updatedScores[selectedMatch].playerParticipation =
                  finalPlayerParticipation;
              }

              await imports.updateDoc(docRef, {
                matchScores: updatedScores,
                teamName: newTeamName, // Use the reconstructed team name
                players: updatedPlayersData.filter((p) => p.ign.trim() !== ""), // Save updated players array
              });
              setEditingTeam(null);
              resetTempEdits(); // Clear tempEdits after successful save
            }
          }}
          allTeams={teams}
        />
      )}

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <imports.AddTeamModal
          onClose={() => setShowAddTeamModal(false)}
          onSave={handleAddTeam}
          isSaving={isSaving}
        />
      )}

      {/* Sequential Editing Modal */}
      <imports.SequentialEditModal
        showSequentialModal={showSequentialModal}
        handleSequentialClose={() =>
          handleSequentialClose(
            hasUnsavedChanges(), // Uses the function from useSequentialEditing
            resetTempEdits,
            setPlacementErrors,
            setTotalPlayersPlayed,
            setTotalKillsError,
            setShowSequentialModal,
          )
        }
        sequentialMatch={sequentialMatch}
        totalPlayersPlayed={totalPlayersPlayed}
        setTotalPlayersPlayed={setTotalPlayersPlayed}
        totalKillsError={totalKillsError}
        sortedTeams={sortedTeams.map(({ team }) => team)}
        tempEdits={tempEdits}
        placementErrors={placementErrors}
        handleSetTempEdit={(teamId, field, value) =>
          handleSetTempEdit(
            teamId,
            field,
            value,
            setTempEdit,
            setPlacementErrors,
            teams,
            sequentialMatch,
            tempEdits,
          )
        }
        onSave={() =>
          handleSequentialSave(
            placementErrors,
            totalPlayersPlayed,
            teams,
            tempEdits,
            sequentialMatch,
            saveEdits,
            setShowSequentialModal,
            setPlacementErrors,
            setTotalPlayersPlayed,
            setTotalKillsError,
          )
        }
      />

      {/* Standings Modal */}
      <imports.OverallStandingModal
        visible={showStandingsModal}
        onClose={() => setShowStandingsModal(false)}
        teams={teams}
        backgroundImage={selectedConfig?.backgroundImage || "/images/image.png"}
        selectedMatch={selectedMatch} // Passing the actual selected match
        tournamentTitle={selectedConfig?.title || "Tournament"}
        maxMatchNumber={matchCount}
        selectedSeason={selectedSeason}
      />
    </>
  );
}
