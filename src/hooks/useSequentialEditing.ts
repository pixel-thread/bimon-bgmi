import { useState, useEffect, useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { CombinedTeamData } from "@/src/lib/types";
import { calculatePlacementPoints } from "@/src/lib/utils";

export function useSequentialEditing(
  teams: CombinedTeamData[],
  initialMatch: string
) {
  const [tempEdits, setTempEdits] = useState<{
    [teamId: string]: {
      placement?: string;
      kills?: string;
      teamName?: string;
      playerKills?: string[];
      playerParticipation?: boolean[];
    };
  }>({});
  const [sequentialMatch, setSequentialMatch] = useState(initialMatch);
  const matchOptions = Array.from(
    {
      length: teams.length
        ? Math.max(
            ...teams.flatMap((team) =>
              Object.keys(team.matchScores || {}).map(Number)
            ),
            1
          )
        : 1,
    },
    (_, i) => (i + 1).toString()
  );

  useEffect(() => {
    const initialEdits: {
      [teamId: string]: {
        placement?: string;
        kills?: string;
        teamName?: string;
        playerKills?: string[];
        playerParticipation?: boolean[];
      };
    } = {};
    teams.forEach((team) => {
      const matchScore = team.matchScores?.[sequentialMatch] || {
        kills: 0,
        placementPoints: 0,
        playerKills: [],
        playerParticipation: [],
      };
      const position =
        matchScore.placementPoints > 0
          ? getPositionFromPoints(matchScore.placementPoints)
          : "";
      initialEdits[team.id] = {
        placement: position ? String(position) : "",
        kills: matchScore.kills > 0 ? String(matchScore.kills) : "",
        teamName: team.teamName,
        playerKills:
          matchScore.playerKills?.map((k) => (k > 0 ? String(k) : "")) || [],
        // Smart defaults: Default to participated if no data exists
        playerParticipation:
          matchScore.playerParticipation || team.players.map(() => true),
      };
    });
    setTempEdits(initialEdits);
  }, [sequentialMatch, teams]);

  const getPositionFromPoints = (points: number) => {
    const placementMap = [10, 6, 5, 4, 3, 2, 1, 1, 0];
    const index = placementMap.indexOf(points);
    return index !== -1 ? index + 1 : 0;
  };

  const setTempEdit = (
    teamId: string,
    field:
      | "placement"
      | "kills"
      | "teamName"
      | "playerKills"
      | "playerParticipation",
    value: string | string[] | boolean[] | undefined
  ) => {
    setTempEdits((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [field]: value ?? (Array.isArray(value) ? [] : ""),
      },
    }));
  };

  const saveEdits = useCallback(async () => {
    for (const team of teams) {
      const teamEdits = tempEdits[team.id];
      if (!teamEdits) continue;

      const updatedData: any = {};
      const updatedScores = { ...team.matchScores };
      if (!updatedScores[sequentialMatch]) {
        updatedScores[sequentialMatch] = {
          kills: 0,
          placementPoints: 0,
          playerKills: [],
          playerKD: [],
          playerParticipation: [],
        } as any;
      }

      // Apply explicit edits
      if (teamEdits.placement !== undefined) {
        const position = parseInt(teamEdits.placement) || 0;
        updatedScores[sequentialMatch].placementPoints =
          calculatePlacementPoints(position);
      }

      if (teamEdits.kills !== undefined) {
        updatedScores[sequentialMatch].kills = parseInt(teamEdits.kills) || 0;
      }

      if (teamEdits.playerKills !== undefined) {
        updatedScores[sequentialMatch].playerKills = teamEdits.playerKills.map(
          (k) => parseInt(k) || 0
        );
      }

      if (teamEdits.playerParticipation !== undefined) {
        updatedScores[sequentialMatch].playerParticipation =
          teamEdits.playerParticipation;
      }

      // Normalize arrays so players page can compute matchesPlayed
      const ms = updatedScores[sequentialMatch] as any;
      const targetLen = team.players.length;

      // Default participation to true for missing values
      const participation =
        Array.isArray(ms.playerParticipation) &&
        ms.playerParticipation.length > 0
          ? ms.playerParticipation
          : team.players.map(() => true);
      const normalizedParticipation = participation
        .slice(0, targetLen)
        .concat(
          Array(Math.max(0, targetLen - participation.length)).fill(true)
        );
      ms.playerParticipation = normalizedParticipation;

      const pk = Array.isArray(ms.playerKills) ? ms.playerKills : [];
      const normalizedPK = pk
        .slice(0, targetLen)
        .concat(Array(Math.max(0, targetLen - pk.length)).fill(0));
      ms.playerKills = normalizedPK;

      // Recalculate per-player KD using participation
      const playerKDs = ms.playerKills.map((kills: number, idx: number) =>
        ms.playerParticipation[idx] ? parseFloat((kills / 1).toFixed(1)) : 0
      );
      ms.playerKD = playerKDs;

      updatedData.matchScores = updatedScores;

      if (teamEdits.teamName !== undefined) {
        updatedData.teamName = teamEdits.teamName;
      }

      const docRef = doc(db, "tournamentEntries", team.id);
      await updateDoc(docRef, updatedData);
    }

    const initialEdits: {
      [teamId: string]: {
        placement?: string;
        kills?: string;
        teamName?: string;
        playerKills?: string[];
        playerParticipation?: boolean[];
      };
    } = {};
    teams.forEach((team) => {
      const matchScore = team.matchScores?.[sequentialMatch] || {
        kills: 0,
        placementPoints: 0,
        playerKills: [],
        playerParticipation: [],
      };
      const position =
        matchScore.placementPoints > 0
          ? getPositionFromPoints(matchScore.placementPoints)
          : "";
      initialEdits[team.id] = {
        placement: position ? String(position) : "",
        kills: matchScore.kills > 0 ? String(matchScore.kills) : "",
        teamName: team.teamName,
        playerKills:
          matchScore.playerKills?.map((k) => (k > 0 ? String(k) : "")) || [],
        playerParticipation:
          matchScore.playerParticipation || team.players.map(() => true),
      };
    });
    setTempEdits(initialEdits);
  }, [teams, sequentialMatch, tempEdits]);

  const resetTempEdits = () => {
    const initialEdits: {
      [teamId: string]: {
        placement?: string;
        kills?: string;
        teamName?: string;
        playerKills?: string[];
        playerParticipation?: boolean[];
      };
    } = {};
    teams.forEach((team) => {
      const matchScore = team.matchScores?.[sequentialMatch] || {
        kills: 0,
        placementPoints: 0,
        playerKills: [],
        playerParticipation: [],
      };
      const position =
        matchScore.placementPoints > 0
          ? getPositionFromPoints(matchScore.placementPoints)
          : "";
      initialEdits[team.id] = {
        placement: position ? String(position) : "",
        kills: matchScore.kills > 0 ? String(matchScore.kills) : "",
        teamName: team.teamName,
        playerKills:
          matchScore.playerKills?.map((k) => (k > 0 ? String(k) : "")) || [],
        playerParticipation:
          matchScore.playerParticipation || team.players.map(() => true),
      };
    });
    setTempEdits(initialEdits);
  };

  // New function to check for actual unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    for (const team of teams) {
      const teamEdits = tempEdits[team.id];
      if (!teamEdits) continue;

      const matchScore = team.matchScores?.[sequentialMatch] || {
        kills: 0,
        placementPoints: 0,
        playerKills: [],
        playerParticipation: [],
      };
      const savedPlacement =
        matchScore.placementPoints > 0
          ? String(getPositionFromPoints(matchScore.placementPoints))
          : "";
      const savedKills = matchScore.kills > 0 ? String(matchScore.kills) : "";
      const savedPlayerKills =
        matchScore.playerKills?.map((k) => (k > 0 ? String(k) : "")) || [];

      // More robust comparison for player participation - handle undefined/null values properly
      const savedPlayerParticipation =
        matchScore.playerParticipation &&
        matchScore.playerParticipation.length > 0
          ? matchScore.playerParticipation
          : team.players.map(() => true);

      // Only check for changes if the field has actually been modified
      const placementChanged = teamEdits.placement !== savedPlacement;
      const killsChanged = teamEdits.kills !== savedKills;
      const teamNameChanged = teamEdits.teamName !== team.teamName;

      // Better array comparison - normalize arrays first
      const normalizePlayerKills = (arr: string[]) => arr.map((k) => k || "");
      const playerKillsChanged =
        teamEdits.playerKills &&
        JSON.stringify(normalizePlayerKills(teamEdits.playerKills)) !==
          JSON.stringify(normalizePlayerKills(savedPlayerKills));

      // Better participation comparison - ensure same length and values
      const participationChanged =
        teamEdits.playerParticipation &&
        (teamEdits.playerParticipation.length !==
          savedPlayerParticipation.length ||
          teamEdits.playerParticipation.some(
            (val, idx) => val !== savedPlayerParticipation[idx]
          ));

      if (
        placementChanged ||
        killsChanged ||
        teamNameChanged ||
        playerKillsChanged ||
        participationChanged
      ) {
        return true;
      }
    }
    return false;
  }, [teams, sequentialMatch, tempEdits]);

  return {
    tempEdits,
    setTempEdit,
    saveEdits,
    matchOptions,
    sequentialMatch,
    setSequentialMatch,
    resetTempEdits,
    hasUnsavedChanges, // Export the new function
  };
}
