"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Player, TournamentConfig } from "@/src/lib/types";
import { toast } from "sonner";
import { Trophy, Search, Plus, AlertCircle, Trash2 } from "lucide-react";
import { SeasonSelector } from "./SeasonSelector";
import { LoaderFive } from "@/src/components/ui/loader";

interface TournamentResult {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  date: string;
  firstPlace: string[]; // Array of two player IDs
  secondPlace: string[]; // Array of two player IDs
}

interface WinnersTabProps {
  readOnly?: boolean;
}

export function WinnersTab({ readOnly = false }: WinnersTabProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<TournamentConfig[]>([]);
  const [tournamentResults, setTournamentResults] = useState<
    TournamentResult[]
  >([]);
  const [displayedResults, setDisplayedResults] = useState<TournamentResult[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState<string>("6");
  const [customPeriod, setCustomPeriod] = useState<string>("");
  const [useCustomPeriod, setUseCustomPeriod] = useState<boolean>(false);
  const [resultsPage, setResultsPage] = useState(1);
  const resultsPerPage = 10;
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [isSeasonInitialized, setIsSeasonInitialized] = useState(false);

  // New tournament result form state
  const [newResult, setNewResult] = useState<{
    tournamentId: string;
    firstPlace: string[];
    secondPlace: string[];
  }>({
    tournamentId: "",
    firstPlace: [""],
    secondPlace: [""],
  });

  // Search state for player selection
  const [playerSearch, setPlayerSearch] = useState({
    firstPlace: "",
    secondPlace: "",
  });
  const [activeInput, setActiveInput] = useState<
    "firstPlace" | "secondPlace" | null
  >(null);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [showAddPlayerButtons, setShowAddPlayerButtons] = useState({
    firstPlace: false,
    secondPlace: false,
  });

  // Player win statistics
  const [playerStats, setPlayerStats] = useState<{
    [playerId: string]: number;
  }>({});

  // Reference for infinite scroll
  const resultsContainerRef = React.useRef<HTMLDivElement>(null);

  // Initialize season on component mount
  useEffect(() => {
    const initializeSeason = async () => {
      try {
        const seasonsSnapshot = await getDocs(collection(db, "seasons"));
        const seasonsData = seasonsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as any)
        );

        // Sort by creation date, newest first
        seasonsData.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (seasonsData.length > 0) {
          // Find active season or use the newest one
          const activeSeason =
            seasonsData.find((season) => season.isActive) || seasonsData[0];
          setSelectedSeason(activeSeason.id);
        } else {
          // No seasons exist, default to "all"
          setSelectedSeason("all");
        }
        setIsSeasonInitialized(true);
      } catch (error) {
        console.error("Error initializing season:", error);
        setSelectedSeason("all");
        setIsSeasonInitialized(true);
      }
    };

    initializeSeason();
  }, []);

  useEffect(() => {
    if (isSeasonInitialized && selectedSeason) {
      fetchData();
    }
  }, [selectedSeason, isSeasonInitialized]);

  // Load initial results when tournament data is fetched
  useEffect(() => {
    if (tournamentResults.length > 0) {
      loadMoreResults();
    }
  }, [tournamentResults]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!resultsContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } =
        resultsContainerRef.current;

      // If scrolled to bottom (with a small threshold)
      if (scrollHeight - scrollTop - clientHeight < 50) {
        if (
          !isLoadingMore &&
          displayedResults.length < tournamentResults.length
        ) {
          loadMoreResults();
        }
      }
    };

    const container = resultsContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isLoadingMore, displayedResults.length, tournamentResults.length]);

  // Set default tournament when tournaments are loaded
  useEffect(() => {
    if (tournaments.length > 0) {
      // Sort tournaments by creation date (most recent first)
      // We'll use the createdAt field if it exists, otherwise fall back to startDate
      const sortedTournaments = [...tournaments].sort((a, b) => {
        // If createdAt exists on both, use it for comparison
        if (a.createdAt && b.createdAt) {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        // Otherwise fall back to startDate
        return (
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
      });

      // Set the most recent tournament as default
      setNewResult((prev) => ({
        ...prev,
        tournamentId: sortedTournaments[0].id,
      }));
    }
  }, [tournaments]);

  // Update add player buttons visibility
  useEffect(() => {
    setShowAddPlayerButtons({
      firstPlace: newResult.firstPlace.filter((id) => id).length === 1,
      secondPlace: newResult.secondPlace.filter((id) => id).length === 1,
    });
  }, [newResult.firstPlace, newResult.secondPlace]);

  useEffect(() => {
    calculatePlayerStats();
  }, [tournamentResults, statsPeriod, tournaments]);

  // Filter players based on search input
  useEffect(() => {
    if (!activeInput || playerSearch[activeInput].trim() === "") {
      setFilteredPlayers([]);
      return;
    }

    // Filter out players that are already selected
    const selectedPlayerIds = [
      ...newResult.firstPlace,
      ...newResult.secondPlace,
    ].filter((id) => id);

    const filtered = players.filter(
      (player) =>
        player.name
          .toLowerCase()
          .includes(playerSearch[activeInput].toLowerCase()) &&
        !selectedPlayerIds.includes(player.id)
    );

    // Sort filtered players alphabetically for easier selection
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredPlayers(filtered);
  }, [playerSearch, players, activeInput, newResult]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch players and exclude soft-deleted ones
      const playersCollection = collection(db, "players");
      const playersSnapshot = await getDocs(playersCollection);
      const playersData: Player[] = [];
      playersSnapshot.forEach((doc) => {
        const player = { id: doc.id, ...doc.data() } as Player;
        if (!player.deleted) {
          playersData.push(player);
        }
      });
      setPlayers(playersData);

      // Fetch tournaments filtered by season
      const tournamentsQuery =
        selectedSeason === "all"
          ? collection(db, "tournaments")
          : query(
              collection(db, "tournaments"),
              where("seasonId", "==", selectedSeason)
            );

      const tournamentsSnapshot = await getDocs(tournamentsQuery);
      const tournamentsData: TournamentConfig[] = [];
      tournamentsSnapshot.forEach((doc) => {
        tournamentsData.push({ id: doc.id, ...doc.data() } as TournamentConfig);
      });
      setTournaments(tournamentsData);

      // Get tournament IDs for filtering results
      const tournamentIds = tournamentsData.map((t) => t.id);

      // Fetch tournament results - filter by tournament IDs if season is selected
      const resultsCollection = collection(db, "tournamentResults");
      const resultsQuery = query(resultsCollection, orderBy("date", "desc"));
      const resultsSnapshot = await getDocs(resultsQuery);
      const resultsData: TournamentResult[] = [];
      resultsSnapshot.forEach((doc) => {
        const result = { id: doc.id, ...doc.data() } as TournamentResult;
        // Filter results by season if a specific season is selected
        if (
          selectedSeason === "all" ||
          tournamentIds.includes(result.tournamentId)
        ) {
          resultsData.push(result);
        }
      });
      setTournamentResults(resultsData);
      setDisplayedResults([]); // Clear displayed results when fetching new data
      setResultsPage(1); // Reset page when fetching new data
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load more results for infinite scroll
  const loadMoreResults = () => {
    if (isLoadingMore || displayedResults.length >= tournamentResults.length)
      return;

    setIsLoadingMore(true);

    // Calculate start and end indices for the next page
    const startIndex = (resultsPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;

    // Get the next batch of results
    const nextBatch = tournamentResults.slice(startIndex, endIndex);

    // Update displayed results
    setDisplayedResults((prev) => [...prev, ...nextBatch]);
    setResultsPage((prev) => prev + 1);
    setIsLoadingMore(false);
  };

  const calculatePlayerStats = () => {
    const stats: { [playerId: string]: number } = {};

    // Get only the most recent N tournaments based on statsPeriod
    const periodNum = parseInt(statsPeriod);

    // Sort tournaments by creation date
    // We're using the date field from tournamentResults which represents when the result was created
    // This ensures we're looking at the most recently created tournaments
    const sortedResults = [...tournamentResults].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Filter results to only include those from recent tournaments
    const recentResults = sortedResults.filter((_, index) => index < periodNum);

    // Count placements for each player
    recentResults.forEach((result) => {
      // Count first place
      result.firstPlace.forEach((playerId) => {
        if (playerId) {
          stats[playerId] = (stats[playerId] || 0) + 1;
        }
      });

      // Also count second place for complete statistics
      result.secondPlace.forEach((playerId) => {
        if (playerId) {
          stats[playerId] = (stats[playerId] || 0) + 1;
        }
      });
    });

    setPlayerStats(stats);
  };

  const handleDeleteResult = async (resultId: string) => {
    if (!confirm("Are you sure you want to delete this tournament result?")) {
      return;
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "tournamentResults", resultId));

      // Update local state
      setTournamentResults((prevResults) =>
        prevResults.filter((result) => result.id !== resultId)
      );

      // Also update displayed results
      setDisplayedResults((prevResults) =>
        prevResults.filter((result) => result.id !== resultId)
      );

      toast.success("Tournament result deleted successfully");
    } catch (error) {
      console.error("Error deleting tournament result:", error);
      toast.error("Failed to delete tournament result");
    }
  };

  const handleAddResult = async () => {
    // Validate form
    if (!newResult.tournamentId) {
      toast.error("Please select a tournament");
      return;
    }

    // Filter out empty player IDs
    const firstPlace = newResult.firstPlace.filter((id) => id);
    const secondPlace = newResult.secondPlace.filter((id) => id);

    if (firstPlace.length === 0 || secondPlace.length === 0) {
      toast.error("Please select at least one player for each placement");
      return;
    }

    // Check for duplicate players
    const allPlayers = [...firstPlace, ...secondPlace];
    const uniquePlayers = new Set(allPlayers);
    if (uniquePlayers.size !== allPlayers.length) {
      toast.error(
        "A player cannot be in both 1st and 2nd place for the same tournament"
      );
      return;
    }

    setIsSaving(true);
    try {
      // Get tournament title
      const tournamentDoc = await getDoc(
        doc(db, "tournaments", newResult.tournamentId)
      );
      if (!tournamentDoc.exists()) {
        toast.error("Tournament not found");
        return;
      }
      const tournamentTitle = tournamentDoc.data().title;

      // Save to Firestore
      const resultData = {
        tournamentId: newResult.tournamentId,
        tournamentTitle,
        date: new Date().toISOString(),
        firstPlace: newResult.firstPlace.filter((id) => id),
        secondPlace: newResult.secondPlace.filter((id) => id),
      };

      const docRef = await addDoc(
        collection(db, "tournamentResults"),
        resultData
      );

      // Update local state
      const newResultWithId = {
        id: docRef.id,
        ...resultData,
      } as TournamentResult;
      setTournamentResults((prev) => [newResultWithId, ...prev]);

      // Add to displayed results if we're on the first page
      setDisplayedResults((prev) => {
        // Only add to displayed results if we're showing the first page
        if (resultsPage <= 2) {
          return [newResultWithId, ...prev];
        }
        return prev;
      });

      // Reset form and close dialog
      const sortedTournaments = [...tournaments].sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

      setNewResult({
        tournamentId:
          sortedTournaments.length > 0 ? sortedTournaments[0].id : "",
        firstPlace: [""],
        secondPlace: [""],
      });
      setPlayerSearch({ firstPlace: "", secondPlace: "" });
      setActiveInput(null);
      setIsDialogOpen(false);
      toast.success("Tournament result added successfully");
    } catch (error) {
      console.error("Error adding tournament result:", error);
      toast.error("Failed to add tournament result");
    } finally {
      setIsSaving(false);
    }
  };

  const getPlayerName = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    return player ? player.name : "Unknown Player";
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] bg-background flex items-center justify-center">
        <LoaderFive text="Loading Winners..." />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Card className="rounded-xl shadow border border-gray-200 dark:border-white/20 bg-background dark:bg-black text-foreground">
        <CardContent className="p-4">
          {/* Header */}
          <div className="pt-6 flex flex-col gap-2 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  Tournament Winners
                </h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground">
                  {parseInt(statsPeriod)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2">
                <SeasonSelector
                  selectedSeason={selectedSeason}
                  onSeasonChange={setSelectedSeason}
                  size="sm"
                  variant="purple"
                  placeholder="Season"
                  showAllSeasons={true}
                  className="w-full sm:w-auto"
                />
                {!readOnly && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={useCustomPeriod}
                        onChange={(e) => {
                          setUseCustomPeriod(e.target.checked);
                          if (!e.target.checked) {
                            setCustomPeriod("");
                          }
                        }}
                        className="rounded"
                      />
                      Custom Period
                    </label>
                    {useCustomPeriod && (
                      <Input
                        type="number"
                        placeholder="# tournaments"
                        value={customPeriod}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCustomPeriod(value);
                          if (value && parseInt(value) > 0) {
                            setStatsPeriod(value);
                          }
                        }}
                        className="h-9 w-full sm:w-32"
                        min="1"
                      />
                    )}
                  </div>
                )}
                {!useCustomPeriod && (
                  <Select
                    value={statsPeriod}
                    onValueChange={(value) => {
                      setStatsPeriod(value);
                    }}
                  >
                    <SelectTrigger className="h-9 w-full sm:w-[180px]">
                      <SelectValue placeholder="Last tournaments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Last 1 tournament</SelectItem>
                      <SelectItem value="2">Last 2 tournaments</SelectItem>
                      <SelectItem value="3">Last 3 tournaments</SelectItem>
                      <SelectItem value="4">Last 4 tournaments</SelectItem>
                      <SelectItem value="5">Last 5 tournaments</SelectItem>
                      <SelectItem value="6">Last 6 tournaments</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {!readOnly && (
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="h-9 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Result
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Win Statistics */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Win Statistics
              <span className="text-sm font-normal text-muted-foreground">
                (Last {statsPeriod} tournaments)
              </span>
            </h3>
            <div className="overflow-x-auto h-[200px] sm:h-[250px] md:h-[300px] border border-gray-200 dark:border-gray-800 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-accent text-accent-foreground sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-left">Player</th>
                    <th className="p-3 text-left">Times Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="p-4 text-center text-muted-foreground"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : Object.keys(playerStats).length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="p-4 text-center text-muted-foreground"
                      >
                        No statistics available
                      </td>
                    </tr>
                  ) : (
                    Object.entries(playerStats)
                      .sort(([, countA], [, countB]) => countB - countA)
                      .map(([playerId, count]) => (
                        <tr
                          key={playerId}
                          className="border-t border-gray-200 dark:border-gray-800 hover:bg-muted/30"
                        >
                          <td className="p-3 font-medium">
                            {getPlayerName(playerId)}
                          </td>
                          <td className="p-3">{count}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tournament Results */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Tournament Results</h3>
            <div
              ref={resultsContainerRef}
              className="overflow-x-auto h-[250px] sm:h-[300px] md:h-[400px] border border-gray-200 dark:border-gray-800 rounded-lg"
            >
              <table className="w-full text-sm">
                <thead className="bg-accent text-accent-foreground sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-left">Tournament</th>
                    <th className="p-3 text-left">1st Place</th>
                    <th className="p-3 text-left">2nd Place</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-4 text-center text-muted-foreground"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : tournamentResults.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-4 text-center text-muted-foreground"
                      >
                        No results recorded
                      </td>
                    </tr>
                  ) : (
                    displayedResults.map((result) => (
                      <tr
                        key={result.id}
                        className="border-t border-gray-200 dark:border-gray-800 hover:bg-muted/30"
                      >
                        <td className="p-3 font-medium">
                          {result.tournamentTitle}
                        </td>
                        <td className="p-3">
                          {result.firstPlace
                            .map((id) => getPlayerName(id))
                            .join(", ")}
                        </td>
                        <td className="p-3">
                          {result.secondPlace
                            .map((id) => getPlayerName(id))
                            .join(", ")}
                        </td>
                        <td className="p-3 text-center">
                          {!readOnly && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteResult(result.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                  {isLoadingMore && (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-4 text-center text-muted-foreground"
                      >
                        Loading more...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Result Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Tournament Result</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tournament <span className="text-red-500">*</span>
              </label>
              <Select
                value={newResult.tournamentId}
                onValueChange={(value) =>
                  setNewResult({ ...newResult, tournamentId: value })
                }
                required
                defaultValue={
                  tournaments.length > 0
                    ? [...tournaments].sort((a, b) => {
                        // Sort by createdAt if available, otherwise by startDate
                        if (a.createdAt && b.createdAt) {
                          return (
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                          );
                        }
                        return (
                          new Date(b.startDate).getTime() -
                          new Date(a.startDate).getTime()
                        );
                      })[0]?.id
                    : ""
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tournament" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments
                    .sort((a, b) => {
                      // Sort by createdAt if available, otherwise by startDate
                      if (a.createdAt && b.createdAt) {
                        return (
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                        );
                      }
                      return (
                        new Date(b.startDate).getTime() -
                        new Date(a.startDate).getTime()
                      );
                    })
                    .map((tournament) => (
                      <SelectItem key={tournament.id} value={tournament.id}>
                        {tournament.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">1st Place</label>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search player"
                    value={playerSearch.firstPlace}
                    onChange={(e) => {
                      setPlayerSearch({
                        ...playerSearch,
                        firstPlace: e.target.value,
                      });
                      setActiveInput("firstPlace");
                    }}
                    onFocus={() => setActiveInput("firstPlace")}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />

                  {filteredPlayers.length > 0 &&
                    activeInput === "firstPlace" &&
                    playerSearch.firstPlace && (
                      <div className="absolute z-10 w-full mt-1 bg-background border border-input rounded-md shadow-md max-h-60 overflow-auto">
                        {filteredPlayers.map((player) => (
                          <div
                            key={player.id}
                            className="p-2 hover:bg-accent cursor-pointer"
                            onClick={() => {
                              // If first slot is empty, fill it
                              if (!newResult.firstPlace[0]) {
                                setNewResult({
                                  ...newResult,
                                  firstPlace: [player.id],
                                });
                              }
                              // If second slot doesn't exist yet, add player to second slot
                              else if (newResult.firstPlace.length === 1) {
                                setNewResult({
                                  ...newResult,
                                  firstPlace: [
                                    ...newResult.firstPlace,
                                    player.id,
                                  ],
                                });
                              }
                              // Replace the first empty slot found
                              else {
                                const updatedFirstPlace = [
                                  ...newResult.firstPlace,
                                ];
                                const emptyIndex = updatedFirstPlace.findIndex(
                                  (id) => !id
                                );
                                if (emptyIndex >= 0) {
                                  updatedFirstPlace[emptyIndex] = player.id;
                                } else {
                                  updatedFirstPlace.push(player.id);
                                }
                                setNewResult({
                                  ...newResult,
                                  firstPlace: updatedFirstPlace,
                                });
                              }
                              setPlayerSearch({
                                ...playerSearch,
                                firstPlace: "",
                              });
                            }}
                          >
                            {player.name}
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  {newResult.firstPlace
                    .filter((id) => id)
                    .map((playerId, index) => (
                      <div
                        key={index}
                        className="p-2 bg-blue-100 dark:bg-blue-800/40 rounded-lg flex justify-between items-center border border-blue-200 dark:border-blue-700"
                      >
                        <span>{getPlayerName(playerId)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updatedFirstPlace = [...newResult.firstPlace];
                            updatedFirstPlace.splice(index, 1);
                            // Ensure there's always at least one slot
                            if (updatedFirstPlace.length === 0)
                              updatedFirstPlace.push("");
                            setNewResult({
                              ...newResult,
                              firstPlace: updatedFirstPlace,
                            });
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}

                  {showAddPlayerButtons.firstPlace && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() =>
                        setNewResult({
                          ...newResult,
                          firstPlace: [...newResult.firstPlace, ""],
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Player
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">2nd Place</label>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search player"
                    value={playerSearch.secondPlace}
                    onChange={(e) => {
                      setPlayerSearch({
                        ...playerSearch,
                        secondPlace: e.target.value,
                      });
                      setActiveInput("secondPlace");
                    }}
                    onFocus={() => setActiveInput("secondPlace")}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />

                  {filteredPlayers.length > 0 &&
                    activeInput === "secondPlace" &&
                    playerSearch.secondPlace && (
                      <div className="absolute z-10 w-full mt-1 bg-background border border-input rounded-md shadow-md max-h-60 overflow-auto">
                        {filteredPlayers.map((player) => (
                          <div
                            key={player.id}
                            className="p-2 hover:bg-accent cursor-pointer"
                            onClick={() => {
                              // If first slot is empty, fill it
                              if (!newResult.secondPlace[0]) {
                                setNewResult({
                                  ...newResult,
                                  secondPlace: [player.id],
                                });
                              }
                              // If second slot doesn't exist yet, add player to second slot
                              else if (newResult.secondPlace.length === 1) {
                                setNewResult({
                                  ...newResult,
                                  secondPlace: [
                                    ...newResult.secondPlace,
                                    player.id,
                                  ],
                                });
                              }
                              // Replace the first empty slot found
                              else {
                                const updatedSecondPlace = [
                                  ...newResult.secondPlace,
                                ];
                                const emptyIndex = updatedSecondPlace.findIndex(
                                  (id) => !id
                                );
                                if (emptyIndex >= 0) {
                                  updatedSecondPlace[emptyIndex] = player.id;
                                } else {
                                  updatedSecondPlace.push(player.id);
                                }
                                setNewResult({
                                  ...newResult,
                                  secondPlace: updatedSecondPlace,
                                });
                              }
                              setPlayerSearch({
                                ...playerSearch,
                                secondPlace: "",
                              });
                            }}
                          >
                            {player.name}
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  {newResult.secondPlace
                    .filter((id) => id)
                    .map((playerId, index) => (
                      <div
                        key={index}
                        className="p-2 bg-gray-100 dark:bg-gray-800/40 rounded-lg flex justify-between items-center border border-gray-200 dark:border-gray-700"
                      >
                        <span>{getPlayerName(playerId)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updatedSecondPlace = [
                              ...newResult.secondPlace,
                            ];
                            updatedSecondPlace.splice(index, 1);
                            // Ensure there's always at least one slot
                            if (updatedSecondPlace.length === 0)
                              updatedSecondPlace.push("");
                            setNewResult({
                              ...newResult,
                              secondPlace: updatedSecondPlace,
                            });
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}

                  {showAddPlayerButtons.secondPlace && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                      onClick={() =>
                        setNewResult({
                          ...newResult,
                          secondPlace: [...newResult.secondPlace, ""],
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Player
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Warning message removed as requested */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddResult}
              disabled={isSaving || !newResult.tournamentId}
            >
              {isSaving ? "Saving..." : "Save Result"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
