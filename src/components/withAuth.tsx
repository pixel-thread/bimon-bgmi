// components/withAuth.tsx
"use client";

import React from "react";
import ProtectedRoute from "@/src/components/ProtectedRoute";

interface WithAuthOptions {
  requiredAccess: "full" | "teams-only" | "player-only" | "any-authenticated";
  redirectTo?: string;
  fallbackComponent?: React.ReactNode;
}

/**
 * Higher-order component that wraps a component with authentication protection
 *
 * @param Component - The component to protect
 * @param options - Authentication options
 * @returns Protected component
 *
 * @example
 * ```tsx
 * const ProtectedAdminPage = withAuth(AdminPage, {
 *   requiredAccess: "full",
 *   redirectTo: "/login"
 * });
 * ```
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions
) {
  const WrappedComponent = (props: P) => {
    return (
      <ProtectedRoute
        requiredAccess={options.requiredAccess}
        redirectTo={options.redirectTo}
        fallbackComponent={options.fallbackComponent}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  // Set display name for debugging
  WrappedComponent.displayName = `withAuth(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

// Convenience HOCs for common patterns
export const withAdminAuth = <P extends object>(
  Component: React.ComponentType<P>,
  redirectTo?: string
) =>
  withAuth(Component, {
    requiredAccess: "full",
    redirectTo: redirectTo || "/login",
  });

export const withTeamsAuth = <P extends object>(
  Component: React.ComponentType<P>,
  redirectTo?: string
) =>
  withAuth(Component, {
    requiredAccess: "teams-only",
    redirectTo: redirectTo || "/login",
  });

export const withPlayerAuth = <P extends object>(
  Component: React.ComponentType<P>,
  redirectTo?: string
) =>
  withAuth(Component, {
    requiredAccess: "player-only",
    redirectTo: redirectTo || "/login",
  });

export const withAnyAuth = <P extends object>(
  Component: React.ComponentType<P>,
  redirectTo?: string
) =>
  withAuth(Component, {
    requiredAccess: "any-authenticated",
    redirectTo: redirectTo || "/login",
  });
