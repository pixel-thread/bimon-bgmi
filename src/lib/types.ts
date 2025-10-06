// lib/types.ts
export interface PermissionRequest {
  id: string;
  phoneNumber: string;
  teamName: string;
  players: { ign: string; kills: number }[];
  submittedAt: string;
}

export interface UserData {
  id: string;
  phoneNumber: string;
  password: string;
  expiresAt: string;
  approvedAt: string;
  teamName: string;
}

export interface TournamentConfig {
  id: string;
  title: string;
  startDate: string;
  whatsappLink: string;
  notificationTime: string;
  backgroundImage?: string;
  entryFee?: number; // Entry fee for the tournament
  createdAt?: string; // ISO date string for when the tournament was created
  seasonId?: string; // Link tournament to a season
}

export interface MatchScore {
  kills: number;
  placementPoints: number;
  playerKills: number[]; // Individual player kills
  playerKD: number[]; // Calculated K/D ratio for each player (kills/matches_played)
  playerParticipation?: boolean[]; // Track which players participated in the match
}

export interface CombinedTeamData {
  id: string;
  phoneNumber: string;
  teamName: string;
  players: { ign: string; kills: number }[];
  tournamentId: string;
  teamMode: "Squad 4+1" | "Trio 3+1" | "Duo 2+1" | "Solo 1" | string;
  matchScores?: { [matchNumber: string]: MatchScore };
  status: string;
  approvedAt: string;
  submittedAt: string;
  seasonId?: string; // Link tournament entry to a season
  duoPlayers?: [Player, Player]; // Add for Duo format to store the Noob and Pro players
}

// New types for the player pool and tournament system
export interface Player {
  id: string;
  name: string;
  phoneNumber: string | null;
  category: "Noob" | "Pro" | "Ultra Noob" | "Ultra Pro";
  balance?: number; // Player's current balance
  // Profile picture
  avatarUrl?: string; // URL to uploaded profile picture in Firebase Storage (deprecated - use avatarBase64)
  avatarBase64?: string; // Base64 encoded profile picture for Firestore storage
  // Character image (full-body standing character)
  characterAvatarBase64?: string; // Base64 encoded character image for Firestore storage
  // Authentication fields for voting system
  loginPassword?: string;
  isLoginEnabled?: boolean;
  lastLoginAt?: string;
  // Name change timeout functionality
  lastNameChangeAt?: string; // ISO date string for when name was last changed
  // Ban functionality
  isBanned?: boolean;
  banReason?: string;
  banDuration?: number; // Number of tournaments
  bannedAt?: string; // ISO date string
  bannedBy?: string; // Admin who banned the player
  // Soft delete functionality
  deleted?: boolean;
  // Game statistics
  gameStats?: {
    [gameId: string]: {
      gameOverCount: number;
      lastPlayed: string; // ISO date string
      highScore: number;
    }
  };
  // Admin role linking for players
  linkedRole?: "teams_admin" | null; // Role linked to this player (e.g., "teams_admin")
  linkedEmail?: string; // Email of the linked admin account
  // Social authentication fields
  socialProviders?: {
    [providerId: string]: {
      provider: string; // e.g., 'google.com', 'facebook.com', 'apple.com', 'playgames.google.com'
      email?: string;
      displayName?: string;
      photoURL?: string;
      linkedAt: string; // ISO date string
      uid?: string; // Firebase Auth UID if different from player ID
    }
  };
  socialLoginEnabled?: boolean; // Whether social login is enabled for this player
}

export interface PlayerTransaction {
  id: string;
  playerId: string;
  amount: number;
  type: "deduct" | "add";
  reason: string;
  createdAt: string;
  matchId?: string;
  tournamentId?: string;
}

export interface Tournament {
  id: string;
  name: string;
  format: "Solo" | "Duo" | "Squad";
  selectedNoobs?: Player[];
  selectedPros?: Player[];
  teams: CombinedTeamData[];
}

export const calculatePlacementPoints = (position: number): number => {
  if (position === 1) return 10;
  if (position === 2) return 6;
  if (position === 3) return 5;
  if (position === 4) return 4;
  if (position === 5) return 3;
  if (position === 6) return 2;
  if (position === 7 || position === 8) return 1;
  if (position >= 9 && position <= 16) return 0;
  return 0; // Anything beyond 16th also gets 0
};

export interface TournamentResult {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  date: string;
  firstPlace: string[]; // Array of player IDs (can be solo or multiple players)
  secondPlace: string[]; // Array of player IDs (can be solo or multiple players)
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  description?: string;
}

export interface SeasonStats {
  id: string;
  playerId: string;
  seasonId: string;
  matchesPlayed: number;
  totalKills: number;
  firstPlaces: number;
  secondPlaces: number;
  overallKD: number;
  winRate: number;
  skillScore: number;
}

export interface RevealWinner {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  winnerName: string;
  winnerTeam: string;
  revealDate: string;
  seasonId?: string;
  prize?: string;
  notes?: string;
}

// Voting system types
export interface PollOption {
  text: string;
  action: "in" | "out" | "solo" | "none";
}

export interface Poll {
  id: string;
  question: string;
  type:
    | "yes_no"
    | "yes_no_maybe"
    | "multiple_choice"
    | "tournament_participation";
  options: string[] | PollOption[]; // For multiple choice questions
  isActive: boolean;
  createdAt: string;
  createdBy: string; // Admin user ID
  expiresAt?: string;
  tournamentId?: string; // Link poll to specific tournament
  period?: string; // e.g., "Mon–Tue", "Wed–Thu", "Fri–Sat"
  date?: string; // ISO date string if single date is selected
}

export interface PollVote {
  id: string;
  pollId: string;
  playerId: string;
  playerName: string;
  vote: string;
  votedAt: string;
  avatarUrl?: string; // Player's avatar URL for display in voting interfaces (deprecated - use avatarBase64)
  avatarBase64?: string; // Player's avatar as Base64 string for display in voting interfaces
}

// Player user type for authentication
export interface PlayerUser {
  id: string;
  name: string;
  hasVoted: boolean;
  loginPassword: string;
  avatarUrl?: string; // Player's avatar URL (deprecated - use avatarBase64)
  avatarBase64?: string; // Player's avatar as Base64 string
  characterAvatarBase64?: string; // Player's character image as Base64 string
  // Ban status fields
  isBanned?: boolean;
  banReason?: string;
  banDuration?: number;
  bannedAt?: string;
  bannedBy?: string;
  // Role linking for teams_admin
  linkedRole?: "teams_admin" | null;
  linkedEmail?: string; // Email of the linked admin account
}

// Enhanced authentication state extending current AuthState
export interface EnhancedAuthState {
  // Existing Firebase user fields
  user: any | null; // Firebase User type
  loading: boolean;
  isAuthorized: boolean;
  role: "super_admin" | "teams_admin" | "none"; // UserRole type
  username: string;
  displayName: string;

  // New player authentication fields
  playerUser: PlayerUser | null;
  authType: "firebase" | "player" | null;
  isPlayer: boolean;
}

// Firebase session data interface
export interface FirebaseSessionData {
  user: any;
  isAuthorized: boolean;
  role: "super_admin" | "teams_admin" | "none";
  username: string;
  displayName: string;
  sessionToken: string;
  timestamp: number;
}
