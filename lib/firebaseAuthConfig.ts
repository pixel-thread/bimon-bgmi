// lib/firebaseAuthConfig.ts
import { auth } from "./firebase";
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  OAuthProvider,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
} from "firebase/auth";

// Configure auth persistence based on environment
export const configureAuthPersistence = async () => {
  try {
    // Use local persistence for better user experience
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.warn("Failed to set auth persistence, using default:", error);
  }
};

// Configure OAuth providers with custom parameters
export const configureAuthProviders = () => {
  // Google Provider
  const googleProvider = new GoogleAuthProvider();
  googleProvider.addScope("email");
  googleProvider.addScope("profile");
  googleProvider.setCustomParameters({
    prompt: "select_account", // Force account selection
  });

  // Facebook Provider
  const facebookProvider = new FacebookAuthProvider();
  facebookProvider.addScope("email");
  facebookProvider.addScope("public_profile");
  facebookProvider.setCustomParameters({
    display: "popup",
    auth_type: "rerequest", // Re-request permissions if denied
  });

  // Apple Provider (for iOS/macOS users)
  const appleProvider = new OAuthProvider("apple.com");
  appleProvider.addScope("email");
  appleProvider.addScope("name");
  appleProvider.setCustomParameters({
    // Apple specific parameters
  });

  // Twitter Provider
  const twitterProvider = new TwitterAuthProvider();

  return {
    google: googleProvider,
    facebook: facebookProvider,
    apple: appleProvider,
    twitter: twitterProvider,
  };
};

// Configure auth settings for better popup handling
export const configureAuthSettings = () => {
  if (typeof window !== "undefined") {
    // Enable popup redirect for mobile devices
    auth.settings.appVerificationDisabledForTesting = false;

    // Configure popup settings
    if ("popup" in auth.settings) {
      (auth.settings as any).popup = true;
    }
  }
};

// Initialize auth configuration
export const initializeAuthConfig = async () => {
  await configureAuthPersistence();
  configureAuthSettings();
  return configureAuthProviders();
};

// Export configured providers
export const authProviders = configureAuthProviders();

// Social provider configurations for UI
export const socialProviderConfigs = [
  {
    id: "google.com",
    name: "Google",
    icon: "google",
    color: "bg-blue-500 hover:bg-blue-600",
    enabled: true,
  },
  {
    id: "facebook.com",
    name: "Facebook",
    icon: "facebook",
    color: "bg-blue-600 hover:bg-blue-700",
    enabled: true,
  },
  {
    id: "apple.com",
    name: "Apple",
    icon: "apple",
    color:
      "bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-800",
    enabled: true,
  },
  {
    id: "playgames.google.com",
    name: "Play Games",
    icon: "gamepad",
    color: "bg-green-600 hover:bg-green-700",
    enabled: true,
  },
  {
    id: "gamecenter.apple.com",
    name: "Game Center",
    icon: "gamepad",
    color: "bg-purple-600 hover:bg-purple-700",
    enabled: true,
  },
];

// Helper function to get provider by ID
export const getAuthProvider = (providerId: string) => {
  switch (providerId) {
    case "google.com":
      return authProviders.google;
    case "facebook.com":
      return authProviders.facebook;
    case "apple.com":
      return authProviders.apple;
    case "twitter.com":
      return authProviders.twitter;
    default:
      return null;
  }
};

// Helper function to get provider name
export const getProviderName = (providerId: string): string => {
  switch (providerId) {
    case "google.com":
      return "Google";
    case "facebook.com":
      return "Facebook";
    case "apple.com":
      return "Apple";
    case "playgames.google.com":
      return "Play Games";
    case "gamecenter.apple.com":
      return "Game Center";
    case "twitter.com":
      return "Twitter";
    case "password":
      return "Email/Password";
    default:
      return providerId.replace(".com", "").replace(/_/g, " ");
  }
};

// Error message mapping for better user experience
export const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    "auth/popup-blocked":
      "Popup was blocked. Please allow popups and try again.",
    "auth/popup-closed-by-user": "Sign-in was cancelled. Please try again.",
    "auth/account-exists-with-different-credential":
      "An account with this email already exists. Please sign in with that account first.",
    "auth/credential-already-in-use":
      "This credential is already associated with a different user account.",
    "auth/user-disabled":
      "This account has been disabled. Please contact support.",
    "auth/operation-not-allowed":
      "This sign-in method is not enabled. Please contact support.",
    "auth/invalid-credential": "Invalid credentials. Please try again.",
    "auth/wrong-password": "Invalid password. Please try again.",
    "auth/user-not-found":
      "No account found with this email. Please sign up first.",
    "auth/too-many-requests":
      "Too many failed attempts. Please try again later.",
    "auth/network-request-failed":
      "Network error. Please check your connection and try again.",
    "auth/internal-error": "An internal error occurred. Please try again.",
    "auth/invalid-api-key": "Invalid API key. Please contact support.",
    "auth/app-deleted": "This app has been deleted. Please contact support.",
    "auth/expired-action-code":
      "This action code has expired. Please request a new one.",
    "auth/invalid-action-code":
      "Invalid action code. Please request a new one.",
    "auth/invalid-email": "Invalid email address. Please check and try again.",
    "auth/user-cancelled": "Sign-in was cancelled. Please try again.",
    "auth/operation-not-supported-in-this-environment":
      "This operation is not supported in this environment.",
    "auth/provider-already-linked":
      "This provider is already linked to your account.",
    "auth/no-such-provider": "No such provider found.",
    "auth/requires-recent-login":
      "This operation requires recent authentication. Please sign in again.",
  };

  return (
    errorMessages[errorCode] ||
    "An error occurred during authentication. Please try again."
  );
};