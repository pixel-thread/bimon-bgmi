// BACKUP FILE - Original Team Generation Logic
// This file contains the original team generation algorithm before implementing balanced K/D and win ratio pairing
// You can revert to this logic by copying this file back to teamGenerator.ts

import { Player } from "@/src/lib/types";
import { toast } from "sonner";

// Player with calculated stats for balanced team generation
interface PlayerWithStats extends Player {
  kdRatio: number;
  winRate: number;
  skillScore: number;
  matchesPlayed: number;
  totalKills: number;
  totalWins: number;
}

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
  }
): Team[] | null {
  // Filter and shuffle players by category
  const unPool = shuffleArray(
    allPlayers.ultraNoobs.filter((p) => selectedUltraNoobs.includes(p.id))
  );
  const nPool = shuffleArray(
    allPlayers.noobs.filter((p) => selectedNoobs.includes(p.id))
  );
  const pPool = shuffleArray(
    allPlayers.pros.filter((p) => selectedPros.includes(p.id))
  );
  const upPool = shuffleArray(
    allPlayers.ultraPros.filter((p) => selectedUltraPros.includes(p.id))
  );

  // Validate selection
  const totalSelected =
    unPool.length + nPool.length + pPool.length + upPool.length;
  if (totalSelected < 1) {
    toast.error("Please select at least one player.");
    return null;
  }

  const teams: Team[] = [];

  // Helper to create a team
  const createTeam = (p1: Player, p2?: Player): Team => ({
    teamName: p2 ? `${p1.name}_${p2.name}` : p1.name,
    players: [
      { ign: p1.name, kills: 0 },
      ...(p2 ? [{ ign: p2.name, kills: 0 }] : []),
    ],
  });

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
  } else if (pPool.length) {
    while (pPool.length) teams.push(createTeam(pPool.shift()!));
  } else if (nPool.length) {
    while (nPool.length) teams.push(createTeam(nPool.shift()!));
  } else if (unPool.length) {
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
