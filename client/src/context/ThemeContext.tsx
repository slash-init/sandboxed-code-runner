import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type ThemeName = 'dark-nebula' | 'midnight-ocean' | 'aura-light' | 'cyber-neon';

export interface ThemeInfo {
  id: ThemeName;
  label: string;
  description: string;
  preview: {
    bg: string;
    accent: string;
    surface: string;
  };
}

export const THEMES: ThemeInfo[] = [
  {
    id: 'dark-nebula',
    label: 'Dark Nebula',
    description: 'Deep violet space vibes',
    preview: { bg: '#0a0a12', accent: '#a78bfa', surface: '#16152a' },
  },
  {
    id: 'midnight-ocean',
    label: 'Midnight Ocean',
    description: 'Deep blue & teal tones',
    preview: { bg: '#060d14', accent: '#22d3ee', surface: '#0c1a2a' },
  },
  {
    id: 'aura-light',
    label: 'Aura Light',
    description: 'Clean & minimal light mode',
    preview: { bg: '#f8f7fc', accent: '#7c3aed', surface: '#ffffff' },
  },
  {
    id: 'cyber-neon',
    label: 'Cyber Neon',
    description: 'Electric retro-futuristic',
    preview: { bg: '#020204', accent: '#00ff88', surface: '#0a0a10' },
  },
];

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themeInfo: ThemeInfo;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'code-runner-theme';

function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') return 'dark-nebula';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && THEMES.some(t => t.id === stored)) return stored as ThemeName;
  return 'dark-nebula';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  }, []);

  const cycleTheme = useCallback(() => {
    const idx = THEMES.findIndex(t => t.id === theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next.id);
  }, [theme, setTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const themeInfo = THEMES.find(t => t.id === theme)!;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeInfo, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
