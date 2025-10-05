import { Player } from "@/lib/types";

export interface MockPlayerWithStats {
    id: string;
    name: string;
    category: "Noob" | "Pro" | "Ultra Noob" | "Ultra Pro";
    phoneNumber?: string | null;
    balance?: number;
    kdRatio: number;
    winRate: number;
    avgPlacement: number;
    matchesPlayed: number;
}

// Mock scenarios for testing team generation
export const mockScenarios = {
    balanced: {
        name: "Balanced Teams",
        description: "Equal number of pros and noobs",
        players: [
            { id: "1", name: "Pro1", category: "Pro", kdRatio: 2.5, winRate: 0.3, avgPlacement: 3.2, matchesPlayed: 50, balance: 0 },
            { id: "2", name: "Pro2", category: "Pro", kdRatio: 2.2, winRate: 0.25, avgPlacement: 4.1, matchesPlayed: 45, balance: 0 },
            { id: "3", name: "Pro3", category: "Pro", kdRatio: 2.0, winRate: 0.2, avgPlacement: 5.0, matchesPlayed: 40, balance: 0 },
            { id: "4", name: "Pro4", category: "Pro", kdRatio: 1.8, winRate: 0.18, avgPlacement: 5.5, matchesPlayed: 38, balance: 0 },
            { id: "5", name: "Noob1", category: "Noob", kdRatio: 0.8, winRate: 0.05, avgPlacement: 10.2, matchesPlayed: 30, balance: 0 },
            { id: "6", name: "Noob2", category: "Noob", kdRatio: 0.7, winRate: 0.04, avgPlacement: 11.5, matchesPlayed: 25, balance: 0 },
            { id: "7", name: "Noob3", category: "Noob", kdRatio: 0.6, winRate: 0.03, avgPlacement: 12.8, matchesPlayed: 20, balance: 0 },
            { id: "8", name: "Noob4", category: "Noob", kdRatio: 0.5, winRate: 0.02, avgPlacement: 14.0, matchesPlayed: 15, balance: 0 },
        ]
    },
    unbalanced: {
        name: "Unbalanced Teams",
        description: "More pros than noobs",
        players: [
            { id: "1", name: "Pro1", category: "Pro", kdRatio: 2.5, winRate: 0.3, avgPlacement: 3.2, matchesPlayed: 50, balance: 0 },
            { id: "2", name: "Pro2", category: "Pro", kdRatio: 2.2, winRate: 0.25, avgPlacement: 4.1, matchesPlayed: 45, balance: 0 },
            { id: "3", name: "Pro3", category: "Pro", kdRatio: 2.0, winRate: 0.2, avgPlacement: 5.0, matchesPlayed: 40, balance: 0 },
            { id: "4", name: "Pro4", category: "Pro", kdRatio: 1.8, winRate: 0.18, avgPlacement: 5.5, matchesPlayed: 38, balance: 0 },
            { id: "5", name: "Pro5", category: "Pro", kdRatio: 1.7, winRate: 0.15, avgPlacement: 6.0, matchesPlayed: 35, balance: 0 },
            { id: "6", name: "Pro6", category: "Pro", kdRatio: 1.6, winRate: 0.12, avgPlacement: 6.5, matchesPlayed: 32, balance: 0 },
            { id: "7", name: "Noob1", category: "Noob", kdRatio: 0.8, winRate: 0.05, avgPlacement: 10.2, matchesPlayed: 30, balance: 0 },
            { id: "8", name: "Noob2", category: "Noob", kdRatio: 0.7, winRate: 0.04, avgPlacement: 11.5, matchesPlayed: 25, balance: 0 },
        ]
    },
    mixed: {
        name: "Mixed Skill Levels",
        description: "Mix of all skill categories",
        players: [
            { id: "1", name: "UltraPro1", category: "Ultra Pro", kdRatio: 3.5, winRate: 0.4, avgPlacement: 2.0, matchesPlayed: 60, balance: 0 },
            { id: "2", name: "Pro1", category: "Pro", kdRatio: 2.2, winRate: 0.25, avgPlacement: 4.1, matchesPlayed: 45, balance: 0 },
            { id: "3", name: "Pro2", category: "Pro", kdRatio: 2.0, winRate: 0.2, avgPlacement: 5.0, matchesPlayed: 40, balance: 0 },
            { id: "4", name: "Noob1", category: "Noob", kdRatio: 0.8, winRate: 0.05, avgPlacement: 10.2, matchesPlayed: 30, balance: 0 },
            { id: "5", name: "Noob2", category: "Noob", kdRatio: 0.7, winRate: 0.04, avgPlacement: 11.5, matchesPlayed: 25, balance: 0 },
            { id: "6", name: "UltraNoob1", category: "Ultra Noob", kdRatio: 0.3, winRate: 0.01, avgPlacement: 16.0, matchesPlayed: 10, balance: 0 },
            { id: "7", name: "UltraNoob2", category: "Ultra Noob", kdRatio: 0.2, winRate: 0.005, avgPlacement: 18.0, matchesPlayed: 5, balance: 0 },
            { id: "8", name: "UltraNoob3", category: "Ultra Noob", kdRatio: 0.1, winRate: 0.0, avgPlacement: 20.0, matchesPlayed: 3, balance: 0 },
        ]
    }
};

// Helper functions to convert mock data
export function convertMockPlayersToStats(players: MockPlayerWithStats[]) {
    const result: { [playerId: string]: { kdRatio: number; winRate: number; matchesPlayed: number } } = {};

    players.forEach(player => {
        result[player.id] = {
            kdRatio: player.kdRatio,
            winRate: player.winRate,
            matchesPlayed: player.matchesPlayed
        };
    });

    return result;
}

export function convertMockPlayersToPlayers(players: MockPlayerWithStats[]): Player[] {
    return players.map(player => ({
        id: player.id,
        name: player.name,
        category: player.category,
        phoneNumber: null,
        balance: player.balance || 0
    }));
}