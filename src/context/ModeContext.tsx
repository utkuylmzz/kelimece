import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { KEYS, loadJson, saveJson } from '../utils/storage';

export type GameMode = 'daily' | 'endless' | 'fantasy';

interface ModeContextValue {
  mode: GameMode;
  setMode: (m: GameMode) => void;
  loaded: boolean;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<GameMode>('daily');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadJson<GameMode>(KEYS.selectedMode, 'daily').then((m) => {
      setModeState(m);
      setLoaded(true);
    });
  }, []);

  const setMode = (m: GameMode) => {
    setModeState(m);
    saveJson(KEYS.selectedMode, m);
  };

  const value = useMemo<ModeContextValue>(() => ({ mode, setMode, loaded }), [mode, loaded]);

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode, ModeProvider içinde kullanılmalı');
  return ctx;
}
