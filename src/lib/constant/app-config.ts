/**
 * Native App Configuration
 * 
 * Update these values when your native app is published
 */
export const NATIVE_APP_CONFIG = {
    // App name displayed to users
    name: "PUBGMI Games",

    // Package name for Android (used for Play Store deep links)
    packageName: "com.pubgmi.games",

    // Direct APK download URL (for sideloading)
    // Update this to your actual APK hosting URL
    apkDownloadUrl: "https://bimon-bgmi.vercel.app/downloads/pubgmi-games.apk",

    // Google Play Store URL (once published)
    // Set to null if not yet published
    playStoreUrl: null as string | null,

    // App version
    version: "1.0.0",

    // Minimum Android version required
    minAndroidVersion: "6.0",

    // Features available in the native app
    features: [
        "Play games with rewarded ads",
        "Earn UC by watching ads",
        "Faster performance",
        "Offline mode for some games",
        "Push notifications for tournaments",
    ],

    // Size of the APK (approximate)
    appSize: "~25 MB",
} as const;

/**
 * API endpoints that the native app will consume
 * These are the same endpoints used by the web app
 */
export const NATIVE_APP_API_ENDPOINTS = {
    // Authentication
    auth: "/api/auth",

    // User profile
    profile: "/api/profile",

    // Tournament data
    tournaments: "/api/tournaments",

    // Games & rewards
    games: "/api/games",

    // UC balance & transactions
    uc: "/api/uc",
} as const;
