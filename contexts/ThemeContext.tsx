import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';
type FontSize = 'small' | 'medium' | 'large';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: FontSize;
  setFontSize: (fontSize: FontSize) => void;
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    error: string;
    warning: string;
  };
  fontSizes: {
    small: number;
    medium: number;
    large: number;
    title: number;
    subtitle: number;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lightColors = {
  background: '#ffffff',
  surface: '#f8f9fa',
  primary: '#31954b',
  secondary: '#3b82f6',
  text: '#1a1a1a',
  textSecondary: '#666666',
  border: '#e5e7eb',
  success: '#31954b',
  error: '#ff4757',
  warning: '#f59e0b',
};

const darkColors = {
  background: '#0f0f23',
  surface: '#1a1a2e',
  primary: '#00ff88',
  secondary: '#3b82f6',
  text: '#ffffff',
  textSecondary: '#888888',
  border: '#16213e',
  success: '#00ff88',
  error: '#ff4757',
  warning: '#f59e0b',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      const savedFontSize = await AsyncStorage.getItem('fontSize');

      if (savedTheme) setThemeState(savedTheme as Theme);
      if (savedFontSize) setFontSizeState(savedFontSize as FontSize);
    } catch (error) {
      console.log('Error loading preferences:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const setFontSize = async (newFontSize: FontSize) => {
    try {
      await AsyncStorage.setItem('fontSize', newFontSize);
      setFontSizeState(newFontSize);
    } catch (error) {
      console.log('Error saving font size:', error);
    }
  };

  const isDark = theme === 'system'
    ? systemColorScheme === 'dark'
    : theme === 'dark';

  const colors = isDark ? darkColors : lightColors;

  const fontSizeMultiplier = {
    small: 0.9,
    medium: 1.0,
    large: 1.1,
  }[fontSize];

  const fontSizes = {
    small: 12 * fontSizeMultiplier,
    medium: 14 * fontSizeMultiplier,
    large: 16 * fontSizeMultiplier,
    title: 24 * fontSizeMultiplier,
    subtitle: 18 * fontSizeMultiplier,
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        fontSize,
        setFontSize,
        isDark,
        colors,
        fontSizes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}