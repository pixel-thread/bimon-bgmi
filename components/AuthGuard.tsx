"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

import { LoaderFour } from "@/components/ui/loader"; // Importing LoaderFour

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requirePlayer?: boolean;
  redirectTo?: string;
}

export const AuthGuard = ({
  children,
  requireAuth = true,
  requirePlayer = false,
  redirectTo = "/login",
}: AuthGuardProps) => {
  const { loading, isAuthorized, isPlayer, authType, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while still loading
    if (loading) return;

    // Check if authentication is required
    if (requireAuth) {
      // Check if user is authenticated (either player or Firebase admin)
      const isFirebaseAdmin =
        authType === "firebase" &&
        (role === "teams_admin" || role === "super_admin");
      const isPlayerUser = authType === "player" && isPlayer;
      const isAuthenticated =
        isAuthorized || isPlayer || isFirebaseAdmin || isPlayerUser;

      // If requiring player auth specifically
      if (requirePlayer && !isPlayer && !isFirebaseAdmin) {
        const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
        router.push(redirectUrl);
        return;
      }

      // If requiring any auth and user is not authenticated
      if (!isAuthenticated) {
        const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
        router.push(redirectUrl);
        return;
      }
    }
  }, [
    loading,
    isAuthorized,
    isPlayer,
    authType,
    role,
    requireAuth,
    requirePlayer,
    router,
    redirectTo,
  ]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <LoaderFour text="PUBGMI TOURNAMENT" />
      </div>
    );
  }

  // Show unauthorized state if auth is required but user is not authenticated
  if (requireAuth) {
    const isFirebaseAdmin =
      authType === "firebase" &&
      (role === "teams_admin" || role === "super_admin");
    const isPlayerUser = authType === "player" && isPlayer;
    const isAuthenticated =
      isAuthorized || isPlayer || isFirebaseAdmin || isPlayerUser;

    if (requirePlayer && !isPlayer && !isFirebaseAdmin) {
      // Just show loading while redirecting to avoid flash of unauthorized content
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoaderFour text="PUBGMI TOURNAMENT" />
        </div>
      );
    }

    if (!isAuthenticated) {
      // Just show loading while redirecting to avoid flash of unauthorized content
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoaderFour text="PUBGMI TOURNAMENT" />
        </div>
      );
    }
  }

  // User is authenticated or auth is not required, render children
  return <>{children}</>;
};

// Convenience component for tournament page authentication
// Allows both players and Firebase admin users
export const PlayerAuthGuard = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <AuthGuard requireAuth={true} requirePlayer={false} redirectTo="/login">
      {children}
    </AuthGuard>
  );
};
