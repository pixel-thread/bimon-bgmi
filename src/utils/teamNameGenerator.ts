/**
 * Team Name Generator
 * Generates unique, fun team names for duo, trio, and squad tournaments.
 * Names are deterministically generated based on team ID for consistency.
 */

// Curated list of anime-themed team names
const TEAM_NAMES = [
    // One Piece themed
    "Straw Hats", "Red Hair Pirates", "Whitebeard Pirates", "Heart Pirates",
    "Blackbeard Crew", "Big Mom Pirates", "Beast Pirates", "Baroque Works",
    "Revolutionary Army", "Marine Admirals", "Warlords", "Worst Generation",
    "Vinsmoke Family", "Kozuki Samurai", "Mink Tribe", "Fishman Pirates",

    // Naruto themed
    "Akatsuki", "Team 7", "Uchiha Clan", "Hyuga Clan",
    "Sannin Legends", "Root ANBU", "Konoha Jonin", "Sand Siblings",
    "Tailed Beasts", "Sage Mode", "Sharingan Squad", "Rasengan Force",
    "Hokage Guard", "Otsutsuki Clan", "Sound Four", "Kage Summit",

    // Dragon Ball themed
    "Z Fighters", "Saiyan Elite", "Frieza Force", "Ginyu Force",
    "Namekian Warriors", "Universe 7", "Pride Troopers", "Omega Destroyers",
    "Androids", "Majin Squad", "Capsule Corp", "Turtle School",
    "God of Destruction", "Beerus Wrath", "Super Saiyan Blue", "Galactic Patrol",

    // Attack on Titan themed
    "Survey Corps", "Garrison Regiment", "Military Police", "Titan Shifters",
    "Ackerman Clan", "Eldian Warriors", "Marleyan Army", "Thunder Spears",
    "Levi Squad", "Yeagerists", "Scout Legion", "Wall Defenders",

    // Demon Slayer themed
    "Hashira", "Demon Slayer Corps", "Kamado Clan", "Blood Demons",
    "Muzan Army", "Upper Moons", "Lower Moons", "Flame Breathers",
    "Water Breathers", "Thunder Breathers", "Wind Breathers", "Stone Breathers",
    "Mist Breathers", "Serpent Wrath", "Serpent Breathers", "Sound Breathers",

    // Jujutsu Kaisen themed
    "Tokyo Jujutsu", "Kyoto Jujutsu", "Curse Users", "Special Grade",
    "Gojo Clan", "Zenin Clan", "Kamo Clan", "Sukuna Fingers",
    "Domain Expansion", "Cursed Spirits", "Star Plasma", "Six Eyes",

    // My Hero Academia themed
    "Class 1-A", "League of Villains", "Pro Heroes", "Vanguard Action",
    "Big Three", "Todoroki Family", "Paranormal Liberation", "Hero Killers",

    // Hunter x Hunter themed
    "Phantom Troupe", "Zoldyck Family", "Chimera Ants", "Hunter Association",
    "Nen Masters", "Greed Island", "Zodiac Twelve", "Shadow Beasts",

    // Bleach themed
    "Soul Reapers", "Espada", "Quincy Army", "Vizards",
    "Gotei 13", "Arrancar", "Fullbringers", "Zero Division",

    // More anime themed
    "Death Legion", "Phantom Lord", "Blood Ravens", "Sabertooth",
    "Stardust Crusaders", "Passione", "Pillar Men", "Stand Users",
    "Night Raid", "Jaegers", "Revolutionaries", "Imperial Arms",

    // Extra badass gaming names
    "Apex Predators", "Omega Slayers", "Void Walkers", "Shadow Syndicate",
    "Death Dealers", "Skull Crushers", "Venom Squad", "Chaos Legion",
    "Dark Reapers", "Iron Wolves", "Crimson Fury", "Storm Breakers",
    "Phantom Strike", "Savage Kings", "Lethal Force", "Warzone Elite",

    // Popular Anime Characters (iconic names)
    "Team Goku", "Team Vegeta", "Team Naruto", "Team Sasuke",
    "Team Itachi", "Team Madara", "Team Kakashi", "Team Minato",
    "Team Levi", "Team Eren", "Team Gojo", "Team Sukuna",
    "Team Tanjiro", "Team Zoro", "Team Luffy", "Team Shanks",
    "Team Whitebeard", "Team Aizen", "Team Ichigo", "Team Saitama",
];

/**
 * Simple hash function to convert string to number
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Get a deterministic random team name based on team ID
 * The same team ID will always return the same team name
 */
export function getRandomTeamName(teamId: string): string {
    const hash = hashString(teamId);
    const index = hash % TEAM_NAMES.length;
    return TEAM_NAMES[index];
}

/**
 * Get multiple unique random team names for a tournament
 * Uses tournament ID + team index for deterministic but unique names
 */
export function getUniqueTeamNames(tournamentId: string, count: number): string[] {
    const usedNames = new Set<string>();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
        // Create a unique key for each team position
        const key = `${tournamentId}-team-${i}`;
        let name = getRandomTeamName(key);

        // If name is already used, try with a suffix
        let suffix = 1;
        while (usedNames.has(name) && suffix <= 10) {
            name = getRandomTeamName(`${key}-${suffix}`);
            suffix++;
        }

        // If still not unique, append the index
        if (usedNames.has(name)) {
            name = `${TEAM_NAMES[i % TEAM_NAMES.length]} ${i + 1}`;
        }

        usedNames.add(name);
        names.push(name);
    }

    return names;
}

/**
 * Get a display name for a team
 * For SOLO teams (1 player), returns the player name
 * For multi-player teams (DUO, TRIO, SQUAD), returns a random team name
 * 
 * @param teamId - The team's unique ID
 * @param players - Array of players in the team
 * @param sanitizeDisplayNameFn - Optional function to sanitize player display names
 */
export function getTeamDisplayName(
    teamId: string,
    players: Array<{ name: string; displayName?: string | null }>,
    sanitizeDisplayNameFn?: (name: string) => string
): string {
    // For solo teams, use the player's name
    if (players.length === 1) {
        const player = players[0];
        const name = player.displayName || player.name;
        return sanitizeDisplayNameFn ? sanitizeDisplayNameFn(name) : name;
    }

    // For multi-player teams, use random team name
    return getRandomTeamName(teamId);
}

interface TeamInfo {
    id: string;
    players: Array<{ name: string; displayName?: string | null }>;
}

/**
 * Get unique display names for multiple teams in a tournament
 * This prevents duplicate names by tracking used names and applying suffixes
 * 
 * @param teams - Array of teams with id and players
 * @param sanitizeDisplayNameFn - Optional function to sanitize player display names
 * @returns Map of team ID to unique display name
 */
export function getUniqueTeamDisplayNames(
    teams: TeamInfo[],
    sanitizeDisplayNameFn?: (name: string) => string
): Map<string, string> {
    const usedNames = new Set<string>();
    const teamNameMap = new Map<string, string>();

    // First pass: assign all teams their hash-based names
    for (const team of teams) {
        // For solo teams, use the player's name
        if (team.players.length === 1) {
            const player = team.players[0];
            const name = player.displayName || player.name;
            const displayName = sanitizeDisplayNameFn ? sanitizeDisplayNameFn(name) : name;
            teamNameMap.set(team.id, displayName);
            continue;
        }

        // For multi-player teams, get a random name based on team ID (consistent)
        let name = getRandomTeamName(team.id);

        // If name is already used, try with different suffixes
        if (usedNames.has(name)) {
            let suffix = 2;
            let uniqueName = `${name} ${suffix}`;

            // Try numbered suffixes first
            while (usedNames.has(uniqueName) && suffix <= 10) {
                suffix++;
                uniqueName = `${name} ${suffix}`;
            }

            // If still not unique, try hashing with suffixes
            if (usedNames.has(uniqueName)) {
                for (let i = 1; i <= 20; i++) {
                    const altName = getRandomTeamName(`${team.id}-alt-${i}`);
                    if (!usedNames.has(altName)) {
                        uniqueName = altName;
                        break;
                    }
                }
            }

            name = uniqueName;
        }

        usedNames.add(name);
        teamNameMap.set(team.id, name);
    }

    // Pick one multi-player team to be "Team Gay" (the one with lowest hash)
    const multiPlayerTeams = teams.filter(t => t.players.length > 1);
    if (multiPlayerTeams.length > 0) {
        // Find the team with the lowest hash value - this is deterministic and stable
        let lowestHash = Infinity;
        let selectedTeamId = "";

        for (const team of multiPlayerTeams) {
            const hash = hashString(team.id);
            if (hash < lowestHash) {
                lowestHash = hash;
                selectedTeamId = team.id;
            }
        }

        // Replace this team's name with "Team Gay"
        if (selectedTeamId) {
            teamNameMap.set(selectedTeamId, "Team Gay");
        }
    }

    return teamNameMap;
}

export default {
    getRandomTeamName,
    getUniqueTeamNames,
    getTeamDisplayName,
    getUniqueTeamDisplayNames,
    TEAM_NAMES,
};
