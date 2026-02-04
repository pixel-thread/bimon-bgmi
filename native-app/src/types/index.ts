export interface User {
    id: string;
    clerkUserId: string;
    displayName: string;
    email?: string;
    imageUrl?: string;
    characterImageUrl?: string;
    ucBalance: number;
    royalPass: boolean;
    royalPassExpiresAt?: string;
    bgmiId?: string;
    role: 'PLAYER' | 'ADMIN' | 'SUPER_ADMIN';
    createdAt: string;
}

export interface Tournament {
    id: string;
    title: string;
    description?: string;
    date: string;
    entryFee: number;
    prizePool: number;
    maxPlayers: number;
    currentPlayers: number;
    status: 'upcoming' | 'active' | 'completed';
    imageUrl?: string;
}

export interface Game {
    id: string;
    name: string;
    description: string;
    icon: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    playTime: string;
    gameUrl: string;
    available: boolean;
}

export interface GameSession {
    gameId: string;
    score: number;
    duration: number;
    watchedAd: boolean;
    ucEarned: number;
}

export type RootStackParamList = {
    Home: undefined;
    Games: undefined;
    GamePlayer: { gameId: string; gameUrl: string };
    Profile: undefined;
    Login: undefined;
    Tournaments: undefined;
};
