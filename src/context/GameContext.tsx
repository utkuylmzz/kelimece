import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LayoutAnimation } from 'react-native';
import {
  ActiveCell,
  composeActiveRow,
  computeLockedLetters,
  evaluateGuess,
  GameStatus,
  getDailyWord,
  getDayIndex,
  getHintIndexForDay,
  GuessEvaluation,
  isValidWord,
  LetterState,
  MAX_GUESSES,
  WORD_LENGTH,
} from '../utils/gameLogic';
import { toLowerTr } from '../utils/turkish';
import { KEYS, loadJson, removeJson, saveJson } from '../utils/storage';
import { useSettings } from './SettingsContext';

export type { GameStatus };

export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  /** 1-6 tahmin dağılımı; index 0 → 1 tahminde bulundu */
  distribution: number[];
  /** Serinin bozulup bozulmadığını anlamak için son tamamlanan gün */
  lastCompletedDay: number | null;
}

interface PersistedDaily {
  dayIndex: number;
  guesses: string[];
  status: GameStatus;
}

const EMPTY_STATS: Stats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: [0, 0, 0, 0, 0, 0],
  lastCompletedDay: null,
};

export type InvalidReason = 'tooShort' | 'notInList' | null;

interface GameContextValue {
  dayIndex: number;
  answer: string;
  guesses: string[];
  evaluations: GuessEvaluation[];
  currentGuess: string;
  /** Aktif satırın hücre hücre durumu: kilitli (önceden açılmış) harfler dahil */
  activeRow: ActiveCell[];
  status: GameStatus;
  stats: Stats;
  /** Kolay zorlukta açık gösterilecek harf indeksi (gün bazlı, deterministik) */
  hintIndex: number;
  /** Klavye tuşlarının o ana kadarki en iyi durumu */
  keyStates: Record<string, LetterState>;
  invalidReason: InvalidReason;
  loaded: boolean;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => void;
  clearInvalid: () => void;
  /** Yalnızca geliştirme modu: bugünün bulmacasını tekrar oynanabilir hale getirir. */
  devResetDaily: () => void;
  /** Yalnızca geliştirme modu: istatistikleri sıfırlar. */
  devResetStats: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

/** Serinin devamı için önceki günün tamamlanmış olması gerekir. */
function applyGameEnd(stats: Stats, dayIndex: number, won: boolean, guessCount: number): Stats {
  const streakContinues = stats.lastCompletedDay === dayIndex - 1;
  const currentStreak = won ? (streakContinues ? stats.currentStreak + 1 : 1) : 0;
  const distribution = [...stats.distribution];
  if (won) distribution[guessCount - 1] += 1;
  return {
    gamesPlayed: stats.gamesPlayed + 1,
    gamesWon: stats.gamesWon + (won ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    distribution,
    lastCompletedDay: dayIndex,
  };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { difficulty } = useSettings();
  const [dayIndex, setDayIndex] = useState(() => getDayIndex());
  const answer = useMemo(() => getDailyWord(), [dayIndex]);
  const hintIndex = useMemo(() => getHintIndexForDay(dayIndex, WORD_LENGTH), [dayIndex]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [status, setStatus] = useState<GameStatus>('playing');
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [invalidReason, setInvalidReason] = useState<InvalidReason>(null);
  const [loaded, setLoaded] = useState(false);
  const statusRef = useRef(status);
  statusRef.current = status;
  const currentGuessRef = useRef(currentGuess);
  currentGuessRef.current = currentGuess;
  const guessesRef = useRef(guesses);
  guessesRef.current = guesses;

  // Açılışta kayıtlı durumu yükle; gün değiştiyse sıfırla
  useEffect(() => {
    (async () => {
      const today = getDayIndex();
      const [daily, savedStats] = await Promise.all([
        loadJson<PersistedDaily | null>(KEYS.dailyState, null),
        loadJson<Stats>(KEYS.stats, EMPTY_STATS),
      ]);
      setStats(savedStats);
      if (daily && daily.dayIndex === today) {
        setGuesses(daily.guesses);
        setStatus(daily.status);
      }
      setDayIndex(today);
      setLoaded(true);
    })();
  }, []);

  const persistDaily = useCallback((next: PersistedDaily) => {
    saveJson(KEYS.dailyState, next);
  }, []);

  const evaluations = useMemo(
    () => guesses.map((g) => evaluateGuess(g, answer)),
    [guesses, answer]
  );

  // Kolay modda ipucu harfi + önceki tahminlerde yeşil bulunan harfler aktif
  // satırda kilitli gelir; yazılan harfler yalnızca boş hücrelere akar.
  const locked = useMemo(
    () => computeLockedLetters(answer, evaluations, { easy: difficulty === 'easy', hintIndex }),
    [answer, evaluations, difficulty, hintIndex]
  );
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  const addLetter = useCallback(
    (letter: string) => {
      if (statusRef.current !== 'playing') return;
      setInvalidReason(null);
      const unlockedCount = lockedRef.current.filter((l) => l == null).length;
      setCurrentGuess((g) =>
        g.length < unlockedCount ? g + toLowerTr(letter) : g
      );
    },
    []
  );

  const removeLetter = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    setInvalidReason(null);
    setCurrentGuess((g) => g.slice(0, -1));
  }, []);

  const submitGuess = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    const lockedNow = lockedRef.current;
    const typed = currentGuessRef.current;
    const unlockedCount = lockedNow.filter((l) => l == null).length;
    if (typed.length < unlockedCount) {
      setInvalidReason('tooShort');
      return;
    }
    const guess = composeActiveRow(lockedNow, typed)
      .map((c) => c.letter)
      .join('');
    if (!isValidWord(guess)) {
      setInvalidReason('notInList');
      return;
    }
    const nextGuesses = [...guessesRef.current, guess];
    const won = toLowerTr(guess) === toLowerTr(answer);
    const finished = won || nextGuesses.length >= MAX_GUESSES;
    const nextStatus: GameStatus = won ? 'won' : finished ? 'lost' : 'playing';
    // Satır ızgarası tamamlanan/aktif/önizleme satırlar arasında boyut
    // değiştiriyor (bkz. GuessGrid) — bu geçişin akıcı animasyonla olması için
    // state güncellemesinden hemen önce native tarafa haber verilmeli.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setGuesses(nextGuesses);
    setStatus(nextStatus);
    setCurrentGuess('');
    persistDaily({ dayIndex, guesses: nextGuesses, status: nextStatus });
    if (finished) {
      setStats((s) => {
        const nextStats = applyGameEnd(s, dayIndex, won, nextGuesses.length);
        saveJson(KEYS.stats, nextStats);
        return nextStats;
      });
    }
  }, [answer, dayIndex, persistDaily]);

  const keyStates = useMemo(() => {
    const rank: Record<LetterState, number> = { absent: 0, present: 1, correct: 2 };
    const map: Record<string, LetterState> = {};
    guesses.forEach((guess, gi) => {
      const evalRow = evaluations[gi];
      [...toLowerTr(guess)].forEach((ch, i) => {
        const s = evalRow[i];
        if (!map[ch] || rank[s] > rank[map[ch]]) map[ch] = s;
      });
    });
    return map;
  }, [guesses, evaluations]);

  const devResetDaily = useCallback(async () => {
    if (!__DEV__) return;
    await removeJson(KEYS.dailyState);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setGuesses([]);
    setCurrentGuess('');
    setStatus('playing');
    setInvalidReason(null);
  }, []);

  const devResetStats = useCallback(async () => {
    if (!__DEV__) return;
    await removeJson(KEYS.stats);
    setStats(EMPTY_STATS);
  }, []);

  const value: GameContextValue = {
    dayIndex,
    answer,
    guesses,
    evaluations,
    currentGuess,
    activeRow: composeActiveRow(locked, currentGuess),
    status,
    stats,
    hintIndex,
    keyStates,
    invalidReason,
    loaded,
    addLetter,
    removeLetter,
    submitGuess,
    clearInvalid: useCallback(() => setInvalidReason(null), []),
    devResetDaily,
    devResetStats,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame, GameProvider içinde kullanılmalı');
  return ctx;
}
