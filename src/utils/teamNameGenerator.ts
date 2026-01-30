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
    "Namekian Warriors", "Universe 7", "Pride Troopers", "Cell Games",
    "Androids", "Majin Squad", "Capsule Corp", "Turtle School",
    "God of Destruction", "Ultra Instinct", "Super Saiyan Blue", "Galactic Patrol",

    // Attack on Titan themed
    "Survey Corps", "Garrison Regiment", "Military Police", "Titan Shifters",
    "Ackerman Clan", "Eldian Warriors", "Marleyan Army", "Thunder Spears",
    "Levi Squad", "Yeagerists", "Scout Legion", "Wall Defenders",

    // Demon Slayer themed
    "Hashira", "Demon Slayer Corps", "Kamado Clan", "Butterfly Mansion",
    "Muzan Army", "Upper Moons", "Lower Moons", "Flame Breathers",
    "Water Breathers", "Thunder Breathers", "Wind Breathers", "Stone Breathers",
    "Mist Breathers", "Love Breathers", "Serpent Breathers", "Sound Breathers",

    // Jujutsu Kaisen themed
    "Tokyo Jujutsu", "Kyoto Jujutsu", "Curse Users", "Special Grade",
    "Gojo Clan", "Zenin Clan", "Kamo Clan", "Sukuna Fingers",
    "Domain Expansion", "Cursed Spirits", "Star Plasma", "Six Eyes",

    // My Hero Academia themed
    "Class 1-A", "League of Villains", "Pro Heroes", "Wild Wild Pussycats",
    "Big Three", "Todoroki Family", "Paranormal Liberation", "Hero Killers",

    // Hunter x Hunter themed
    "Phantom Troupe", "Zoldyck Family", "Chimera Ants", "Hunter Association",
    "Nen Masters", "Greed Island", "Zodiac Twelve", "Shadow Beasts",

    // Bleach themed
    "Soul Reapers", "Espada", "Quincy Army", "Vizards",
    "Gotei 13", "Arrancar", "Fullbringers", "Zero Division",

    // More anime themed
    "Fairy Tail", "Phantom Lord", "Blue Pegasus", "Sabertooth",
    "Stardust Crusaders", "Passione", "Pillar Men", "Stand Users",
    "Night Raid", "Jaegers", "Revolutionaries", "Imperial Arms",
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
        // First team is always "Team Gay"
        if (i === 0) {
            const firstName = "Team Gay";
            usedNames.add(firstName);
            names.push(firstName);
            continue;
        }

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

export default {
    getRandomTeamName,
    getUniqueTeamNames,
    getTeamDisplayName,
    TEAM_NAMES,
};
