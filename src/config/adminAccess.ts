// config/adminAccess.ts

export type UserRole = "super_admin" | "teams_admin" | "none";

export interface AdminUser {
  email: string;
  role: UserRole;
  addedBy?: string;
  addedAt?: string;
  username?: string; // extracted from email
  // Role linking for teams_admin
  linkedPlayerId?: string; // Player ID this admin role is linked to
  linkedPlayerName?: string; // Player name for display
}

// Super Admin - hardcoded for security
export const SUPER_ADMIN_EMAIL = "bimonlangnongsiej@gmail.com";

// Helper function to extract username from email
export const extractUsername = (email: string): string => {
  return email.split("@")[0];
};

// Helper function to format user display name
export const formatUserDisplay = (email: string): string => {
  const username = extractUsername(email);
  return `${email} (${username})`;
};

// Helper function to check if user is super admin
export const isSuperAdmin = (email: string): boolean => {
  return email === SUPER_ADMIN_EMAIL;
};

// Helper function to determine user role (will be enhanced with database lookup)
export const getUserRole = async (email: string): Promise<UserRole> => {
  if (isSuperAdmin(email)) {
    return "super_admin";
  }

  // This will be replaced with database lookup
  // For now, return none - the database lookup will be implemented in useAuth
  return "none";
};

// Helper function to check access levels
export const canAccessFullAdmin = (role: UserRole): boolean => {
  return role === "super_admin";
};

export const canAccessTeamsAdmin = (role: UserRole): boolean => {
  return role === "super_admin" || role === "teams_admin";
};

export const canAccessTournament = (role: UserRole): boolean => {
  return true; // Tournament is public, but we can restrict this if needed
};
