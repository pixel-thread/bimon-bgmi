/**
 * Team Name Generator
 * Generates unique, fun team names for duo, trio, and squad tournaments.
 * Names are deterministically generated based on team ID for consistency.
 */

// Curated list of BGMI/esports themed team names
const TEAM_NAMES = [
    // Predator/Animal themed
    "Shadow Wolves", "Phoenix Rising", "Thunder Hawks", "Viper Squad",
    "Dragon Force", "Night Stalkers", "Storm Eagles", "Frost Tigers",
    "Crimson Panthers", "Silver Foxes", "Dark Ravens", "Iron Lions",
    "Ghost Bears", "Apex Hunters", "Savage Sharks", "Swift Cobras",
    "Raging Bulls", "Silent Owls", "Arctic Wolves", "Golden Eagles",

    // Action/Military themed
    "Thunder Strike", "Shadow Ops", "Elite Force", "Titan Squad",
    "Storm Riders", "Death Squad", "War Machine", "Chaos Brigade",
    "Phantom Force", "Stealth Unit", "Black Ops", "Alpha Team",
    "Omega Squad", "Delta Force", "Bravo Unit", "Echo Warriors",
    "Sierra Company", "Victor Team", "Whiskey Platoon", "X-Ray Division",

    // Mythical/Fantasy themed
    "Dragon Knights", "Phoenix Lords", "Shadow Demons", "Thunder Gods",
    "Mystic Warriors", "Legendary Beasts", "Immortal Squad", "Divine Fury",
    "Chaos Lords", "Dark Knights", "Storm Titans", "Fire Demons",
    "Ice Warlords", "Spirit Hunters", "Magic Guardians", "Eternal Flames",
    "Cosmic Warriors", "Nebula Force", "Galaxy Riders", "Star Hunters",

    // Cool/Edgy themed
    "Nightmare Crew", "Reaper Squad", "Inferno Team", "Blizzard Force",
    "Rampage Unit", "Havoc Team", "Mayhem Squad", "Vendetta Crew",
    "Carnage Corps", "Savage Kings", "Ruthless Squad", "Lethal Unit",
    "Fatal Five", "Deadly Trio", "Killer Instinct", "Danger Zone",
    "Zero Fear", "No Mercy", "Last Stand", "Final Strike",

    // Numbers/Tech themed
    "Code Red", "Sector 7", "Squad 47", "Unit 404",
    "Team Alpha", "Bravo Six", "Triple Threat", "Double Trouble",
    "Quad Squad", "The Trio", "Dynamic Duo", "The Four Horsemen",
    "Circuit Breakers", "System Override", "Data Storm", "Pixel Warriors",

    // Nature/Elements themed  
    "Thunder Storm", "Solar Flare", "Lunar Eclipse", "Volcanic Fury",
    "Tsunami Wave", "Earthquake Force", "Hurricane Squad", "Tornado Team",
    "Avalanche Crew", "Wildfire Unit", "Desert Storm", "Ocean Force",
    "Mountain Kings", "Forest Shadows", "River Raiders", "Valley Vipers",

    // More unique combinations
    "Apex Predators", "Night Crawlers", "Day Breakers", "Soul Reapers",
    "Mind Benders", "Time Lords", "Space Rangers", "Ground Zero",
    "Sky Raiders", "Sea Wolves", "Land Sharks", "Air Strike",
    "Power Surge", "Energy Elite", "Force Field", "Impact Zone",

    // Indian/Desi themed (for BGMI audience)
    "Desi Destroyers", "Mumbai Mavericks", "Delhi Dragons", "Chennai Champions",
    "Kolkata Kings", "Bangalore Blazers", "Hyderabad Hawks", "Jaipur Jaguars",
    "Punjab Panthers", "Gujarat Giants", "Rajput Warriors", "Maratha Militia",
    "Sikh Soldiers", "Tamil Tigers", "Kerala Knights", "Bengal Bombers",
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

export default {
    getRandomTeamName,
    getUniqueTeamNames,
    getTeamDisplayName,
    TEAM_NAMES,
};
