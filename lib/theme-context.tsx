import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { Colors, DarkColors } from '@/lib/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

function deepMerge<T extends Record<string, any>>(base: T, override: DeepPartial<T>): T {
  const result = { ...base } as Record<string, any>;
  for (const key in override) {
    const val = override[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = deepMerge(base[key] as Record<string, any>, val as DeepPartial<Record<string, any>>);
    } else if (val !== undefined) {
      result[key] = val;
    }
  }
  return result as T;
}

export type ThemeColors = typeof Colors;

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  isDark: false,
  setMode: () => {},
  colors: Colors,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemDark, setSystemDark] = useState(
    Appearance.getColorScheme() === 'dark'
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemDark(colorScheme === 'dark');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ecovibe-theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
    } catch {}
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemDark);
  const colors = isDark ? deepMerge(Colors, DarkColors) : Colors;

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    try { localStorage.setItem('ecovibe-theme', m); } catch {}
  };

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
