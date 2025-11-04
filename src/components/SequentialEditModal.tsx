import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import TeamScoreRow from "@/src/components/teams/TeamScoreRow";
import { CombinedTeamData } from "@/src/lib/types";
import { FiArrowUp, FiArrowDown, FiAlertCircle } from "react-icons/fi";

interface SequentialEditModalProps {
  showSequentialModal: boolean;
  handleSequentialClose: () => void;
  sequentialMatch: string;
  totalPlayersPlayed: string;
  setTotalPlayersPlayed: (value: string) => void;
  totalKillsError: string;
  sortedTeams: CombinedTeamData[];
  tempEdits: {
    [teamId: string]: {
      placement?: string;
      kills?: string;
      teamName?: string;
      playerKills?: string[];
      playerParticipation?: boolean[];
    };
  };
  placementErrors: { [teamId: string]: string };
  handleSetTempEdit: (
    teamId: string,
    field: "placement" | "kills" | "playerKills" | "playerParticipation",
    value: string | string[] | boolean[]
  ) => void;
  onSave: (signal: AbortSignal) => Promise<void>;
}

export default function SequentialEditModal({
  showSequentialModal,
  handleSequentialClose,
  sequentialMatch,
  totalPlayersPlayed,
  setTotalPlayersPlayed,
  totalKillsError,
  sortedTeams,
  tempEdits,
  placementErrors,
  handleSetTempEdit,
  onSave,
}: SequentialEditModalProps) {
  const [playerSearch, setPlayerSearch] = useState("");
  const [matchingTeamIds, setMatchingTeamIds] = useState<string[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastScrolledSearchRef = useRef("");

  // Detect keyboard visibility on mobile
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 640;
    if (!isMobile) return;

    let initialHeight = window.visualViewport?.height || window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDiff = initialHeight - currentHeight;
      setIsKeyboardOpen(heightDiff > 100);
    };

    const handleFocus = () => setIsKeyboardOpen(true);
    const handleBlur = () => setIsKeyboardOpen(false);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    } else {
      window.addEventListener("focusin", handleFocus);
      window.addEventListener("focusout", handleBlur);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      } else {
        window.removeEventListener("focusin", handleFocus);
        window.removeEventListener("focusout", handleBlur);
      }
    };
  }, []);

  useEffect(() => {
    if (!playerSearch) {
      setMatchingTeamIds([]);
      setCurrentMatchIndex(0);
      lastScrolledSearchRef.current = "";
      return;
    }
    const lowerQuery = playerSearch.toLowerCase();
    const matches = sortedTeams
      .filter(
        (team) =>
          team.teamName.toLowerCase().includes(lowerQuery) ||
          team.players.some((player) =>
            player.ign.toLowerCase().includes(lowerQuery)
          )
      )
      .map((team) => team.id);
    setMatchingTeamIds(matches);
    if (matches.length > 0 && lastScrolledSearchRef.current !== playerSearch) {
      setCurrentMatchIndex(0);
      requestAnimationFrame(() => {
        const element = document.getElementById(`team-row-${matches[0]}`);
        if (element && scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const elementTop = element.getBoundingClientRect().top;
          const containerTop = container.getBoundingClientRect().top;
          const offset = elementTop - containerTop + container.scrollTop - 20;
          container.scrollTo({
            top: offset,
            behavior: "smooth",
          });
          element.classList.add(
            "bg-yellow-100",
            "dark:bg-yellow-900",
            "transition-colors"
          );
          setTimeout(() => {
            element.classList.remove(
              "bg-yellow-100",
              "dark:bg-yellow-900",
              "transition-colors"
            );
          }, 1500);
        }
      });
      lastScrolledSearchRef.current = playerSearch;
    }
  }, [playerSearch, sortedTeams]);

  const goToNextMatch = () => {
    if (matchingTeamIds.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matchingTeamIds.length;
    setCurrentMatchIndex(nextIndex);
    scrollToTeam(matchingTeamIds[nextIndex]);
  };

  const goToPrevMatch = () => {
    if (matchingTeamIds.length === 0) return;
    const prevIndex =
      (currentMatchIndex - 1 + matchingTeamIds.length) % matchingTeamIds.length;
    setCurrentMatchIndex(prevIndex);
    scrollToTeam(matchingTeamIds[prevIndex]);
  };

  const scrollToTeam = (teamId: string) => {
    requestAnimationFrame(() => {
      const element = document.getElementById(`team-row-${teamId}`);
      if (element && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const elementTop = element.getBoundingClientRect().top;
        const containerTop = container.getBoundingClientRect().top;
        const offset =
          elementTop -
          containerTop +
          container.scrollTop -
          container.clientHeight / 2 +
          element.clientHeight / 2;
        container.scrollTo({ top: offset, behavior: "smooth" });
        element.classList.add(
          "bg-yellow-100",
          "dark:bg-yellow-900",
          "transition-colors"
        );
        setTimeout(() => {
          element.classList.remove(
            "bg-yellow-100",
            "dark:bg-yellow-900",
            "transition-colors"
          );
        }, 1500);
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      await onSave(controller.signal);
      setIsSaving(false);
      abortControllerRef.current = null;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Save operation cancelled");
      } else {
        console.error("Save failed:", error);
      }
      setIsSaving(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelSave = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsSaving(false);
      abortControllerRef.current = null;
    }
  };

  const getTeamHighlightState = (team: CombinedTeamData) => {
    const teamEdits = tempEdits[team.id];
    const matchScore = team.matchScores?.[sequentialMatch] || {
      kills: 0,
      placementPoints: 0,
    };
    const savedPlacement =
      matchScore.placementPoints > 0
        ? String(getPositionFromPoints(matchScore.placementPoints)).replace(
            /^0+/,
            ""
          )
        : "0";
    const savedKills =
      matchScore.kills > 0 ? String(matchScore.kills).replace(/^0+/, "") : "0";
    const hasSavedData = matchScore.placementPoints > 0 || matchScore.kills > 0;

    const isEdited =
      teamEdits &&
      ((teamEdits.placement &&
        teamEdits.placement.replace(/^0+/, "") !== savedPlacement) ||
        (teamEdits.kills && teamEdits.kills.replace(/^0+/, "") !== savedKills));

    return { hasSavedData, isEdited: !!isEdited };
  };

  const getPositionFromPoints = (points: number) => {
    const placementMap = [10, 6, 5, 4, 3, 2, 1, 1, 0];
    const index = placementMap.lastIndexOf(points);
    return index !== -1 ? index + 1 : 0;
  };

  return (
    <Dialog open={showSequentialModal} onOpenChange={handleSequentialClose}>
      <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-[500px] h-[85vh] sm:h-[90vh] p-3 sm:p-4 rounded-lg bg-white dark:bg-black overflow-hidden flex flex-col text-foreground">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-foreground">
            Sequential Score Editing
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
            Edit scores for all teams in the selected match.
          </DialogDescription>
        </DialogHeader>
        <div
          ref={scrollContainerRef}
          className="flex-1 mt-2 sm:mt-3 overflow-y-auto"
        >
          <div className="sticky top-0 z-20 bg-white dark:bg-black py-2 border-b border-none">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Search teams or players..."
                className="w-full min-w-[150px] h-8 sm:h-9 text-sm sm:text-base rounded-md border border-input dark:border-white/20 focus:ring-2 focus:ring-blue-500 py-1 px-2 bg-background text-foreground"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                autoFocus
              />
              <div className="relative w-20 sm:w-24">
                <input
                  type="number"
                  value={totalPlayersPlayed}
                  onChange={(e) => setTotalPlayersPlayed(e.target.value)}
                  placeholder={
                    window.innerWidth < 640 ? "Total" : "Total Players"
                  }
                  className={`w-full h-8 sm:h-9 text-sm sm:text-base text-center rounded-md border ${
                    totalKillsError
                      ? "border-red-500"
                      : "border-input dark:border-white/20"
                  } focus:ring-2 focus:ring-blue-500 py-1 px-2 bg-background text-foreground touch-none`}
                  aria-label="Total Players Played"
                />
                {totalKillsError && (
                  <FiAlertCircle className="absolute right-1.5 top-1/2 -translate-y-1/2 text-red-500 h-4 w-4" />
                )}
              </div>
              {matchingTeamIds.length > 1 && (
                <div className="flex gap-1">
                  <Button
                    onClick={goToPrevMatch}
                    variant="ghost"
                    className="p-1 h-8 sm:h-9 min-w-[2rem]"
                    aria-label="Previous match"
                  >
                    <FiArrowUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Button
                    onClick={goToNextMatch}
                    variant="ghost"
                    className="p-1 h-8 sm:h-9 min-w-[2rem]"
                    aria-label="Next match"
                  >
                    <FiArrowDown className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-0 pt-2">
            <div className="grid grid-cols-[1fr_48px_48px_36px] sm:grid-cols-[1fr_80px_60px_40px] gap-1 sm:gap-2 bg-gray-50 dark:bg-neutral-900 border-b border-none py-1 sm:py-1.5 px-1 font-medium text-xs sm:text-sm text-gray-700 dark:text-foreground sticky top-[60px] sm:top-[64px] z-10 bg-white dark:bg-black">
              <div>Team Name</div>
              <div className="text-center">Pos</div>
              <div className="text-center">Kills</div>
              <div className="text-center">K/D</div>
            </div>
            {sortedTeams.map((team, index) => {
              const { hasSavedData, isEdited } = getTeamHighlightState(team);
              return (
                <div
                  key={team.id}
                  id={`team-row-${team.id}`}
                  className={`${
                    matchingTeamIds.includes(team.id)
                      ? "bg-yellow-100 dark:bg-yellow-900"
                      : isEdited
                      ? "bg-blue-100 dark:bg-blue-900"
                      : hasSavedData
                      ? "bg-green-100 dark:bg-green-900"
                      : index % 2 === 0
                      ? "bg-white dark:bg-neutral-900"
                      : "bg-gray-50 dark:bg-neutral-800"
                  } text-foreground`}
                >
                  <TeamScoreRow
                    team={team}
                    index={index}
                    tempEdits={tempEdits}
                    placementErrors={placementErrors}
                    handleSetTempEdit={handleSetTempEdit}
                    searchTerm={playerSearch}
                    sequentialMatch={sequentialMatch}
                  />
                </div>
              );
            })}
          </div>
        </div>
        {!isKeyboardOpen && (
          <DialogFooter className="flex flex-row justify-end gap-2 mt-2 sm:mt-3 shrink-0">
            <Button
              variant="outline"
              onClick={isSaving ? handleCancelSave : handleSequentialClose}
              className="w-20 sm:w-24 h-8 sm:h-9 rounded-md border-none text-gray-700 dark:text-foreground hover:bg-gray-50 dark:hover:bg-neutral-900 text-xs sm:text-sm"
              disabled={isSaving && !abortControllerRef.current}
            >
              {isSaving ? "Cancel Save" : "Cancel"}
            </Button>
            {!isSaving && (
              <Button
                onClick={handleSave}
                className="w-20 sm:w-24 h-8 sm:h-9 rounded-md bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800 text-xs sm:text-sm flex items-center justify-center"
                disabled={isSaving}
              >
                Save
              </Button>
            )}
            {isSaving && (
              <Button
                className="w-20 sm:w-24 h-8 sm:h-9 rounded-md bg-blue-600 dark:bg-blue-700 text-white text-xs sm:text-sm flex items-center justify-center"
                disabled
              >
                <svg
                  className="animate-spin h-4 w-4 mr-1 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                  />
                </svg>
                Saving...
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
