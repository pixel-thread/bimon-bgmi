"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { routeRoles } from "@/src/lib/route/role";
import { LoaderFour } from "@/src/components/ui/loader";

type PropsT = {
  children: React.ReactNode;
};

const pageAccessOnlyIfUnAuthenticated: string[] = ["/auth", "/auth/sign-up"];

export const RoleBaseRoute = ({ children }: PropsT) => {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const router = useRouter();
  const pathName = usePathname();
  const { user, isAuthLoading, isSignedIn } = useAuth();
  const role = user?.role || "USER";
  const userRoles = useMemo(() => role, [role]); // Get the user's roles
  const isAuthenticated = isSignedIn;

  // Check if current route requires authentication and role check
  const currentRoute = routeRoles.find((route) => {
    if (route.url === pathName) return true;
    if (route.url.endsWith("/*")) {
      const basePath = route.url.replace("/*", "");
      return pathName.startsWith(basePath);
    }
    return false;
  });

  // Show loader while auth is loading for protected routes
  const needsAuthCheck = currentRoute?.needAuth || currentRoute?.role;

  // Handle authentication and role-based redirects
  useEffect(() => {
    // Wait until authentication loading is complete to proceed
    if (isAuthLoading) return;

    // If user is authenticated but user data hasn't loaded yet, wait
    if (isAuthenticated && !user) return;

    // Defensive: if authenticated and user exists but role is undefined, wait for proper data
    if (isAuthenticated && user && !user.role) return;

    // Handle authentication-based redirection
    if (currentRoute) {
      // If the route requires authentication and the user is not authenticated
      if (currentRoute.needAuth && !isAuthenticated) {
        // Redirect the user to the signin page and include the current path as a `redirect` query parameter
        router.push(`/auth?redirect=${encodeURIComponent(pathName)}`);
        return; // Exit the logic as redirection is in progress
      }

      // Handle role-based access control
      if (isAuthenticated && user) {
        // Check if the user has at least one of the required roles for the current route
        const hasRequiredRole = currentRoute.role.some(
          (role) => role === userRoles,
        );

        // If the user does not have the required role(s)
        if (!hasRequiredRole) {
          // Redirect the user to a fallback page specified in the route's configuration or to the homepage
          router.replace(`/forbidden?redirect=${encodeURIComponent(pathName)}`);
          return; // Exit the logic as redirection is in progress
        }
      }
    }
  }, [isAuthenticated, userRoles, pathName, isAuthLoading, user, router, currentRoute]);

  // Prevent authenticated users from accessing unauthenticated-only pages
  useEffect(() => {
    if (isAuthenticated && pageAccessOnlyIfUnAuthenticated.includes(pathName)) {
      router.push(redirectTo || "/");
    }
  }, [isAuthenticated, pathName, redirectTo, router, isAuthLoading]);

  // Display loader while auth is loading for protected routes
  if (needsAuthCheck && isAuthLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-zinc-950">
        <LoaderFour text="PUBGMI" />
      </div>
    );
  }

  return <>{children}</>;
};
