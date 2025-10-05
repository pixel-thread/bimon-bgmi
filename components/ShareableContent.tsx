import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CombinedTeamData, MatchScore } from "@/lib/types";
import MobileTable from "./MobileTable";
import TwoColumnTable from "./TwoColumnTable";
import { isChickenDinner, sortTeamsWithTiebreaker } from "@/lib/utils";
import { formatDateDDMMYYYY } from "../utils/dateFormat";

interface ShareableContentProps {
  teams: CombinedTeamData[];
  selectedMatch: string;
  backgroundImage: string;
  tournamentTitle: string;
  maxMatchNumber: number; // This now represents our local matchCount
  selectedSeason?: string;
}

export function ShareableContent({
  teams,
  selectedMatch,
  backgroundImage,
  tournamentTitle,
  maxMatchNumber,
  selectedSeason,
}: ShareableContentProps) {
  const [seasonName, setSeasonName] = useState<string>("");

  useEffect(() => {
    const fetchSeasonName = async () => {
      if (!selectedSeason || selectedSeason === "all") {
        setSeasonName("");
        return;
      }

      try {
        const seasonsSnapshot = await getDocs(collection(db, "seasons"));
        const seasons = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        const season = seasons.find((s: any) => s.id === selectedSeason);
        setSeasonName(season?.name || "");
      } catch (error) {
        console.error("Error fetching season name:", error);
        setSeasonName("");
      }
    };

    fetchSeasonName();
  }, [selectedSeason]);
  const getScore = (team: CombinedTeamData): { kills: number; placementPoints: number; chickens: number; matchesPlayed: number } => {
    let totalKills = 0;
    let totalPlacementPoints = 0;
    let totalChickens = 0;
    let matchesPlayed = 0;

    // Ensure matchScores exists
    const matchScores = team.matchScores || {};

    if (selectedMatch === "All") {
      // Only count matches from 1 to maxMatchNumber (our controlled match count)
      for (let i = 1; i <= maxMatchNumber; i++) {
        const matchKey = i.toString();
        if (matchScores[matchKey]) {
          const score: MatchScore = matchScores[matchKey];
          totalKills += score.kills;
          totalPlacementPoints += score.placementPoints;
          totalChickens += isChickenDinner(score.placementPoints);
          matchesPlayed += 1;
        }
      }
    } else {
      // If a specific match is selected, accumulate scores up to that match.
      const selectedMatchNum = parseInt(selectedMatch, 10);
      for (let i = 1; i <= selectedMatchNum; i++) {
        const matchKey = i.toString();
        if (matchScores[matchKey]) {
          const score: MatchScore = matchScores[matchKey];
          totalKills += score.kills;
          totalPlacementPoints += score.placementPoints;
          totalChickens += isChickenDinner(score.placementPoints);
          matchesPlayed += 1;
        }
      }
    }

    return {
      kills: totalKills,
      placementPoints: totalPlacementPoints,
      chickens: totalChickens,
      matchesPlayed,
    };
  };

  // Filter teams to only include matches up to the selected match for calculation
  const teamsWithFilteredScores = teams.map((team) => {
    const filteredMatchScores: { [key: string]: any } = {};
    if (selectedMatch === "All") {
      // Only include matches from 1 to maxMatchNumber
      for (let i = 1; i <= maxMatchNumber; i++) {
        const matchKey = i.toString();
        if (team.matchScores?.[matchKey]) {
          filteredMatchScores[matchKey] = team.matchScores[matchKey];
        }
      }
    } else {
      // Include matches from 1 to selectedMatch
      const selectedMatchNum = parseInt(selectedMatch, 10);
      for (let i = 1; i <= selectedMatchNum; i++) {
        const matchKey = i.toString();
        if (team.matchScores?.[matchKey]) {
          filteredMatchScores[matchKey] = team.matchScores[matchKey];
        }
      }
    }
    return {
      ...team,
      matchScores: filteredMatchScores
    };
  });

  // Use the tiebreaker system for consistent sorting
  const sortedTeams = sortTeamsWithTiebreaker(teamsWithFilteredScores);

  // Example usage:
  const todayFormatted = formatDateDDMMYYYY(new Date());

  return (
    <div
      id="shareable-content"
      className="relative w-full min-h-screen flex items-center justify-center bg-cover bg-center bg-background text-foreground"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div className="modal-container relative z-10 w-full max-w-[98%] sm:max-w-none mx-auto p-4 sm:p-6">
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-orange-500 font-montserrat tracking-wide">
            {tournamentTitle}
          </h1>
          {seasonName && (
            <p className="text-sm sm:text-base text-blue-400 font-semibold mt-1">
              {seasonName}
            </p>
          )}
          <p className="text-sm sm:text-md text-gray-300 mt-1">
            {selectedMatch === "All"
              ? "(Overall Rankings)"
              : `Match ${selectedMatch} Results`}
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block">
          <TwoColumnTable teams={sortedTeams} getScore={getScore} />
        </div>
        {/* Mobile Table */}
        <div className="block sm:hidden">
          <MobileTable teams={sortedTeams} getScore={getScore} />
        </div>

        <div className="text-center mt-4 text-gray-400 text-xs">
          Designed by Bimon | Generated on {todayFormatted}
        </div>
      </div>
    </div>
  );
}