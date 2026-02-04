import { useEffect, useState, useCallback } from 'react';
import Constants from 'expo-constants';

// Check if we're in Expo Go (no native updates available)
const isExpoGo = Constants.appOwnership === 'expo';

interface UpdateInfo {
    isAvailable: boolean;
    isDownloading: boolean;
    downloadProgress: number;
    isReady: boolean;
    error: string | null;
}

export function useOTAUpdates() {
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
        isAvailable: false,
        isDownloading: false,
        downloadProgress: 0,
        isReady: false,
        error: null,
    });

    const checkForUpdates = useCallback(async () => {
        if (isExpoGo) {
            console.log('OTA updates not available in Expo Go');
            return;
        }

        try {
            const Updates = await import('expo-updates');

            // Check for updates
            const update = await Updates.checkForUpdateAsync();

            if (update.isAvailable) {
                console.log('Update available, downloading...');
                setUpdateInfo(prev => ({ ...prev, isAvailable: true, isDownloading: true }));

                // Download the update
                const result = await Updates.fetchUpdateAsync();

                if (result.isNew) {
                    console.log('Update downloaded successfully');
                    setUpdateInfo(prev => ({
                        ...prev,
                        isDownloading: false,
                        downloadProgress: 100,
                        isReady: true
                    }));
                }
            } else {
                console.log('App is up to date');
            }
        } catch (error: any) {
            console.log('Update check failed:', error);
            setUpdateInfo(prev => ({
                ...prev,
                isDownloading: false,
                error: error?.message || 'Failed to check for updates'
            }));
        }
    }, []);

    const applyUpdate = useCallback(async () => {
        if (isExpoGo) return;

        try {
            const Updates = await import('expo-updates');
            await Updates.reloadAsync();
        } catch (error) {
            console.log('Failed to apply update:', error);
        }
    }, []);

    // Check for updates on mount (silently in background)
    useEffect(() => {
        // Delay check to not block app startup
        const timer = setTimeout(() => {
            checkForUpdates();
        }, 3000); // Check after 3 seconds

        return () => clearTimeout(timer);
    }, [checkForUpdates]);

    return {
        ...updateInfo,
        checkForUpdates,
        applyUpdate,
        isExpoGo,
    };
}
