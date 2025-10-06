// hooks/useConditionalRender.ts
"use client";

import { useAuth } from "@/src/hooks/useAuth";
import {
  canAccessFullAdmin,
  canAccessTeamsAdmin,
} from "@/src/config/adminAccess";

export interface ConditionalRenderOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireFullAdmin?: boolean;
  requireTeamsAdmin?: boolean;
  requirePlayer?: boolean;
  requireFirebaseAuth?: boolean;
  allowedRoles?: Array<"super_admin" | "teams_admin" | "none">;
  allowedAuthTypes?: Array<"firebase" | "player">;
}

export const useConditionalRender = () => {
  const { user, loading, isAuthorized, role, playerUser, authType, isPlayer } =
    useAuth();

  const shouldRender = (options: ConditionalRenderOptions = {}): boolean => {
    // If still loading, don't render
    if (loading) {
      return false;
    }

    const {
      requireAuth = false,
      requireAdmin = false,
      requireFullAdmin = false,
      requireTeamsAdmin = false,
      requirePlayer = false,
      requireFirebaseAuth = false,
      allowedRoles,
      allowedAuthTypes,
    } = options;

    // Check if any authentication is required
    if (requireAuth) {
      const isAuthenticated = isAuthorized || (playerUser && isPlayer);
      if (!isAuthenticated) {
        return false;
      }
    }

    // Check for admin access (any level)
    if (requireAdmin) {
      if (authType !== "firebase" || !isAuthorized) {
        return false;
      }
    }

    // Check for full admin access
    if (requireFullAdmin) {
      if (authType !== "firebase" || !canAccessFullAdmin(role)) {
        return false;
      }
    }

    // Check for teams admin access
    if (requireTeamsAdmin) {
      if (authType !== "firebase" || !canAccessTeamsAdmin(role)) {
        return false;
      }
    }

    // Check for player access
    if (requirePlayer) {
      if (authType !== "player" || !playerUser) {
        return false;
      }
    }

    // Check for Firebase authentication specifically
    if (requireFirebaseAuth) {
      if (authType !== "firebase" || !user) {
        return false;
      }
    }

    // Check allowed roles
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(role)) {
        return false;
      }
    }

    // Check allowed auth types
    if (allowedAuthTypes && allowedAuthTypes.length > 0) {
      if (!authType || !allowedAuthTypes.includes(authType)) {
        return false;
      }
    }

    return true;
  };

  const renderIf = (
    condition: ConditionalRenderOptions,
    component: React.ReactNode,
    fallback?: React.ReactNode
  ): React.ReactNode => {
    return shouldRender(condition) ? component : fallback || null;
  };

  const getAuthInfo = () => ({
    isAuthenticated: isAuthorized || (playerUser && isPlayer),
    isAdmin: authType === "firebase" && isAuthorized,
    isFullAdmin: authType === "firebase" && canAccessFullAdmin(role),
    isTeamsAdmin: authType === "firebase" && canAccessTeamsAdmin(role),
    isPlayer: authType === "player" && !!playerUser,
    authType,
    role,
    user,
    playerUser,
    loading,
  });

  return {
    shouldRender,
    renderIf,
    getAuthInfo,
    loading,
  };
};

// Convenience components for common conditional rendering patterns
export const AdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireFullAdmin?: boolean;
}> = ({ children, fallback, requireFullAdmin = false }) => {
  const { renderIf } = useConditionalRender();

  return renderIf(
    requireFullAdmin ? { requireFullAdmin: true } : { requireAdmin: true },
    children,
    fallback
  ) as React.ReactElement;
};

export const PlayerOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { renderIf } = useConditionalRender();

  return renderIf(
    { requirePlayer: true },
    children,
    fallback
  ) as React.ReactElement;
};

export const AuthenticatedOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { renderIf } = useConditionalRender();

  return renderIf(
    { requireAuth: true },
    children,
    fallback
  ) as React.ReactElement;
};

export const RoleBasedRender: React.FC<{
  children: React.ReactNode;
  allowedRoles: Array<"super_admin" | "teams_admin" | "none">;
  allowedAuthTypes?: Array<"firebase" | "player">;
  fallback?: React.ReactNode;
}> = ({ children, allowedRoles, allowedAuthTypes, fallback }) => {
  const { renderIf } = useConditionalRender();

  return renderIf(
    { allowedRoles, allowedAuthTypes },
    children,
    fallback
  ) as React.ReactElement;
};
