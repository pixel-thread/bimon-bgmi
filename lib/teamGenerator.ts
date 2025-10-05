import { Player } from "@/lib/types";
import { toast } from "sonner";

// Shuffle helper to randomize arrays
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper to pick a random index from matching teams
function getRandomTeamIndex(
  teams: Team[],
  condition: (team: Team) => boolean
): number | -1 {
  const matchingIndices = teams
    .map((team, index) => (condition(team) ? index : -1))
    .filter((index) => index !== -1);
  if (matchingIndices.length === 0) return -1;
  return matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
}

export type Team = {
  teamName: string;
  players: { ign: string; kills: number }[];
};

export function generateTeamsNew(
  selectedUltraNoobs: string[],
  selectedNoobs: string[],
  selectedPros: string[],
  selectedUltraPros: string[],
  allPlayers: {
    ultraNoobs: Player[];
    noobs: Player[];
    pros: Player[];
    ultraPros: Player[];
  },
  teamSize: number = 2
): Team[] | null {
  // Filter and shuffle players by category (allow banned players but exclude deleted)
  const unPool = shuffleArray(
    allPlayers.ultraNoobs.filter(
      (p) => selectedUltraNoobs.includes(p.id) && !p.deleted
    )
  );
  const nPool = shuffleArray(
    allPlayers.noobs.filter((p) => selectedNoobs.includes(p.id) && !p.deleted)
  );
  const pPool = shuffleArray(
    allPlayers.pros.filter((p) => selectedPros.includes(p.id) && !p.deleted)
  );
  const upPool = shuffleArray(
    allPlayers.ultraPros.filter(
      (p) => selectedUltraPros.includes(p.id) && !p.deleted
    )
  );

  // Validate selection
  const totalSelected =
    unPool.length + nPool.length + pPool.length + upPool.length;
  if (totalSelected < 1) {
    toast.error("Please select at least one player.");
    return null;
  }

  const teams: Team[] = [];

  // Helper to create a team (flexible for any team size)
  const createTeam = (...players: Player[]): Team => ({
    teamName: players.map((p) => p.name).join("_"),
    players: players.map((p) => ({ ign: p.name, kills: 0 })),
  });

  // Route to appropriate team generation based on team size
  if (teamSize === 1) {
    return generateSoloTeams(unPool, nPool, pPool, upPool, createTeam);
  } else if (teamSize === 2) {
    return generateDuoTeams(
      unPool,
      nPool,
      pPool,
      upPool,
      allPlayers,
      createTeam
    );
  } else if (teamSize === 3) {
    return generateTrioTeams(
      unPool,
      nPool,
      pPool,
      upPool,
      allPlayers,
      createTeam
    );
  } else if (teamSize === 4) {
    return generateSquadTeams(
      unPool,
      nPool,
      pPool,
      upPool,
      allPlayers,
      createTeam
    );
  } else {
    toast.error(`Team size ${teamSize} is not supported.`);
    return null;
  }
}

// Solo team generation - each player is their own team
function generateSoloTeams(
  unPool: Player[],
  nPool: Player[],
  pPool: Player[],
  upPool: Player[],
  createTeam: (...players: Player[]) => Team
): Team[] {
  const teams: Team[] = [];

  // Prioritize UP > P > N > UN for solo play
  while (upPool.length) teams.push(createTeam(upPool.shift()!));
  while (pPool.length) teams.push(createTeam(pPool.shift()!));
  while (nPool.length) teams.push(createTeam(nPool.shift()!));
  while (unPool.length) teams.push(createTeam(unPool.shift()!));

  return shuffleArray(teams);
}

// Your existing duo logic (unchanged)
function generateDuoTeams(
  unPool: Player[],
  nPool: Player[],
  pPool: Player[],
  upPool: Player[],
  allPlayers: {
    ultraNoobs: Player[];
    noobs: Player[];
    pros: Player[];
    ultraPros: Player[];
  },
  createTeam: (...players: Player[]) => Team
): Team[] {
  const teams: Team[] = [];

  // Pair Ultra Pros (UP) with Ultra Noobs (UN)
  while (upPool.length && unPool.length) {
    teams.push(createTeam(upPool.shift()!, unPool.shift()!));
  }

  // Pair Pros (P) with Ultra Noobs (UN)
  while (pPool.length && unPool.length) {
    teams.push(createTeam(pPool.shift()!, unPool.shift()!));
  }

  // Pair Pros (P) with Noobs (N)
  while (pPool.length && nPool.length) {
    teams.push(createTeam(pPool.shift()!, nPool.shift()!));
  }

  // Pair remaining Noobs together
  while (nPool.length > 1) {
    teams.push(createTeam(nPool.shift()!, nPool.shift()!));
  }

  // Pair remaining Ultra Noobs with Noobs
  while (unPool.length && nPool.length) {
    teams.push(createTeam(unPool.shift()!, nPool.shift()!));
  }

  // Pair remaining Ultra Noobs together only if no P+N or N+N teams exist
  if (
    getRandomTeamIndex(
      teams,
      (team) =>
        (team.players.length === 2 &&
          allPlayers.pros.some((p) => p.name === team.players[0].ign) &&
          allPlayers.noobs.some((n) => n.name === team.players[1].ign)) ||
        (allPlayers.noobs.some((n) => n.name === team.players[0].ign) &&
          allPlayers.noobs.some((n) => n.name === team.players[1].ign))
    ) === -1
  ) {
    while (unPool.length > 1) {
      teams.push(createTeam(unPool.shift()!, unPool.shift()!));
    }
  }

  // Handle leftover players, prioritize solo UP
  if (upPool.length) {
    while (upPool.length) teams.push(createTeam(upPool.shift()!));
}
if (pPool.length) {
    while (pPool.length) teams.push(createTeam(pPool.shift()!));
}
if (nPool.length) {
    while (nPool.length) teams.push(createTeam(nPool.shift()!));
}
if (unPool.length) {
    while (unPool.length) teams.push(createTeam(unPool.shift()!));
}

  // Swap UN+UN teams with P+N teams to form P+UN and N+UN
  let unUnTeamIndex = getRandomTeamIndex(
    teams,
    (team) =>
      team.players.length === 2 &&
      allPlayers.ultraNoobs.some((un) => un.name === team.players[0].ign) &&
      allPlayers.ultraNoobs.some((un) => un.name === team.players[1].ign)
  );

  while (unUnTeamIndex !== -1) {
    // First try swapping with P+N
    let pNTeamIndex = getRandomTeamIndex(
      teams,
      (team) =>
        team.players.length === 2 &&
        allPlayers.pros.some((p) => p.name === team.players[0].ign) &&
        allPlayers.noobs.some((n) => n.name === team.players[1].ign)
    );

    if (pNTeamIndex !== -1) {
      const unUnTeam = teams[unUnTeamIndex];
      const pNTeam = teams[pNTeamIndex];
      const ultraNoob1 = unUnTeam.players[0];
      const ultraNoob2 = unUnTeam.players[1];
      const pro = pNTeam.players[0];
      const noob = pNTeam.players[1];

      teams[unUnTeamIndex] = {
        teamName: `${pro.ign}_${ultraNoob1.ign}`,
        players: [
          { ign: pro.ign, kills: 0 },
          { ign: ultraNoob1.ign, kills: 0 },
        ],
      };
      teams[pNTeamIndex] = {
        teamName: `${noob.ign}_${ultraNoob2.ign}`,
        players: [
          { ign: noob.ign, kills: 0 },
          { ign: ultraNoob2.ign, kills: 0 },
        ],
      };
    } else {
      // Try swapping with N+N
      const nNTeamIndex = getRandomTeamIndex(
        teams,
        (team) =>
          team.players.length === 2 &&
          allPlayers.noobs.some((n) => n.name === team.players[0].ign) &&
          allPlayers.noobs.some((n) => n.name === team.players[1].ign)
      );

      if (nNTeamIndex !== -1) {
        const unUnTeam = teams[unUnTeamIndex];
        const nNTeam = teams[nNTeamIndex];
        const ultraNoob1 = unUnTeam.players[0];
        const ultraNoob2 = unUnTeam.players[1];
        const noob1 = nNTeam.players[0];
        const noob2 = nNTeam.players[1];

        teams[unUnTeamIndex] = {
          teamName: `${noob1.ign}_${ultraNoob1.ign}`,
          players: [
            { ign: noob1.ign, kills: 0 },
            { ign: ultraNoob1.ign, kills: 0 },
          ],
        };
        teams[nNTeamIndex] = {
          teamName: `${noob2.ign}_${ultraNoob2.ign}`,
          players: [
            { ign: noob2.ign, kills: 0 },
            { ign: ultraNoob2.ign, kills: 0 },
          ],
        };
      } else {
        break; // No P+N or N+N team to swap with
      }
    }

    unUnTeamIndex = getRandomTeamIndex(
      teams,
      (team) =>
        team.players.length === 2 &&
        allPlayers.ultraNoobs.some((un) => un.name === team.players[0].ign) &&
        allPlayers.ultraNoobs.some((un) => un.name === team.players[1].ign)
    );
  }

  // Swap weak solos (N or UN) with UP or P to prioritize UP solo
  let soloWeakIndex = getRandomTeamIndex(
    teams,
    (team) =>
      team.players.length === 1 &&
      (allPlayers.noobs.some((n) => n.name === team.players[0].ign) ||
        allPlayers.ultraNoobs.some((un) => un.name === team.players[0].ign))
  );

  while (soloWeakIndex !== -1) {
    // Try swapping with UP from UP+UN first
    let upUnTeamIndex = getRandomTeamIndex(
      teams,
      (team) =>
        team.players.length === 2 &&
        allPlayers.ultraPros.some((up) => up.name === team.players[0].ign) &&
        allPlayers.ultraNoobs.some((un) => un.name === team.players[1].ign)
    );

    if (upUnTeamIndex !== -1) {
      const soloWeakTeam = teams[soloWeakIndex];
      const upUnTeam = teams[upUnTeamIndex];
      const soloWeak = soloWeakTeam.players[0];
      const up = upUnTeam.players[0];
      const ultraNoob = upUnTeam.players[1];

      teams[upUnTeamIndex] = {
        teamName: `${soloWeak.ign}_${ultraNoob.ign}`,
        players: [
          { ign: soloWeak.ign, kills: 0 },
          { ign: ultraNoob.ign, kills: 0 },
        ],
      };
      teams[soloWeakIndex] = {
        teamName: up.ign,
        players: [{ ign: up.ign, kills: 0 }],
      };
    } else {
      // Try swapping with P from P+N
      const pNTeamIndex = getRandomTeamIndex(
        teams,
        (team) =>
          team.players.length === 2 &&
          allPlayers.pros.some((p) => p.name === team.players[0].ign) &&
          allPlayers.noobs.some((n) => n.name === team.players[1].ign)
      );

      if (pNTeamIndex !== -1) {
        const soloWeakTeam = teams[soloWeakIndex];
        const pNTeam = teams[pNTeamIndex];
        const soloWeak = soloWeakTeam.players[0];
        const p = pNTeam.players[0];
        const noob = pNTeam.players[1];

        teams[pNTeamIndex] = {
          teamName: `${soloWeak.ign}_${noob.ign}`,
          players: [
            { ign: soloWeak.ign, kills: 0 },
            { ign: noob.ign, kills: 0 },
          ],
        };
        teams[soloWeakIndex] = {
          teamName: p.ign,
          players: [{ ign: p.ign, kills: 0 }],
        };
      } else {
        break; // No swaps possible
      }
    }

    soloWeakIndex = getRandomTeamIndex(
      teams,
      (team) =>
        team.players.length === 1 &&
        (allPlayers.noobs.some((n) => n.name === team.players[0].ign) ||
          allPlayers.ultraNoobs.some((un) => un.name === team.players[0].ign))
    );
  }

  // Swap P solo with UP to prioritize UP solo
  let soloProIndex = getRandomTeamIndex(
    teams,
    (team) =>
      team.players.length === 1 &&
      allPlayers.pros.some((p) => p.name === team.players[0].ign)
  );

  while (soloProIndex !== -1) {
    const upUnTeamIndex = getRandomTeamIndex(
      teams,
      (team) =>
        team.players.length === 2 &&
        allPlayers.ultraPros.some((up) => up.name === team.players[0].ign) &&
        allPlayers.ultraNoobs.some((un) => un.name === team.players[1].ign)
    );

    if (upUnTeamIndex !== -1) {
      const soloProTeam = teams[soloProIndex];
      const upUnTeam = teams[upUnTeamIndex];
      const soloPro = soloProTeam.players[0];
      const up = upUnTeam.players[0];
      const ultraNoob = upUnTeam.players[1];

      teams[upUnTeamIndex] = {
        teamName: `${soloPro.ign}_${ultraNoob.ign}`,
        players: [
          { ign: soloPro.ign, kills: 0 },
          { ign: ultraNoob.ign, kills: 0 },
        ],
      };
      teams[soloProIndex] = {
        teamName: up.ign,
        players: [{ ign: up.ign, kills: 0 }],
      };
    } else {
      break; // No UP to swap with
    }

    soloProIndex = getRandomTeamIndex(
      teams,
      (team) =>
        team.players.length === 1 &&
        allPlayers.pros.some((p) => p.name === team.players[0].ign)
    );
  }

  // Swap weak N+UN teams with P+N teams to balance skills
  let weakTeamIndex = getRandomTeamIndex(
    teams,
    (team) =>
      team.players.length === 2 &&
      allPlayers.noobs.some((n) => n.name === team.players[0].ign) &&
      allPlayers.ultraNoobs.some((un) => un.name === team.players[1].ign)
  );

  while (weakTeamIndex !== -1) {
    const pNTeamIndex = getRandomTeamIndex(
      teams,
      (team) =>
        team.players.length === 2 &&
        allPlayers.pros.some((p) => p.name === team.players[0].ign) &&
        allPlayers.noobs.some((n) => n.name === team.players[1].ign)
    );

    if (pNTeamIndex !== -1) {
      const weakTeam = teams[weakTeamIndex];
      const pNTeam = teams[pNTeamIndex];
      const noobFromWeak = weakTeam.players[0];
      const ultraNoob = weakTeam.players[1];
      const pro = pNTeam.players[0];
      const noobFromPN = pNTeam.players[1];

      teams[weakTeamIndex] = {
        teamName: `${pro.ign}_${ultraNoob.ign}`,
        players: [
          { ign: pro.ign, kills: 0 },
          { ign: ultraNoob.ign, kills: 0 },
        ],
      };
      teams[pNTeamIndex] = {
        teamName: `${noobFromWeak.ign}_${noobFromPN.ign}`,
        players: [
          { ign: noobFromWeak.ign, kills: 0 },
          { ign: noobFromPN.ign, kills: 0 },
        ],
      };
    } else {
      break; // No P+N team to swap with
    }

    weakTeamIndex = getRandomTeamIndex(
      teams,
      (team) =>
        team.players.length === 2 &&
        allPlayers.noobs.some((n) => n.name === team.players[0].ign) &&
        allPlayers.ultraNoobs.some((un) => un.name === team.players[1].ign)
    );
  }

  // Shuffle final teams to randomize output order
  return shuffleArray(teams);
}

// Trio team generation (3 players) - enhanced balanced approach
function generateTrioTeams(
  unPool: Player[],
  nPool: Player[],
  pPool: Player[],
  upPool: Player[],
  allPlayers: {
    ultraNoobs: Player[];
    noobs: Player[];
    pros: Player[];
    ultraPros: Player[];
  },
  createTeam: (...players: Player[]) => Team
): Team[] {
  const teams: Team[] = [];

  // Primary trio patterns (most balanced) - each trio has one strong leader
  // UP+N+UN: Ultra Pro + Noob + Ultra Noob (ideal balance)
  while (upPool.length && nPool.length && unPool.length) {
    teams.push(createTeam(upPool.shift()!, nPool.shift()!, unPool.shift()!));
  }

  // P+N+UN: Pro + Noob + Ultra Noob (good balance)
  while (pPool.length && nPool.length && unPool.length) {
    teams.push(createTeam(pPool.shift()!, nPool.shift()!, unPool.shift()!));
  }

  // Secondary patterns - when we have excess of certain skill levels
  // UP+UP+UN: Ultra Pro + Ultra Pro + Ultra Noob (strong duo + weak)
  while (upPool.length > 1 && unPool.length) {
    teams.push(createTeam(upPool.shift()!, upPool.shift()!, unPool.shift()!));
  }

  // P+P+UN: Pro + Pro + Ultra Noob (decent balance)
  while (pPool.length > 1 && unPool.length) {
    teams.push(createTeam(pPool.shift()!, pPool.shift()!, unPool.shift()!));
  }

  // UP+P+N: Ultra Pro + Pro + Noob (strong trio, no ultra noob needed)
  while (upPool.length && pPool.length && nPool.length) {
    teams.push(createTeam(upPool.shift()!, pPool.shift()!, nPool.shift()!));
  }

  // N+N+UN: Noob + Noob + Ultra Noob (only if no stronger players available)
  while (
    nPool.length > 1 &&
    unPool.length &&
    upPool.length === 0 &&
    pPool.length === 0
  ) {
    teams.push(createTeam(nPool.shift()!, nPool.shift()!, unPool.shift()!));
  }

  // Handle remaining players as balanced duos (following your duo philosophy)
  // Prioritize balanced duos: UP+UN, P+UN, P+N
  while (upPool.length && unPool.length) {
    teams.push(createTeam(upPool.shift()!, unPool.shift()!));
  }
  while (pPool.length && unPool.length) {
    teams.push(createTeam(pPool.shift()!, unPool.shift()!));
  }
  while (pPool.length && nPool.length) {
    teams.push(createTeam(pPool.shift()!, nPool.shift()!));
  }

  // Only create N+N duos if no stronger players available to balance
  if (upPool.length === 0 && pPool.length === 0) {
    while (nPool.length > 1) {
      teams.push(createTeam(nPool.shift()!, nPool.shift()!));
    }
  }

  // Completely avoid N+UN duos - they're too unbalanced

  // Handle leftover players, prioritize solo UP > P > N > UN (following duo logic)
  if (upPool.length) {
    while (upPool.length) teams.push(createTeam(upPool.shift()!));
}
if (pPool.length) {
    while (pPool.length) teams.push(createTeam(pPool.shift()!));
}
if (nPool.length) {
    while (nPool.length) teams.push(createTeam(nPool.shift()!));
}
if (unPool.length) {
    while (unPool.length) teams.push(createTeam(unPool.shift()!));
}

  // Advanced optimization: Swap weak solos with strong players from teams
  let soloWeakIndex = getRandomTeamIndex(
    teams,
    (team) =>
      team.players.length === 1 &&
      (allPlayers.noobs.some((n) => n.name === team.players[0].ign) ||
        allPlayers.ultraNoobs.some((un) => un.name === team.players[0].ign))
  );

  while (soloWeakIndex !== -1) {
    // Try swapping with UP from any trio containing UP
    let upTrioIndex = getRandomTeamIndex(
      teams,
      (team) =>
        team.players.length === 3 &&
        team.players.some((player) =>
          allPlayers.ultraPros.some((up) => up.name === player.ign)
        )
    );

    if (upTrioIndex !== -1) {
      const soloWeakTeam = teams[soloWeakIndex];
      const upTrioTeam = teams[upTrioIndex];
      const soloWeak = soloWeakTeam.players[0];

      // Find the UP player in the trio
      const upPlayerIndex = upTrioTeam.players.findIndex((player) =>
        allPlayers.ultraPros.some((up) => up.name === player.ign)
      );
      const upPlayer = upTrioTeam.players[upPlayerIndex];
      const otherPlayers = upTrioTeam.players.filter(
        (_, index) => index !== upPlayerIndex
      );

      // Replace UP in trio with weak solo, make UP the new solo
      teams[upTrioIndex] = {
        teamName: `${soloWeak.ign}_${otherPlayers[0].ign}_${otherPlayers[1].ign}`,
        players: [
          { ign: soloWeak.ign, kills: 0 },
          { ign: otherPlayers[0].ign, kills: 0 },
          { ign: otherPlayers[1].ign, kills: 0 },
        ],
      };
      teams[soloWeakIndex] = {
        teamName: upPlayer.ign,
        players: [{ ign: upPlayer.ign, kills: 0 }],
      };
    } else {
      // Try swapping with P from any trio containing P
      const pTrioIndex = getRandomTeamIndex(
        teams,
        (team) =>
          team.players.length === 3 &&
          team.players.some((player) =>
            allPlayers.pros.some((p) => p.name === player.ign)
          )
      );

      if (pTrioIndex !== -1) {
        const soloWeakTeam = teams[soloWeakIndex];
        const pTrioTeam = teams[pTrioIndex];
        const soloWeak = soloWeakTeam.players[0];

        // Find the P player in the trio
        const pPlayerIndex = pTrioTeam.players.findIndex((player) =>
          allPlayers.pros.some((p) => p.name === player.ign)
        );
        const pPlayer = pTrioTeam.players[pPlayerIndex];
        const otherPlayers = pTrioTeam.players.filter(
          (_, index) => index !== pPlayerIndex
        );

        teams[pTrioIndex] = {
          teamName: `${soloWeak.ign}_${otherPlayers[0].ign}_${otherPlayers[1].ign}`,
          players: [
            { ign: soloWeak.ign, kills: 0 },
            { ign: otherPlayers[0].ign, kills: 0 },
            { ign: otherPlayers[1].ign, kills: 0 },
          ],
        };
        teams[soloWeakIndex] = {
          teamName: pPlayer.ign,
          players: [{ ign: pPlayer.ign, kills: 0 }],
        };
      } else {
        break; // No swaps possible
      }
    }

    soloWeakIndex = getRandomTeamIndex(
      teams,
      (team) =>
        team.players.length === 1 &&
        (allPlayers.noobs.some((n) => n.name === team.players[0].ign) ||
          allPlayers.ultraNoobs.some((un) => un.name === team.players[0].ign))
    );
  }

  // Additional optimization: Swap P solo with UP from duos to prioritize UP solo
  let soloProIndex = getRandomTeamIndex(
    teams,
    (team) =>
      team.players.length === 1 &&
      allPlayers.pros.some((p) => p.name === team.players[0].ign)
  );

  while (soloProIndex !== -1) {
    const upDuoIndex = getRandomTeamIndex(
      teams,
      (team) =>
        team.players.length === 2 &&
        team.players.some((player) =>
          allPlayers.ultraPros.some((up) => up.name === player.ign)
        )
    );

    if (upDuoIndex !== -1) {
      const soloProTeam = teams[soloProIndex];
      const upDuoTeam = teams[upDuoIndex];
      const soloPro = soloProTeam.players[0];

      // Find the UP player in the duo
      const upPlayerIndex = upDuoTeam.players.findIndex((player) =>
        allPlayers.ultraPros.some((up) => up.name === player.ign)
      );
      const upPlayer = upDuoTeam.players[upPlayerIndex];
      const otherPlayer = upDuoTeam.players[1 - upPlayerIndex];

      teams[upDuoIndex] = {
        teamName: `${soloPro.ign}_${otherPlayer.ign}`,
        players: [
          { ign: soloPro.ign, kills: 0 },
          { ign: otherPlayer.ign, kills: 0 },
        ],
      };
      teams[soloProIndex] = {
        teamName: upPlayer.ign,
        players: [{ ign: upPlayer.ign, kills: 0 }],
      };
    } else {
      break; // No UP duo to swap with
    }

    soloProIndex = getRandomTeamIndex(
      teams,
      (team) =>
        team.players.length === 1 &&
        allPlayers.pros.some((p) => p.name === team.players[0].ign)
    );
  }

  return shuffleArray(teams);
}

// Squad team generation (4 players) - following your category-based philosophy
function generateSquadTeams(
  unPool: Player[],
  nPool: Player[],
  pPool: Player[],
  upPool: Player[],
  allPlayers: {
    ultraNoobs: Player[];
    noobs: Player[];
    pros: Player[];
    ultraPros: Player[];
  },
  createTeam: (...players: Player[]) => Team
): Team[] {
  const teams: Team[] = [];

  // Primary squad patterns (most balanced)
  // UP+P+N+UN: Ultra Pro + Pro + Noob + Ultra Noob (ideal balance)
  while (upPool.length && pPool.length && nPool.length && unPool.length) {
    teams.push(
      createTeam(
        upPool.shift()!,
        pPool.shift()!,
        nPool.shift()!,
        unPool.shift()!
      )
    );
  }

  // Secondary patterns
  // UP+N+N+UN: Ultra Pro + Noob + Noob + Ultra Noob
  while (upPool.length && nPool.length > 1 && unPool.length) {
    teams.push(
      createTeam(
        upPool.shift()!,
        nPool.shift()!,
        nPool.shift()!,
        unPool.shift()!
      )
    );
  }

  // P+P+N+UN: Pro + Pro + Noob + Ultra Noob
  while (pPool.length > 1 && nPool.length && unPool.length) {
    teams.push(
      createTeam(
        pPool.shift()!,
        pPool.shift()!,
        nPool.shift()!,
        unPool.shift()!
      )
    );
  }

  // Handle remaining players as balanced trios and duos
  // Form balanced trios first (higher skill leading)
  while (upPool.length && nPool.length && unPool.length) {
    teams.push(createTeam(upPool.shift()!, nPool.shift()!, unPool.shift()!));
  }
  while (pPool.length && nPool.length && unPool.length) {
    teams.push(createTeam(pPool.shift()!, nPool.shift()!, unPool.shift()!));
  }

  // Form balanced duos (avoid N+N, N+UN combinations)
  while (upPool.length && unPool.length) {
    teams.push(createTeam(upPool.shift()!, unPool.shift()!));
  }
  while (pPool.length && unPool.length) {
    teams.push(createTeam(pPool.shift()!, unPool.shift()!));
  }
  while (pPool.length && nPool.length) {
    teams.push(createTeam(pPool.shift()!, nPool.shift()!));
  }

  // Only create N+N duos if no stronger players available to balance
  if (upPool.length === 0 && pPool.length === 0) {
    while (nPool.length > 1) {
      teams.push(createTeam(nPool.shift()!, nPool.shift()!));
    }
  }

  // Avoid N+UN duos - prefer keeping them as solos for better balance

  // Handle leftover players, prioritize solo UP (following duo logic)
  if (upPool.length) {
    while (upPool.length) teams.push(createTeam(upPool.shift()!));
}
if (pPool.length) {
    while (pPool.length) teams.push(createTeam(pPool.shift()!));
}
if (nPool.length) {
    while (nPool.length) teams.push(createTeam(nPool.shift()!));
}
if (unPool.length) {
    while (unPool.length) teams.push(createTeam(unPool.shift()!));
}

  // Swap weak solos (N or UN) with strong players from teams to prioritize UP/P solos
  let soloWeakIndex = getRandomTeamIndex(
    teams,
    (team) =>
      team.players.length === 1 &&
      (allPlayers.noobs.some((n) => n.name === team.players[0].ign) ||
        allPlayers.ultraNoobs.some((un) => un.name === team.players[0].ign))
  );

  while (soloWeakIndex !== -1) {
    // Try swapping with UP from UP+P+N+UN squad first
    let upSquadIndex = getRandomTeamIndex(
      teams,
      (team) =>
        team.players.length === 4 &&
        allPlayers.ultraPros.some((up) => up.name === team.players[0].ign)
    );

    if (upSquadIndex !== -1) {
      const soloWeakTeam = teams[soloWeakIndex];
      const upSquadTeam = teams[upSquadIndex];
      const soloWeak = soloWeakTeam.players[0];
      const up = upSquadTeam.players[0];
      const otherPlayer1 = upSquadTeam.players[1];
      const otherPlayer2 = upSquadTeam.players[2];
      const otherPlayer3 = upSquadTeam.players[3];

      // Replace UP in squad with weak solo, make UP the new solo
      teams[upSquadIndex] = {
        teamName: `${soloWeak.ign}_${otherPlayer1.ign}_${otherPlayer2.ign}_${otherPlayer3.ign}`,
        players: [
          { ign: soloWeak.ign, kills: 0 },
          { ign: otherPlayer1.ign, kills: 0 },
          { ign: otherPlayer2.ign, kills: 0 },
          { ign: otherPlayer3.ign, kills: 0 },
        ],
      };
      teams[soloWeakIndex] = {
        teamName: up.ign,
        players: [{ ign: up.ign, kills: 0 }],
      };
    } else {
      // Try swapping with P from P+P+N+UN squad
      const pSquadIndex = getRandomTeamIndex(
        teams,
        (team) =>
          team.players.length === 4 &&
          allPlayers.pros.some((p) => p.name === team.players[0].ign)
      );

      if (pSquadIndex !== -1) {
        const soloWeakTeam = teams[soloWeakIndex];
        const pSquadTeam = teams[pSquadIndex];
        const soloWeak = soloWeakTeam.players[0];
        const p = pSquadTeam.players[0];
        const otherPlayer1 = pSquadTeam.players[1];
        const otherPlayer2 = pSquadTeam.players[2];
        const otherPlayer3 = pSquadTeam.players[3];

        teams[pSquadIndex] = {
          teamName: `${soloWeak.ign}_${otherPlayer1.ign}_${otherPlayer2.ign}_${otherPlayer3.ign}`,
          players: [
            { ign: soloWeak.ign, kills: 0 },
            { ign: otherPlayer1.ign, kills: 0 },
            { ign: otherPlayer2.ign, kills: 0 },
            { ign: otherPlayer3.ign, kills: 0 },
          ],
        };
        teams[soloWeakIndex] = {
          teamName: p.ign,
          players: [{ ign: p.ign, kills: 0 }],
        };
      } else {
        break; // No swaps possible
      }
    }

    soloWeakIndex = getRandomTeamIndex(
      teams,
      (team) =>
        team.players.length === 1 &&
        (allPlayers.noobs.some((n) => n.name === team.players[0].ign) ||
          allPlayers.ultraNoobs.some((un) => un.name === team.players[0].ign))
    );
  }

  return shuffleArray(teams);
}
