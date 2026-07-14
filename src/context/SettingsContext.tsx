import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { getTheme, Theme } from '../theme/colors';
import { KEYS, loadJson, saveJson } from '../utils/storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export type Difficulty = 'easy' | 'hard';

interface Settings {
  themePreference: ThemePreference;
  colorBlind: boolean;
  soundEnabled: boolean;
  difficulty: Difficulty;
}

interface SettingsContextValue extends Settings {
  theme: Theme;
  isDark: boolean;
  setThemePreference: (p: ThemePreference) => void;
  setColorBlind: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
  setDifficulty: (v: Difficulty) => void;
  loaded: boolean;
}

const DEFAULTS: Settings = {
  themePreference: 'system',
  colorBlind: false,
  soundEnabled: true,
  difficulty: 'hard',
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadJson<Settings>(KEYS.settings, DEFAULTS).then((s) => {
      setSettings({ ...DEFAULTS, ...s });
      setLoaded(true);
    });
  }, []);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveJson(KEYS.settings, next);
      return next;
    });
  };

  const isDark =
    settings.themePreference === 'system'
      ? systemScheme === 'dark'
      : settings.themePreference === 'dark';

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      isDark,
      theme: getTheme(isDark, settings.colorBlind),
      setThemePreference: (p) => update({ themePreference: p }),
      setColorBlind: (v) => update({ colorBlind: v }),
      setSoundEnabled: (v) => update({ soundEnabled: v }),
      setDifficulty: (v) => update({ difficulty: v }),
      loaded,
    }),
    [settings, isDark, loaded]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings, SettingsProvider içinde kullanılmalı');
  return ctx;
}
