import { auth, db } from "@/src/lib/firebase";
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  linkWithPopup,
  unlink,
  fetchSignInMethodsForEmail,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

export interface SocialProvider {
  id: string;
  name: string;
  provider:
    | GoogleAuthProvider
    | FacebookAuthProvider
    | GithubAuthProvider
    | TwitterAuthProvider;
}

export const socialProviders: SocialProvider[] = [
  {
    id: "google",
    name: "Google",
    provider: new GoogleAuthProvider(),
  },
  {
    id: "facebook",
    name: "Facebook",
    provider: new FacebookAuthProvider(),
  },
  {
    id: "github",
    name: "GitHub",
    provider: new GithubAuthProvider(),
  },
  {
    id: "twitter",
    name: "Twitter",
    provider: new TwitterAuthProvider(),
  },
];

export interface LinkedAccount {
  provider: string;
  email?: string;
  linkedAt: string;
}

export interface SocialAuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class SocialAuthService {
  /**
   * Link a social account to the current user
   */
  static async linkSocialAccount(
    user: User,
    provider: SocialProvider,
    userRole?: string
  ): Promise<SocialAuthResponse> {
    try {
      // Check if already linked
      const providerId = provider.provider.providerId;
      if (user.providerData.some((p) => p.providerId === providerId)) {
        return {
          success: false,
          message: `${provider.name} account is already linked`,
        };
      }

      // Link the account
      const result = await linkWithPopup(user, provider.provider);
      const linkedUser = result.user;

      // Update user profile if needed
      if (!user.displayName && linkedUser.displayName) {
        await updateProfile(user, {
          displayName: linkedUser.displayName,
        });
      }

      // For admins, update authorized_emails if needed
      if (
        userRole &&
        ["admin", "super_admin"].includes(userRole) &&
        linkedUser.email
      ) {
        await this.updateAdminAuthorization(
          linkedUser.email,
          userRole,
          provider.id
        );
      }

      // For players, update their profile
      if (!userRole || !["admin", "super_admin"].includes(userRole)) {
        await this.updatePlayerSocialLinking(user.uid, providerId);
      }

      return {
        success: true,
        message: `${provider.name} account linked successfully!`,
        data: { linkedUser },
      };
    } catch (error: any) {
      console.error(`Error linking ${provider.name} account:`, error);

      if (error.code === "auth/provider-already-linked") {
        return {
          success: false,
          message: `${provider.name} account is already linked`,
        };
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        return {
          success: false,
          message:
            "An account with this email already exists. Please sign in with that account first.",
        };
      } else if (error.code === "auth/popup-blocked") {
        return {
          success: false,
          message: "Popup was blocked. Please allow popups and try again.",
        };
      }

      return {
        success: false,
        message: `Failed to link ${provider.name} account: ${error.message}`,
      };
    }
  }

  /**
   * Unlink a social account from the current user
   */
  static async unlinkSocialAccount(
    user: User,
    providerId: string
  ): Promise<SocialAuthResponse> {
    try {
      // Check if this is the only linked account
      const linkedCount = user.providerData.length;
      const hasPasswordProvider = user.providerData.some(
        (p) => p.providerId === "password"
      );

      if (linkedCount <= 1 && !hasPasswordProvider) {
        return {
          success: false,
          message: "Cannot unlink your only authentication method",
        };
      }

      await unlink(user, providerId);

      // Update database for players
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.linkedAccounts) {
          const updatedAccounts = { ...userData.linkedAccounts };
          delete updatedAccounts[providerId];

          await updateDoc(doc(db, "users", user.uid), {
            linkedAccounts: updatedAccounts,
            lastUpdated: new Date().toISOString(),
          });
        }
      }

      return {
        success: true,
        message: "Account unlinked successfully!",
      };
    } catch (error: any) {
      console.error("Error unlinking account:", error);
      return {
        success: false,
        message: `Failed to unlink account: ${error.message}`,
      };
    }
  }

  /**
   * Get linked accounts for a user
   */
  static async getLinkedAccounts(
    user: User
  ): Promise<Record<string, LinkedAccount>> {
    try {
      const accounts: Record<string, LinkedAccount> = {};

      // Get current sign-in methods for the email
      if (user.email) {
        const methods = await fetchSignInMethodsForEmail(auth, user.email);

        methods.forEach((method) => {
          accounts[method] = {
            provider: method,
            email: user.email || undefined,
            linkedAt: new Date().toISOString(),
          };
        });
      }

      // Get additional data from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.linkedAccounts) {
          Object.assign(accounts, userData.linkedAccounts);
        }
      }

      return accounts;
    } catch (error) {
      console.error("Error fetching linked accounts:", error);
      toast.error("Failed to fetch linked accounts");
      return {};
    }
  }

  /**
   * Update admin authorization in Firestore
   */
  private static async updateAdminAuthorization(
    email: string,
    role: string,
    provider: string
  ): Promise<void> {
    try {
      const emailDoc = doc(db, "authorized_emails", email);
      const emailSnap = await getDoc(emailDoc);

      if (!emailSnap.exists()) {
        await setDoc(emailDoc, {
          authorized: true,
          role: role,
          addedAt: new Date().toISOString(),
          provider: provider,
        });
      }
    } catch (error) {
      console.error("Error updating admin authorization:", error);
      throw error;
    }
  }

  /**
   * Update player social linking data
   */
  private static async updatePlayerSocialLinking(
    userId: string,
    providerId: string
  ): Promise<void> {
    try {
      // Try to update player document if it exists
      const playerQuery = await getDoc(doc(db, "players", userId));
      if (playerQuery.exists()) {
        const playerData = playerQuery.data();
        const linkedAccounts = playerData.linkedAccounts || {};

        await updateDoc(doc(db, "players", userId), {
          linkedAccounts: {
            ...linkedAccounts,
            [providerId]: {
              provider: providerId,
              linkedAt: new Date().toISOString(),
            },
          },
          lastUpdated: new Date().toISOString(),
        });
      }

      // Update or create user document
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const linkedAccounts = userData.linkedAccounts || {};

        await updateDoc(doc(db, "users", userId), {
          linkedAccounts: {
            ...linkedAccounts,
            [providerId]: {
              provider: providerId,
              linkedAt: new Date().toISOString(),
            },
          },
          lastUpdated: new Date().toISOString(),
        });
      } else {
        await setDoc(doc(db, "users", userId), {
          linkedAccounts: {
            [providerId]: {
              provider: providerId,
              linkedAt: new Date().toISOString(),
            },
          },
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error updating player social linking:", error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Get social provider by ID
   */
  static getProviderById(providerId: string): SocialProvider | undefined {
    return socialProviders.find((p) => p.provider.providerId === providerId);
  }

  /**
   * Get provider display name
   */
  static getProviderName(providerId: string): string {
    const provider = this.getProviderById(providerId);
    return provider?.name || providerId.replace(".com", "").replace(/_/g, " ");
  }
}
