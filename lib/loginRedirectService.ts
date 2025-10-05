// lib/loginRedirectService.ts
import { EnhancedAuthState } from "@/lib/types";
import { getPlayerByLinkedEmail } from "@/lib/adminService";

export class LoginRedirectService {
  /**
   * Determines the appropriate redirect path after login based on user role and type
   * Ensures linked accounts (player ↔ teams_admin) always redirect to the same route
   */
  static async getRedirectPath(authState: EnhancedAuthState): Promise<string> {
    const { authType, role, playerUser, username } = authState;

    console.log("🚀 LoginRedirectService - Determining redirect path:", {
      authType,
      role,
      hasPlayerUser: !!playerUser,
      playerLinkedRole: playerUser?.linkedRole,
      username,
    });

    // Firebase admin users
    if (authType === "firebase") {
      if (role === "super_admin") {
        console.log("🔑 LoginRedirectService - Super admin → /admin");
        return "/admin";
      }
      if (role === "teams_admin") {
        // Check if this teams_admin has a linked player
        const linkedPlayer = await getPlayerByLinkedEmail(
          `${username}@gmail.com`
        );

        if (linkedPlayer) {
          // Teams admin with linked player → /tournament
          console.log(
            "👥 LoginRedirectService - Teams admin (with linked player) → /tournament"
          );
          return "/tournament";
        } else {
          // Teams admin without linked player → /admin
          console.log(
            "👥 LoginRedirectService - Teams admin (no linked player) → /admin"
          );
          return "/admin";
        }
      }
    }

    // Player users (both regular and linked teams_admin)
    if (authType === "player" && playerUser) {
      // All players go to tournament, regardless of linkedRole
      // This ensures consistent experience:
      // - Regular player → /tournament
      // - Player with linkedRole: "teams_admin" → /tournament
      console.log("🎮 LoginRedirectService - Player → /tournament");
      return "/tournament";
    }

    // Default fallback for any authenticated user
    console.log("🔄 LoginRedirectService - Default fallback → /tournament");
    return "/tournament";
  }

  /**
   * Checks if the current user has access to a specific admin route
   */
  static hasAccessToRoute(
    authState: EnhancedAuthState,
    route: string
  ): boolean {
    const { authType, role, playerUser } = authState;

    switch (route) {
      case "/admin":
        // Full admin access - only Firebase super_admin and teams_admin
        return (
          authType === "firebase" &&
          (role === "super_admin" || role === "teams_admin")
        );

      case "/tournament":
        // Tournament access - any authenticated player
        return authType === "player" && !!playerUser;

      default:
        return false;
    }
  }

  /**
   * Checks if the current user represents a linked account
   * (either a player with linkedRole or a Firebase admin with linked player)
   */
  static async isLinkedAccount(authState: EnhancedAuthState): Promise<boolean> {
    const { authType, role, playerUser, username } = authState;

    // Player with linked admin role
    if (authType === "player" && playerUser?.linkedRole === "teams_admin") {
      return true;
    }

    // Firebase teams_admin - check if they have a linked player
    if (authType === "firebase" && role === "teams_admin") {
      const linkedPlayer = await getPlayerByLinkedEmail(
        `${username}@gmail.com`
      );
      return !!linkedPlayer;
    }

    return false;
  }

  /**
   * Gets user display info for admin interfaces
   */
  static async getUserDisplayInfo(authState: EnhancedAuthState): Promise<{
    displayName: string;
    userType: string;
    hasLinkedRole: boolean;
    isLinkedAccount: boolean;
  }> {
    const { authType, role, playerUser, username } = authState;

    if (authType === "firebase") {
      const isLinked = await this.isLinkedAccount({
        authType,
        role,
        playerUser,
        username,
      } as EnhancedAuthState);

      return {
        displayName: username,
        userType: role === "super_admin" ? "Super Admin" : "Teams Admin",
        hasLinkedRole: false,
        isLinkedAccount: isLinked,
      };
    }

    if (authType === "player" && playerUser) {
      const isLinked = await this.isLinkedAccount({
        authType,
        role,
        playerUser,
        username,
      } as EnhancedAuthState);

      return {
        displayName: playerUser.name,
        userType:
          playerUser.linkedRole === "teams_admin" ? "Player Admin" : "Player",
        hasLinkedRole: !!playerUser.linkedRole,
        isLinkedAccount: isLinked,
      };
    }

    return {
      displayName: "Unknown",
      userType: "Unknown",
      hasLinkedRole: false,
      isLinkedAccount: false,
    };
  }
}
