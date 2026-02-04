# PUBGMI Games - Native Android App

A React Native (Expo) app for PUBGMI that provides:
- 🎮 Play games with proper ad support
- 💰 Earn UC by watching rewarded ads
- 📊 Sync with your PUBGMI website account
- 🏆 View tournaments

## Quick Start

### 1. Install Dependencies

```bash
cd native-app
npm install
```

### 2. Setup AdMob (Important!)

Before building, you need to set up AdMob:

1. Go to [admob.google.com](https://admob.google.com)
2. Create a new Android app named "PUBGMI Games"
3. Create ad units:
   - Banner ad
   - Interstitial ad
   - Rewarded video ad
4. Copy your **App ID** and update `app.json`:

```json
"plugins": [
  [
    "react-native-google-mobile-ads",
    {
      "androidAppId": "ca-app-pub-XXXX~XXXX"  // Your app ID here
    }
  ]
]
```

5. Update ad unit IDs in `src/lib/config.ts` (replace the placeholder IDs)

### 3. Run in Development

```bash
# Start the Expo development server
npm start

# Or specifically for Android
npm run android
```

### 4. Build APK (Cloud Build)

First, login to EAS:
```bash
npx eas login
```

Then build:
```bash
# Build a preview APK (for testing)
npm run build:apk

# Build production AAB (for Play Store)
npm run build:aab
```

## Project Structure

```
native-app/
├── App.tsx                    # Main app entry
├── app.json                   # Expo config
├── eas.json                   # EAS Build config
├── package.json
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── AdBanner.tsx       # Banner ad component
│   │   ├── GameCard.tsx       # Game item card
│   │   └── RewardedAdButton.tsx
│   ├── hooks/                 # Custom hooks
│   │   ├── useAds.ts          # Ad hooks (interstitial, rewarded)
│   │   └── useAuth.ts         # Auth state management
│   ├── lib/                   # Config and utilities
│   │   └── config.ts          # API URLs, ad IDs, colors
│   ├── navigation/            # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── screens/               # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── GamesScreen.tsx
│   │   ├── GamePlayerScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── TournamentsScreen.tsx
│   └── types/                 # TypeScript types
│       └── index.ts
└── assets/                    # App icons and splash
```

## Features

### 🎮 Games
- Games load in a WebView from your website
- Interstitial ad shows when exiting a game
- Score tracking ready for implementation

### 💰 Rewarded Ads
- Users can watch ads to earn UC
- 5 UC per rewarded ad watched
- UC syncs with website account

### 🔐 Authentication
- Login via website WebView
- Secure token storage
- Session persists across app restarts

### 📱 Offline Support
- Auth data cached locally
- Graceful error handling

## Customization

### Change Colors
Edit `src/lib/config.ts`:
```typescript
export const COLORS = {
  primary: '#6366f1',    // Your brand color
  // ...
};
```

### Add New Games
Edit the `GAMES` array in `src/lib/config.ts`:
```typescript
{
  id: 'newgame',
  name: 'New Game',
  gameUrl: '/tournament/games/newgame',
  available: true,
  // ...
}
```

### Change UC Reward Amount
Edit `src/screens/GamesScreen.tsx` and `src/components/RewardedAdButton.tsx`

## Before Publishing

1. **Update app.json**:
   - Set real AdMob app ID
   - Update version and versionCode
   - Add your EAS project ID

2. **Update config.ts**:
   - Replace test ad IDs with production IDs

3. **Create app assets**:
   - Replace icon.png (1024x1024)
   - Replace adaptive-icon.png (1024x1024)
   - Replace splash-icon.png

4. **Test thoroughly**:
   - Test login flow
   - Test all games
   - Verify ads are showing

## Troubleshooting

### Ads not showing?
- Check ad unit IDs are correct
- AdMob needs time to activate new ad units (~1 hour)
- Use test IDs during development

### Build fails?
- Ensure all dependencies are installed
- Check EAS login: `npx eas whoami`
- Try: `npm run build:apk -- --clear-cache`

### Login not working?
- Check website URL in config.ts
- Verify Clerk is set up for mobile auth

## Support

For issues, contact the PUBGMI development team.
