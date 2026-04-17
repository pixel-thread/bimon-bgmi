"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "bimon-color-theme";
const VALID_THEMES = ["default", "bgmi", "freefire", "pes", "mlbb"] as const;
export type ColorTheme = (typeof VALID_THEMES)[number];

interface ColorThemeContextValue {
    colorTheme: ColorTheme;
    setColorTheme: (theme: ColorTheme) => void;
}

const ColorThemeContext = createContext<ColorThemeContextValue>({
    colorTheme: "default",
    setColorTheme: () => {},
});

export function useColorTheme() {
    return useContext(ColorThemeContext);
}

/**
 * Provider that manages the user's color theme preference.
 * Default = no color theme (standard white/dark mode).
 * Users can opt into a color theme from settings.
 * Applies `data-game` attribute to <html> only when a color is chosen.
 */
export function ColorThemeProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [colorTheme, setColorThemeState] = useState<ColorTheme>("default");
    const [mounted, setMounted] = useState(false);

    // Read from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && VALID_THEMES.includes(stored as ColorTheme)) {
            setColorThemeState(stored as ColorTheme);
            if (stored !== "default") {
                document.documentElement.setAttribute("data-game", stored);
            } else {
                document.documentElement.removeAttribute("data-game");
            }
        }
        setMounted(true);
    }, []);

    const setColorTheme = (theme: ColorTheme) => {
        setColorThemeState(theme);
        localStorage.setItem(STORAGE_KEY, theme);
        if (theme !== "default") {
            document.documentElement.setAttribute("data-game", theme);
        } else {
            document.documentElement.removeAttribute("data-game");
        }
    };

    if (!mounted) {
        return (
            <ColorThemeContext.Provider value={{ colorTheme: "default", setColorTheme }}>
                {children}
            </ColorThemeContext.Provider>
        );
    }

    return (
        <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
            {children}
        </ColorThemeContext.Provider>
    );
}
