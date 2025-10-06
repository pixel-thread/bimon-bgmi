// components/ProtectedRoute.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import {
  canAccessFullAdmin,
  canAccessTeamsAdmin,
} from "@/src/config/adminAccess";
import { LoaderFour } from "@/src/components/ui/loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredAccess: "full" | "teams-only" | "player-only" | "any-authenticated";
  redirectTo?: string;
  fallbackComponent?: React.ReactNode;
}

interface LoadingStateProps {
  message: string;
}

const LoadingState = (_: LoadingStateProps) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <LoaderFour text="PUBGMI TOURNAMENT" />
  </div>
);

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: {
    children: React.ReactNode;
    onError?: (error: Error) => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Authentication error:", error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 mb-4">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-foreground">
              Authentication Error
            </h1>
            <p className="text-muted-foreground mb-6">
              Something went wrong with authentication. Please try refreshing
              the page or logging in again.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => (window.location.href = "/login")}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ProtectedRoute({
  children,
  requiredAccess,
  redirectTo = "/",
  fallbackComponent,
}: ProtectedRouteProps) {
  const { user, loading, isAuthorized, role, playerUser, authType, isPlayer } =
    useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleAuthError = (error: Error) => {
    console.error("Protected route authentication error:", error);
  };

  // Simplified auth check - middleware handles most redirects
  useEffect(() => {
    if (!loading && !isRedirecting) {
      const isAuthenticated = isAuthorized || (playerUser && isPlayer);

      // Only handle edge cases that middleware might miss
      if (!isAuthenticated) {
        setIsRedirecting(true);
        const currentPath = window.location.pathname;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      // Quick role validation for edge cases
      const hasRequiredAccess = (() => {
        switch (requiredAccess) {
          case "full":
            return authType === "firebase" && canAccessFullAdmin(role);
          case "teams-only":
            return authType === "firebase" && canAccessTeamsAdmin(role);
          case "player-only":
            return authType === "player" && playerUser;
          case "any-authenticated":
            return true;
          default:
            return false;
        }
      })();

      if (!hasRequiredAccess) {
        setIsRedirecting(true);
        router.push(redirectTo);
      }
    }
  }, [
    loading,
    isAuthorized,
    role,
    playerUser,
    authType,
    isPlayer,
    router,
    redirectTo,
    requiredAccess,
    isRedirecting,
  ]);

  // Unified loading state
  if (loading || isRedirecting) {
    return <LoadingState message="PUBGMI TOURNAMENT" />;
  }

  // Final auth check
  const isAuthenticated = isAuthorized || (playerUser && isPlayer);
  if (!isAuthenticated) {
    return <LoadingState message="PUBGMI TOURNAMENT" />;
  }

  // Simplified access denied - middleware should prevent most cases
  if (requiredAccess === "full" && authType === "firebase" && role === "none") {
    return (
      fallbackComponent || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-yellow-500 mb-4">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 0h12a2 2 0 002-2v-9a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-foreground">
              Access Restricted
            </h1>
            <p className="text-muted-foreground mb-6">
              Your account ({user?.email}) doesn't have admin access.
            </p>
            <button
              onClick={() => router.push(redirectTo)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    );
  }

  // User has the required access, show the protected content with error boundary
  return (
    <AuthErrorBoundary onError={handleAuthError}>{children}</AuthErrorBoundary>
  );
}
