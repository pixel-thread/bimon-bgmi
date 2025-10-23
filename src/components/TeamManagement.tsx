"use client";

import { useState } from "react";
import { FiEdit, FiAward, FiDownload, FiPlus } from "react-icons/fi";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import {
  ActionToolbar,
  Button,
  MatchDropdown,
  TeamCard,
  toast,
  TournamentSelector,
} from "./teamManagementImports";
import { motion, AnimatePresence } from "framer-motion";
import { SeasonSelector } from "./SeasonSelector";
import { LoaderFive } from "@/src/components/ui/loader";
import { useAuth } from "@/src/hooks/useAuth";
import { useTeams } from "../hooks/team/useTeams";
import { useTournament } from "../hooks/tournament/useTournament";
import { useTournamentStore } from "../store/tournament";

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
  const { tournamentId: selectedTournament } = useTournamentStore();
  const [showSequentialModal, setShowSequentialModal] = useState(false);
  const [showStandingsModal, setShowStandingsModal] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [placementErrors, setPlacementErrors] = useState<{
    [teamId: string]: string;
  }>({});
  const [totalPlayersPlayed, setTotalPlayersPlayed] = useState("");
  const [totalKillsError, setTotalKillsError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showNoTeamsMessage, setShowNoTeamsMessage] = useState(false);
  const { data: sortedTeams } = useTeams();

  // Use teams from Firestore
  const { data: teams, isFetching: loading } = useTeams();

  // Reset selected tournament if it's not in the filtered list

  // Local matchCount state defaulted to 0
  const [matchCount, setMatchCount] = useState(0);

  // When adding a match, increment the local matchCount.
  const handleAddMatch = async () => {};

  // Handle delayed no-teams message - placed after sortedTeams is defined

  // One-click data fix: backfill seasonId, ensure player docs, normalize matchScores
  const handleFixData = async () => {
    try {
    } catch (err) {
      toast.error("Data fix failed");
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
          <ActionToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            actions={
              <div className="flex flex-col gap-2 w-full">
                {/* First row: Season and Tournament selectors */}
                <div className="flex flex-wrap gap-2">
                  <SeasonSelector
                    size="sm"
                    variant="blue"
                    placeholder="Season"
                    showAllSeasons={true}
                    className="w-28 sm:w-32 md:w-36 flex-1 min-w-0"
                  />
                  <TournamentSelector className="w-40 sm:w-48 md:w-56 flex-1 min-w-0" />
                </div>
                {/* Second row: Match dropdown and buttons */}
                <div className="flex flex-nowrap gap-1.5 items-center overflow-x-auto pb-1 -mx-1 px-1">
                  <MatchDropdown
                    selected={selectedMatch}
                    options={[
                      "All",
                      ...Array.from({ length: matchCount }, (_, i) =>
                        (i + 1).toString(),
                      ),
                    ]}
                    onSelect={setSelectedMatch}
                    onAddMatch={handleAddMatch}
                    className="w-20 sm:w-24 md:w-28 flex-shrink-0"
                    disabled={isSaving || !selectedTournament}
                  />
                  {!readOnly && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // setSequentialMatch(selectedMatch);
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
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sequential Edit</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddTeamModal(true)}
                            disabled={!selectedTournament}
                            className="flex items-center gap-1.5 hover:bg-gray-100 transition-colors flex-shrink-0 px-2 py-1 text-xs sm:text-sm"
                          >
                            <FiPlus className="h-4 w-4" />
                            <span className="hidden lg:inline">Add Team</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add New Team</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStandingsModal(true)}
                        disabled={
                          !selectedTournament ||
                          teams?.length === 0 ||
                          selectedMatch === ""
                        }
                        className="flex items-center gap-1.5 hover:bg-gray-100 transition-colors flex-shrink-0 px-2 py-1 text-xs sm:text-sm"
                      >
                        <FiAward className="h-4 w-4" />
                        <span className="hidden lg:inline">Standings</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Standings</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!selectedTournament || teams?.length === 0}
                        className="flex items-center gap-1.5 hover:bg-gray-100 transition-colors flex-shrink-0 px-2 py-1 text-xs sm:text-sm"
                      >
                        <FiDownload className="h-4 w-4" />
                        <span className="hidden lg:inline">Export CSV</span>
                      </Button>
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
          ) : sortedTeams?.length === 0 ? (
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
                {sortedTeams &&
                  sortedTeams?.map((team, index) => (
                    <motion.div
                      key={team.id + index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.4 }}
                    >
                      <TeamCard
                        onClick={() => {}}
                        team={team}
                        searchTerm={searchTerm}
                        selectedMatch={selectedMatch}
                        // onClick={
                        // !readOnly && selectedMatch !== "All"
                        //   ? () => {
                        //       resetTempEdits();
                        //       setEditingTeam(team);
                        //       setEditingPlayer1Ign(
                        //         team.players[0]?.ign || "",
                        //       );
                        //       setEditingPlayer2Ign(
                        //         team.players[1]?.ign || "",
                        //       );
                        //     }
                        //   : undefined
                        //}
                        // onDelete={
                        // !readOnly
                        //   ? async () => {
                        //       if (
                        //         window.confirm(
                        //           `Are you sure you want to delete ${team.teamName}?`,
                        //         )
                        //       ) {
                        //         await deleteTeams([team.id]);
                        //       }
                        //     }
                        //   : undefined
                        //}
                        // tempEdits={tempEdits}
                        // onTempEditChange={
                        //   !readOnly ? handleTempEditChange : undefined
                        // }
                        position={team.position}
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
      {/* {editingTeam && ( */}
      {/*   <imports.EditTeamModal */}
      {/*     team={editingTeam} */}
      {/*     playerKills={ */}
      {/*       editingTeam.matchScores?.[selectedMatch]?.playerKills?.map( */}
      {/*         String, */}
      {/*       ) || */}
      {/*       Array( */}
      {/*         editingTeam.players.filter((p) => p.ign.trim() !== "").length, */}
      {/*       ).fill("0") */}
      {/*     } */}
      {/*     setPlayerKills={(kills) => { */}
      {/*       const updatedTeam = { ...editingTeam }; */}
      {/*       if (!updatedTeam.matchScores) updatedTeam.matchScores = {}; */}
      {/*       if (!updatedTeam.matchScores[selectedMatch]) */}
      {/*         updatedTeam.matchScores[selectedMatch] = { */}
      {/*           kills: 0, */}
      {/*           placementPoints: 0, */}
      {/*           playerKills: [], */}
      {/*           playerParticipation: [], */}
      {/*           playerKD: [], */}
      {/*         }; */}
      {/*       updatedTeam.matchScores[selectedMatch].playerKills = kills.map( */}
      {/*         (k) => parseInt(k) || 0, */}
      {/*       ); */}
      {/*       setEditingTeam(updatedTeam); */}
      {/*     }} */}
      {/*     playerParticipation={ */}
      {/*       editingTeam.matchScores?.[selectedMatch]?.playerParticipation || */}
      {/*       Array( */}
      {/*         editingTeam.players.filter((p) => p.ign.trim() !== "").length, */}
      {/*       ).fill(true) */}
      {/*     } */}
      {/*     setPlayerParticipation={(participation) => { */}
      {/*       const updatedTeam = { ...editingTeam }; */}
      {/*       if (!updatedTeam.matchScores) updatedTeam.matchScores = {}; */}
      {/*       if (!updatedTeam.matchScores[selectedMatch]) */}
      {/*         updatedTeam.matchScores[selectedMatch] = { */}
      {/*           kills: 0, */}
      {/*           placementPoints: 0, */}
      {/*           playerKills: [], */}
      {/*           playerParticipation: [], */}
      {/*           playerKD: [], */}
      {/*         }; */}
      {/*       updatedTeam.matchScores[selectedMatch].playerParticipation = */}
      {/*         participation; */}
      {/*       setEditingTeam(updatedTeam); */}
      {/*     }} */}
      {/*     placementInput={ */}
      {/*       editingTeam.matchScores?.[selectedMatch]?.placementPoints */}
      {/*         ? getPositionFromPoints( */}
      {/*             editingTeam.matchScores[selectedMatch].placementPoints, */}
      {/*           ).toString() */}
      {/*         : "0" */}
      {/*     } */}
      {/*     setPlacementInput={(val) => { */}
      {/*       const updatedTeam = { ...editingTeam }; */}
      {/*       if (!updatedTeam.matchScores) updatedTeam.matchScores = {}; */}
      {/*       if (!updatedTeam.matchScores[selectedMatch]) */}
      {/*         updatedTeam.matchScores[selectedMatch] = { */}
      {/*           kills: 0, */}
      {/*           placementPoints: 0, */}
      {/*           playerKills: [], */}
      {/*           playerParticipation: [], */}
      {/*           playerKD: [], */}
      {/*         }; */}
      {/*       const position = parseInt(val) || 0; */}
      {/*       updatedTeam.matchScores[selectedMatch].placementPoints = */}
      {/*         calculatePlacementPoints(position); */}
      {/*       setEditingTeam(updatedTeam); */}
      {/*     }} */}
      {/*     player1Ign={editingPlayer1Ign} */}
      {/*     setPlayer1Ign={setEditingPlayer1Ign} */}
      {/*     player2Ign={editingPlayer2Ign} */}
      {/*     setPlayer2Ign={setEditingPlayer2Ign} */}
      {/*     // Pass the original teamName for the modal title, it won't be directly editable here */}
      {/*     teamName={editingTeam.teamName} // Used for modal title, not for direct edit in modal now */}
      {/*     kills={ */}
      {/*       editingTeam.matchScores?.[selectedMatch]?.kills.toString() || "0" */}
      {/*     } */}
      {/*     setKills={(kills) => { */}
      {/*       const updatedTeam = { ...editingTeam }; */}
      {/*       if (!updatedTeam.matchScores) updatedTeam.matchScores = {}; */}
      {/*       if (!updatedTeam.matchScores[selectedMatch]) */}
      {/*         updatedTeam.matchScores[selectedMatch] = { */}
      {/*           kills: 0, */}
      {/*           placementPoints: 0, */}
      {/*           playerKills: [], */}
      {/*           playerParticipation: [], */}
      {/*           playerKD: [], */}
      {/*         }; */}
      {/*       updatedTeam.matchScores[selectedMatch].kills = parseInt(kills) || 0; */}
      {/*       setEditingTeam(updatedTeam); */}
      {/*     }} */}
      {/*     onClose={() => setEditingTeam(null)} */}
      {/*     onSave={async () => { */}
      {/*       if (editingTeam) { */}
      {/*         const updatedScores = editingTeam.matchScores || {}; */}
      {/*         if (!updatedScores[selectedMatch]) */}
      {/*           updatedScores[selectedMatch] = { */}
      {/*             kills: 0, */}
      {/*             placementPoints: 0, */}
      {/*             playerKills: [], */}
      {/*             playerParticipation: [], */}
      {/*             playerKD: [], */}
      {/*           }; */}
      {/*         updatedScores[selectedMatch].kills = */}
      {/*           parseInt(updatedScores[selectedMatch].kills.toString()) || 0; */}
      {/*         const totalPlayerKills = updatedScores[ */}
      {/*           selectedMatch */}
      {/*         ].playerKills.reduce((sum, k) => sum + (k || 0), 0); */}
      {/*         const editablePlayers = editingTeam.players.filter( */}
      {/*           (p) => p.ign.trim() !== "", */}
      {/*         ).length; */}
      {/*         updatedScores[selectedMatch].playerKills = updatedScores[ */}
      {/*           selectedMatch */}
      {/*         ].playerKills.slice(0, editablePlayers); */}
      {/*         while ( */}
      {/*           updatedScores[selectedMatch].playerKills.length < */}
      {/*           editablePlayers */}
      {/*         ) { */}
      {/*           updatedScores[selectedMatch].playerKills.push(0); */}
      {/*         } */}
      {/*         const docRef = imports.doc( */}
      {/*           imports.db, */}
      {/*           "tournamentEntries", */}
      {/*           editingTeam.id, */}
      {/*         ); */}

      {/*         // Construct the new team name from player IGNs */}
      {/*         let newTeamName = editingPlayer1Ign.trim(); */}
      {/*         if (editingPlayer2Ign.trim()) { */}
      {/*           newTeamName += `_${editingPlayer2Ign.trim()}`; */}
      {/*         } */}

      {/*         const updatedPlayersData = [...editingTeam.players]; */}
      {/*         if (updatedPlayersData[0]) { */}
      {/*           updatedPlayersData[0] = { */}
      {/*             ...updatedPlayersData[0], */}
      {/*             ign: editingPlayer1Ign.trim(), */}
      {/*           }; */}
      {/*         } else { */}
      {/*           updatedPlayersData[0] = { */}
      {/*             ign: editingPlayer1Ign.trim(), */}
      {/*             kills: 0, */}
      {/*           }; // Assuming new player starts with 0 kills */}
      {/*         } */}

      {/*         if (editingPlayer2Ign.trim()) { */}
      {/*           if (updatedPlayersData[1]) { */}
      {/*             updatedPlayersData[1] = { */}
      {/*               ...updatedPlayersData[1], */}
      {/*               ign: editingPlayer2Ign.trim(), */}
      {/*             }; */}
      {/*           } else { */}
      {/*             updatedPlayersData[1] = { */}
      {/*               ign: editingPlayer2Ign.trim(), */}
      {/*               kills: 0, */}
      {/*             }; // Assuming new player starts with 0 kills */}
      {/*           } */}
      {/*         } else if (updatedPlayersData.length > 1) { */}
      {/*           // If player 2 IGN is cleared, remove player 2 from the array */}
      {/*           updatedPlayersData.splice(1, 1); */}
      {/*         } */}

      {/*         // Ensure playerKills and playerParticipation in matchScores matches the new number of players */}
      {/*         const finalPlayersCount = updatedPlayersData.filter( */}
      {/*           (p) => p.ign.trim() !== "", */}
      {/*         ).length; */}
      {/*         const finalPlayerKills = ( */}
      {/*           updatedScores[selectedMatch]?.playerKills || [] */}
      {/*         ).slice(0, finalPlayersCount); */}
      {/*         const finalPlayerParticipation = ( */}
      {/*           updatedScores[selectedMatch]?.playerParticipation || [] */}
      {/*         ).slice(0, finalPlayersCount); */}

      {/*         while (finalPlayerKills.length < finalPlayersCount) { */}
      {/*           finalPlayerKills.push(0); */}
      {/*         } */}
      {/*         while (finalPlayerParticipation.length < finalPlayersCount) { */}
      {/*           finalPlayerParticipation.push(true); // Default to participated */}
      {/*         } */}

      {/*         if (updatedScores[selectedMatch]) { */}
      {/*           updatedScores[selectedMatch].playerKills = finalPlayerKills; */}
      {/*           updatedScores[selectedMatch].playerParticipation = */}
      {/*             finalPlayerParticipation; */}
      {/*         } */}

      {/*         await imports.updateDoc(docRef, { */}
      {/*           matchScores: updatedScores, */}
      {/*           teamName: newTeamName, // Use the reconstructed team name */}
      {/*           players: updatedPlayersData.filter((p) => p.ign.trim() !== ""), // Save updated players array */}
      {/*         }); */}
      {/*         setEditingTeam(null); */}
      {/*         resetTempEdits(); // Clear tempEdits after successful save */}
      {/*       } */}
      {/*     }} */}
      {/*     allTeams={teams} */}
      {/*   /> */}
      {/* )} */}

      {/* Add Team Modal */}
      {/* {showAddTeamModal && ( */}
      {/*   <imports.AddTeamModal */}
      {/*     onClose={() => setShowAddTeamModal(false)} */}
      {/*     onSave={handleAddTeam} */}
      {/*     isSaving={isSaving} */}
      {/*   /> */}
      {/* )} */}

      {/* Sequential Editing Modal */}
      {/* <imports.SequentialEditModal */}
      {/*   showSequentialModal={showSequentialModal} */}
      {/*   handleSequentialClose={() => */}
      {/*     handleSequentialClose( */}
      {/*       hasUnsavedChanges(), // Uses the function from useSequentialEditing */}
      {/*       resetTempEdits, */}
      {/*       setPlacementErrors, */}
      {/*       setTotalPlayersPlayed, */}
      {/*       setTotalKillsError, */}
      {/*       setShowSequentialModal, */}
      {/*     ) */}
      {/*   } */}
      {/*   sequentialMatch={sequentialMatch} */}
      {/*   totalPlayersPlayed={totalPlayersPlayed} */}
      {/*   setTotalPlayersPlayed={setTotalPlayersPlayed} */}
      {/*   totalKillsError={totalKillsError} */}
      {/*   sortedTeams={sortedTeams?.map(({ team }) => team)} */}
      {/*   tempEdits={tempEdits} */}
      {/*   placementErrors={placementErrors} */}
      {/*   handleSetTempEdit={(teamId, field, value) => */}
      {/*     handleSetTempEdit( */}
      {/*       teamId, */}
      {/*       field, */}
      {/*       value, */}
      {/*       setTempEdit, */}
      {/*       setPlacementErrors, */}
      {/*       teams, */}
      {/*       sequentialMatch, */}
      {/*       tempEdits, */}
      {/*     ) */}
      {/*   } */}
      {/*   onSave={() => */}
      {/*     handleSequentialSave( */}
      {/*       placementErrors, */}
      {/*       totalPlayersPlayed, */}
      {/*       teams, */}
      {/*       tempEdits, */}
      {/*       sequentialMatch, */}
      {/*       saveEdits, */}
      {/*       setShowSequentialModal, */}
      {/*       setPlacementErrors, */}
      {/*       setTotalPlayersPlayed, */}
      {/*       setTotalKillsError, */}
      {/*     ) */}
      {/*   } */}
      {/* /> */}

      {/* Standings Modal */}
      {/* <imports.OverallStandingModal */}
      {/*   visible={showStandingsModal} */}
      {/*   onClose={() => setShowStandingsModal(false)} */}
      {/*   teams={teams} */}
      {/*   backgroundImage={selectedConfig?.backgroundImage || "/images/image.png"} */}
      {/*   selectedMatch={selectedMatch} // Passing the actual selected match */}
      {/*   tournamentTitle={selectedConfig?.title || "Tournament"} */}
      {/*   maxMatchNumber={matchCount} */}
      {/*   selectedSeason={selectedSeason} */}
      {/* /> */}
    </>
  );
}
