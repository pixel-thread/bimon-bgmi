import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../lib/config';
import {
    HomeScreen,
    GamesScreen,
    GamePlayerScreen,
    MemoryGameScreen,
    LoginScreen,
    ProfileScreen,
    TournamentsScreen,
} from '../screens';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Custom dark theme
const DarkTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        primary: COLORS.primary,
        background: COLORS.dark.background,
        card: COLORS.dark.card,
        text: COLORS.dark.text,
        border: COLORS.dark.cardBorder,
        notification: COLORS.primary,
    },
};

export function AppNavigator() {
    return (
        <NavigationContainer theme={DarkTheme}>
            <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: {
                        backgroundColor: COLORS.dark.background,
                    },
                }}
            >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Games" component={GamesScreen} />
                <Stack.Screen
                    name="GamePlayer"
                    component={GamePlayerScreen}
                    options={{
                        animation: 'slide_from_bottom',
                        gestureEnabled: false,
                    }}
                />
                <Stack.Screen
                    name="MemoryGame"
                    component={MemoryGameScreen}
                    options={{
                        animation: 'slide_from_bottom',
                    }}
                />
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{
                        animation: 'slide_from_bottom',
                        presentation: 'modal',
                    }}
                />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Tournaments" component={TournamentsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
