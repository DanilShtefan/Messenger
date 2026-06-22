import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  background: string;
  setBackground: (bg: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = 'messenger-theme';
const BG_KEY = 'messenger-background';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return getSystemTheme();
}

function getInitialBackground(): string {
  return localStorage.getItem(BG_KEY) ?? 'none';
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [background, setBackgroundState] = useState<string>(getInitialBackground);

  const applyTheme = useCallback((t: Theme) => {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
  }, []);

  const applyBackground = useCallback((bg: string) => {
    document.documentElement.setAttribute('data-background', bg);
    localStorage.setItem(BG_KEY, bg);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    applyBackground(background);
  }, [background, applyBackground]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem(THEME_KEY);
      if (!stored) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  const setBackground = useCallback((bg: string) => {
    setBackgroundState(bg);
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme, background, setBackground }),
    [theme, toggleTheme, setTheme, background, setBackground],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
