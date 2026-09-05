import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Theme {
    name: string;
    primary: string;
    accent: string;
    buttonGrad1: string;
    buttonGrad2: string;
}

export const THEMES: Theme[] = [
    {
        name: 'purple',
        primary: '#7c4dff',
        accent: '#b388ff',
        buttonGrad1: '#7c4dff',
        buttonGrad2: '#b388ff',
    },
    {
        name: 'blue',
        primary: '#2196f3',
        accent: '#64b5f6',
        buttonGrad1: '#2196f3',
        buttonGrad2: '#64b5f6',
    },
    {
        name: 'green',
        primary: '#4caf50',
        accent: '#81c784',
        buttonGrad1: '#4caf50',
        buttonGrad2: '#81c784',
    },
    {
        name: 'orange',
        primary: '#ff9800',
        accent: '#ffb74d',
        buttonGrad1: '#ff9800',
        buttonGrad2: '#ffb74d',
    },
    {
        name: 'pink',
        primary: '#e91e63',
        accent: '#f06292',
        buttonGrad1: '#e91e63',
        buttonGrad2: '#f06292',
    },
];

interface ThemeContextType {
    themeIndex: number;
    theme: Theme;
    setThemeByIndex: (index: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [themeIndex, setThemeIndex] = useState<number>(() => {
        const stored = localStorage.getItem('learning-galaxy-theme');
        return stored ? parseInt(stored, 10) : 0;
    });

    const theme = THEMES[themeIndex] || THEMES[0];

    const setThemeByIndex = (index: number) => {
        if (index >= 0 && index < THEMES.length) {
            setThemeIndex(index);
            localStorage.setItem('learning-galaxy-theme', index.toString());
        }
    };

    useEffect(() => {
        // Apply CSS variables for theme
        document.documentElement.style.setProperty('--theme-primary', theme.primary);
        document.documentElement.style.setProperty('--theme-accent', theme.accent);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ themeIndex, theme, setThemeByIndex }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
