import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/hooks/useAuth';
import { useOTAUpdates } from './src/hooks/useOTAUpdates';
import { COLORS } from './src/lib/config';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Update Banner Component
function UpdateBanner() {
  const { isAvailable, isDownloading, isReady, applyUpdate, error } = useOTAUpdates();
  const [dismissed, setDismissed] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if ((isDownloading || isReady) && !dismissed) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isDownloading, isReady, dismissed]);

  if (dismissed || (!isDownloading && !isReady)) return null;

  return (
    <Animated.View style={[styles.updateBanner, { transform: [{ translateY: slideAnim }] }]}>
      {isDownloading ? (
        <>
          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.updateText}>Downloading update...</Text>
        </>
      ) : isReady ? (
        <>
          <Text style={styles.updateText}>✨ Update ready!</Text>
          <TouchableOpacity style={styles.updateBtn} onPress={applyUpdate}>
            <Text style={styles.updateBtnText}>Restart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissBtn} onPress={() => setDismissed(true)}>
            <Text style={styles.dismissBtnText}>Later</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </Animated.View>
  );
}

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const loadStoredAuth = useAuthStore((state) => state.loadStoredAuth);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize mobile ads (optional - skip if not configured or in Expo Go)
        try {
          const Constants = require('expo-constants').default;
          const isExpoGo = Constants.appOwnership === 'expo';

          if (!isExpoGo) {
            const mobileAds = require('react-native-google-mobile-ads').default;
            await mobileAds().initialize();
            console.log('Mobile ads initialized');
          } else {
            console.log('Skipping ads in Expo Go');
          }
        } catch (adError) {
          console.log('AdMob not configured, skipping:', adError);
        }

        // Load stored auth data
        await loadStoredAuth();
        console.log('Auth data loaded');
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AppNavigator />
        <UpdateBanner />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dark.background,
  },
  updateBanner: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  updateText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  updateBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  updateBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  dismissBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 4,
  },
  dismissBtnText: {
    color: '#ffffffcc',
    fontSize: 13,
  },
});

