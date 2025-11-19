interface TempEdits {
  [teamId: string]: {
    placement?: string;
    kills?: string;
    teamName?: string;
    playerKills?: string[];
    playerParticipation?: boolean[];
  };
}

export const validatePlacementPoints = (
  teamId: string,
  matchNumber: string,
  position: number,
  teams: any[],
  tempEdits: TempEdits,
): string => {
  const placementPoints = 0;

  if (placementPoints === 0) return "";

  const otherTeamsWithPoints = teams
    .filter((t) => t.id !== teamId)
    .filter((t) => {
      const otherPosition =
        tempEdits[t.id]?.placement !== undefined
          ? parseInt(tempEdits[t.id]?.placement || "0")
          : 0;

      const otherPlacementPoints =
        tempEdits[t.id]?.placement !== undefined
          ? 9
          : t.matchScores?.[matchNumber]?.placementPoints || 0;

      if (
        (position === 7 || position === 8) &&
        (otherPosition === 7 || otherPosition === 8)
      ) {
        return false;
      }

      return otherPlacementPoints === placementPoints;
    });

  if (otherTeamsWithPoints.length > 0) {
    const otherTeamName = otherTeamsWithPoints[0].teamName;
    return `taken by ${otherTeamName}`;
  }

  return "";
};

export const calculateTotalKills = (
  teams: any[],
  tempEdits: TempEdits,
  sequentialMatch: string,
): number => {
  return teams.reduce((total, team) => {
    const kills =
      tempEdits[team.id]?.kills !== undefined
        ? parseInt(tempEdits[team.id]?.kills || "0")
        : team.matchScores?.[sequentialMatch]?.kills || 0;
    return total + kills;
  }, 0);
};

export const validateTotalKills = (
  totalPlayersPlayed: string,
  teams: any[],
  tempEdits: TempEdits,
  sequentialMatch: string,
): string => {
  if (!totalPlayersPlayed || totalPlayersPlayed.trim() === "") return "";
  const totalPlayers = parseInt(totalPlayersPlayed) || 0;
  const totalKills = calculateTotalKills(teams, tempEdits, sequentialMatch);
  if (totalKills !== totalPlayers) {
    return `Total kills (${totalKills}) must equal total players played (${totalPlayers})`;
  }
  return "";
};

export const handleSetTempEdit = (
  teamId: string,
  field:
    | "placement"
    | "kills"
    | "teamName"
    | "playerKills"
    | "playerParticipation",
  value: string | string[] | boolean[] | undefined,
  setTempEdit: (
    teamId: string,
    field:
      | "placement"
      | "kills"
      | "teamName"
      | "playerKills"
      | "playerParticipation",
    value: string | string[] | boolean[] | undefined,
  ) => void,
  setPlacementErrors: React.Dispatch<
    React.SetStateAction<{ [teamId: string]: string }>
  >,
  teams: any[],
  sequentialMatch: string,
  tempEdits: TempEdits,
) => {
  if (field === "playerKills" || field === "playerParticipation") {
    setTempEdit(teamId, field, value);
    return;
  }

  const stringValue = value as string;
  if (stringValue === undefined || stringValue === "") {
    setTempEdit(teamId, field, undefined);
    if (field === "placement") {
      setPlacementErrors((prev) => ({
        ...prev,
        [teamId]: "",
      }));
    }
    return;
  }

  const numValue = parseInt(stringValue) || 0;
  if (
    (field === "placement" || field === "kills") &&
    (numValue < 0 || numValue > 99)
  )
    return;

  setTempEdit(teamId, field, stringValue);

  if (field === "placement") {
    const position = numValue;
    const error = validatePlacementPoints(
      teamId,
      sequentialMatch,
      position,
      teams,
      tempEdits,
    );
    setPlacementErrors((prev) => ({
      ...prev,
      [teamId]: error,
    }));
  }
};

export const handleExportCSV = (
  sortedTeams: any[],
  selectedMatch: string,
  tournamentTitle: string,
  tempEdits: TempEdits = {},
) => {};

export const handleBulkDelete = async (
  selectedTeams: string[],
  deleteTeams: (teamIds: string[]) => Promise<void>,
  setSelectedTeams: React.Dispatch<React.SetStateAction<string[]>>,
) => {
  if (selectedTeams.length === 0) return;
  await deleteTeams(selectedTeams);
  setSelectedTeams([]);
};

export const handleSequentialClose = (
  hasUnsavedChanges: boolean,
  resetTempEdits: () => void,
  setPlacementErrors: React.Dispatch<
    React.SetStateAction<{ [teamId: string]: string }>
  >,
  setTotalPlayersPlayed: React.Dispatch<React.SetStateAction<string>>,
  setTotalKillsError: React.Dispatch<React.SetStateAction<string>>,
  setShowSequentialModal: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  if (hasUnsavedChanges) {
    const confirmDiscard = window.confirm(
      "You have unsaved changes. Are you sure you want to discard all changes?",
    );
    if (!confirmDiscard) return;
    resetTempEdits();
    setPlacementErrors({});
    setTotalPlayersPlayed("");
    setTotalKillsError("");
  }
  setShowSequentialModal(false);
};

export const handleSequentialSave = async (
  placementErrors: { [teamId: string]: string },
  totalPlayersPlayed: string,
  teams: any[],
  tempEdits: TempEdits,
  sequentialMatch: string,
  saveEdits: () => Promise<void>,
  setShowSequentialModal: React.Dispatch<React.SetStateAction<boolean>>,
  setPlacementErrors: React.Dispatch<
    React.SetStateAction<{ [teamId: string]: string }>
  >,
  setTotalPlayersPlayed: React.Dispatch<React.SetStateAction<string>>,
  setTotalKillsError: React.Dispatch<React.SetStateAction<string>>,
) => {
  const hasPlacementErrors = Object.values(placementErrors).some(
    (error) => error !== "",
  );
  if (hasPlacementErrors) {
    alert("Please fix placement errors before saving.");
    return;
  }

  const totalKillsValidationError = validateTotalKills(
    totalPlayersPlayed,
    teams,
    tempEdits,
    sequentialMatch,
  );
  if (totalKillsValidationError) {
    setTotalKillsError(totalKillsValidationError);
    alert("Please fix total kills error before saving.");
    return;
  }

  await saveEdits();
  setShowSequentialModal(false);
  setPlacementErrors({});
  setTotalPlayersPlayed("");
  setTotalKillsError("");
};
