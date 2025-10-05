// lib/utils.ts
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  QueryDocumentSnapshot,
  query,
  where,
} from "firebase/firestore"; // Import client-side Firestore methods
import { TournamentConfig } from "@/lib/types";

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function calculatePlacementPoints(position: number): number {
  const points = [10, 6, 5, 4, 3, 2, 1, 1, 0];
  return position > 0 && position <= points.length ? points[position - 1] : 0;
}

export function isChickenDinner(placementPoints: number): number {
  return placementPoints === 10 ? 1 : 0;
}

// K/D calculation utilities based on PUBG/BGMI standards
export function calculateKD(kills: number, deaths: number): number {
  // In PUBG/BGMI, if deaths = 0, K/D is just the kills count
  // If deaths > 0, K/D = kills / deaths
  if (deaths === 0) {
    return kills;
  }
  return parseFloat((kills / deaths).toFixed(2));
}

// Calculate K/D for players assuming 1 death per match (PUBG/BGMI standard)
export function calculatePlayerKDs(playerKills: number[], matchesPlayed: number = 1): number[] {
  return playerKills.map((kills) => {
    // Each player gets 1 death per match they play
    return calculateKD(kills, matchesPlayed);
  });
}

// Calculate overall K/D for a player across all matches (only counting matches they participated in)
export function calculateOverallPlayerKD(matchScores: { [matchNumber: string]: any }, playerIndex: number): number {
  let totalKills = 0;
  let matchesParticipated = 0;
  
  Object.values(matchScores).forEach((score: any) => {
    // Check if player participated in this match
    const participated = score.playerParticipation ? score.playerParticipation[playerIndex] : true;
    
    if (participated && score.playerKills && score.playerKills[playerIndex] !== undefined) {
      totalKills += score.playerKills[playerIndex] || 0;
      matchesParticipated++;
    }
  });
  
  // Each match participated = 1 death automatically in PUBG/BGMI
  return calculateKD(totalKills, matchesParticipated);
}

// Get player stats summary including K/D
export interface PlayerStats {
  name: string;
  totalKills: number;
  totalDeaths: number;
  overallKD: number;
  matchesPlayed: number;
  avgKillsPerMatch: number;
}

export function getPlayerStats(player: { ign: string }, playerIndex: number, matchScores: { [matchNumber: string]: any }): PlayerStats {
  let totalKills = 0;
  let matchesParticipated = 0;
  
  Object.values(matchScores).forEach((score: any) => {
    // Check if player participated in this match (default to true for backward compatibility)
    const participated = score.playerParticipation ? score.playerParticipation[playerIndex] : true;
    
    if (participated && score.playerKills && score.playerKills[playerIndex] !== undefined) {
      totalKills += score.playerKills[playerIndex] || 0;
      matchesParticipated++;
    }
  });
  
  // In PUBG/BGMI, each match participated = 1 death automatically
  const totalDeaths = matchesParticipated;
  
  return {
    name: player.ign,
    totalKills,
    totalDeaths,
    overallKD: calculateKD(totalKills, totalDeaths),
    matchesPlayed: matchesParticipated,
    avgKillsPerMatch: matchesParticipated > 0 ? parseFloat((totalKills / matchesParticipated).toFixed(1)) : 0
  };
}

export async function getTournamentConfigs(): Promise<TournamentConfig[]> {
  const snapshot = await getDocs(collection(db, "tournaments"));
  return snapshot.docs.map((doc: QueryDocumentSnapshot) =>
    ({ id: doc.id, ...doc.data() } as TournamentConfig)
  );
}

export async function updateTournamentConfig(id: string, config: TournamentConfig): Promise<void> {
  await setDoc(doc(db, "tournaments", id), config, { merge: true });
}

export async function deleteTournamentConfig(id: string): Promise<void> {
  await deleteDoc(doc(db, "tournaments", id));
}

export function exportToCSV(data: any[], filename: string): void {
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) => Object.values(row).join(",")).join("\n");
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function generateTeamName(): string {
  const adjectives = ["Fierce", "Swift", "Brave", "Cunning", "Mighty"];
  const nouns = ["Lions", "Eagles", "Wolves", "Tigers", "Bears"];
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdj} ${randomNoun}`;
}


export function getPositionFromPoints(points: number): number {
  const placementMap = [10, 6, 5, 4, 3, 2, 1, 1, 0];
  const index = placementMap.indexOf(points);
  return index !== -1 ? index + 1 : 0;
}

// Tiebreaker system for official competitions
export interface TeamTiebreakerData {
  teamId: string;
  teamName: string;
  totalKills: number;
  totalPlacementPoints: number;
  firstPlaceWins: number;
  totalFinishes: number;
  mostRecentPlacement: number;
  totalScore: number; // kills + placement points
}

export function calculateTiebreakerData(team: any): TeamTiebreakerData {
  const matchScores = team.matchScores || {};
  let totalKills = 0;
  let totalPlacementPoints = 0;
  let firstPlaceWins = 0;
  let totalFinishes = 0;
  let mostRecentPlacement = 0;
  
  const matchNumbers = Object.keys(matchScores).map(Number).sort((a, b) => a - b);
  
  for (const matchNum of matchNumbers) {
    const score = matchScores[matchNum.toString()];
    if (score) {
      totalKills += score.kills || 0;
      totalPlacementPoints += score.placementPoints || 0;
      totalFinishes++;
      
      // Check for first place (10 placement points = 1st place)
      if (score.placementPoints === 10) {
        firstPlaceWins++;
      }
      
      // Most recent match placement
      if (matchNum === Math.max(...matchNumbers)) {
        mostRecentPlacement = getPositionFromPoints(score.placementPoints);
      }
    }
  }
  
  return {
    teamId: team.id,
    teamName: team.teamName,
    totalKills,
    totalPlacementPoints,
    firstPlaceWins,
    totalFinishes,
    mostRecentPlacement,
    totalScore: totalKills + totalPlacementPoints
  };
}

export function sortTeamsWithTiebreaker(teams: any[]): any[] {
  const teamsWithTiebreakerData = teams.map(team => ({
    ...team,
    tiebreakerData: calculateTiebreakerData(team)
  }));
  
  return teamsWithTiebreakerData.sort((a, b) => {
    const aData = a.tiebreakerData;
    const bData = b.tiebreakerData;
    
    // Primary: Total score (kills + placement points)
    if (aData.totalScore !== bData.totalScore) {
      return bData.totalScore - aData.totalScore;
    }
    
    // Tiebreaker 1: Total first place wins
    if (aData.firstPlaceWins !== bData.firstPlaceWins) {
      return bData.firstPlaceWins - aData.firstPlaceWins;
    }
    
    // Tiebreaker 2: Total placement points
    if (aData.totalPlacementPoints !== bData.totalPlacementPoints) {
      return bData.totalPlacementPoints - aData.totalPlacementPoints;
    }
    
    // Tiebreaker 3: Total accumulated finishes (more matches played)
    if (aData.totalFinishes !== bData.totalFinishes) {
      return bData.totalFinishes - aData.totalFinishes;
    }
    
    // Tiebreaker 4: Most recent match placement (lower is better)
    if (aData.mostRecentPlacement !== bData.mostRecentPlacement) {
      // Handle case where placement is 0 (didn't play recent match)
      if (aData.mostRecentPlacement === 0) return 1;
      if (bData.mostRecentPlacement === 0) return -1;
      return aData.mostRecentPlacement - bData.mostRecentPlacement;
    }
    
    // Final tiebreaker: Total kills
    return bData.totalKills - aData.totalKills;
  });
}

// Utility function to check which tournaments have teams
export async function getTournamentsWithTeams(tournamentIds: string[]): Promise<string[]> {
  if (tournamentIds.length === 0) return [];
  
  const tournamentsWithTeams: string[] = [];
  
  // Check each tournament for teams
  for (const tournamentId of tournamentIds) {
    try {
      const teamsQuery = query(
        collection(db, "tournamentEntries"),
        where("tournamentId", "==", tournamentId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      
      if (!teamsSnapshot.empty) {
        tournamentsWithTeams.push(tournamentId);
      }
    } catch (error) {
      console.error(`Error checking teams for tournament ${tournamentId}:`, error);
    }
  }
  
  return tournamentsWithTeams;
}

// Utility function to get the best tournament to auto-select
export async function getBestTournamentForAutoSelect(tournaments: TournamentConfig[]): Promise<string | null> {
  if (tournaments.length === 0) return null;
  
  // Sort tournaments by creation date (newest first)
  const sortedTournaments = [...tournaments].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
  
  const tournamentIds = sortedTournaments.map(t => t.id);
  
  // Get tournaments that have teams
  const tournamentsWithTeams = await getTournamentsWithTeams(tournamentIds);
  
  // If we have tournaments with teams, return the newest one with teams
  if (tournamentsWithTeams.length > 0) {
    return tournamentsWithTeams[0];
  }
  
  // If no tournaments have teams, return the newest tournament
  return sortedTournaments[0].id;
}