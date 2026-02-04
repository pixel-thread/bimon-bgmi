// API Configuration
export const API_CONFIG = {
    baseUrl: 'https://bimon-bgmi.vercel.app/api',
    websiteUrl: 'https://bimon-bgmi.vercel.app',
};

// AdMob Configuration
// App ID: ca-app-pub-2651043074081875~1960370652
export const ADMOB_CONFIG = {
    // Test ad IDs used in development mode
    // Production IDs used in release builds (when __DEV__ is false)
    banner: {
        android: __DEV__
            ? 'ca-app-pub-3940256099942544/6300978111'  // Test ID
            : 'ca-app-pub-2651043074081875/6287171043', // Production Banner
        ios: __DEV__
            ? 'ca-app-pub-3940256099942544/2934735716'  // Test ID
            : 'ca-app-pub-2651043074081875/6287171043', // Production Banner (same for now)
    },
    interstitial: {
        android: __DEV__
            ? 'ca-app-pub-3940256099942544/1033173712'  // Test ID
            : 'ca-app-pub-2651043074081875/9508122951', // Production Interstitial
        ios: __DEV__
            ? 'ca-app-pub-3940256099942544/4411468910'  // Test ID
            : 'ca-app-pub-2651043074081875/9508122951', // Production Interstitial (same for now)
    },
    rewarded: {
        android: __DEV__
            ? 'ca-app-pub-3940256099942544/5224354917'  // Test ID
            : 'ca-app-pub-2651043074081875/6231330727', // Production Rewarded
        ios: __DEV__
            ? 'ca-app-pub-3940256099942544/1712485313'  // Test ID
            : 'ca-app-pub-2651043074081875/6231330727', // Production Rewarded (same for now)
    },
};

// App Colors (matching website theme)
export const COLORS = {
    primary: '#6366f1',     // Indigo
    secondary: '#a855f7',   // Purple
    accent: '#f59e0b',      // Amber
    success: '#10b981',     // Emerald
    warning: '#f59e0b',     // Amber
    error: '#ef4444',       // Red

    // Dark theme (default)
    dark: {
        background: '#0f0f0f',
        card: '#1a1a1a',
        cardBorder: '#2a2a2a',
        text: '#fafafa',
        textMuted: '#a1a1aa',
    },

    // Light theme
    light: {
        background: '#f5f5f5',
        card: '#ffffff',
        cardBorder: '#e4e4e7',
        text: '#18181b',
        textMuted: '#71717a',
    },
};

// Games list
export const GAMES: {
    id: string;
    name: string;
    description: string;
    icon: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    playTime: string;
    gameUrl: string;
    available: boolean;
}[] = [
        {
            id: 'memory',
            name: 'Memory Match',
            description: 'Match pairs of cards to test your memory skills',
            icon: '🧠',
            difficulty: 'Medium',
            playTime: '3-8 min',
            gameUrl: '/tournament/games/memory',
            available: true,
        },
        {
            id: 'flappy',
            name: 'Flappy BGMI',
            description: 'Navigate through obstacles in this classic arcade game',
            icon: '🎯',
            difficulty: 'Hard',
            playTime: '1-3 min',
            gameUrl: '/tournament/games/flappy',
            available: false,
        },
        {
            id: 'snake',
            name: 'Snake Rush',
            description: 'Classic snake game with a modern twist',
            icon: '⚡',
            difficulty: 'Medium',
            playTime: '3-10 min',
            gameUrl: '/tournament/games/snake',
            available: false,
        },
    ];
