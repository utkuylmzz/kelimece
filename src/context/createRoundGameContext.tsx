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
  GuessEvaluation,
  isValidWord,
  LetterState,
  maxGuessesForLength,
  pickHintIndex,
  pickRandomWord,
} from '../utils/gameLogic';
import { toLowerTr } from '../utils/turkish';
import { loadJson, saveJson } from '../utils/storage';
import { useSettings } from './SettingsContext';

export type { GameStatus };
export type InvalidReason = 'tooShort' | 'notInList' | null;

export interface RoundStats {
  roundsPlayed: number;
  roundsWon: number;
  currentStreak: number;
  maxStreak: number;
}

const EMPTY_STATS: RoundStats = {
  roundsPlayed: 0,
  roundsWon: 0,
  currentStreak: 0,
  maxStreak: 0,
};

/** Tekrar önlemek için son oynanan kelimeleri tutar. */
const RECENT_WORDS_LIMIT = 30;

interface PersistedRound {
  wordLength: number;
  answer: string;
  hintIndex: number;
  guesses: string[];
  status: GameStatus;
  recentWords: string[];
  /** Oturum (seri koşusu) başına 1 kez kullanılabilen isteğe bağlı ipucu hakkı */
  sessionHintUsed?: boolean;
  /** Bu turda ipucu hakkıyla açılan harf indeksi (kullanılmadıysa null) */
  hintRevealIndex?: number | null;
}

export interface RoundGameContextValue {
  wordLength: number;
  maxGuesses: number;
  answer: string;
  guesses: string[];
  evaluations: GuessEvaluation[];
  currentGuess: string;
  /** Aktif satırın hücre hücre durumu: kilitli (önceden açılmış) harfler dahil */
  activeRow: ActiveCell[];
  status: GameStatus;
  stats: RoundStats;
  hintIndex: number;
  keyStates: Record<string, LetterState>;
  invalidReason: InvalidReason;
  loaded: boolean;
  /** Oturum ipucu hakkı bu seride kullanıldı mı */
  sessionHintUsed: boolean;
  /** İpucu hakkıyla bu turda açılan harf indeksi (yoksa null) */
  sessionHintIndex: number | null;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => void;
  nextRound: () => void;
  /** Oturum ipucu hakkını kullanır: bilinmeyen bir hücrenin harfini açar. */
  revealSessionHint: () => void;
  clearInvalid: () => void;
}

interface RoundGameConfig {
  storageKeys: { round: string; stats: string };
  /** Yeni tur için kelime uzunluğunu seçer (Sürekli: hep 5, Çılgın: 5-9 rastgele). */
  pickWordLength: () => number;
}

function applyRoundEnd(stats: RoundStats, won: boolean): RoundStats {
  const currentStreak = won ? stats.currentStreak + 1 : 0;
  return {
    roundsPlayed: stats.roundsPlayed + 1,
    roundsWon: stats.roundsWon + (won ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
  };
}

function freshRound(
  pickWordLength: () => number,
  exclude: ReadonlySet<string>,
  sessionHintUsed = false
): PersistedRound {
  const wordLength = pickWordLength();
  const answer = pickRandomWord(wordLength, exclude);
  return {
    wordLength,
    answer,
    hintIndex: pickHintIndex(wordLength),
    guesses: [],
    status: 'playing',
    recentWords: [...exclude, answer].slice(-RECENT_WORDS_LIMIT),
    sessionHintUsed,
    hintRevealIndex: null,
  };
}

export function createRoundGameContext(config: RoundGameConfig) {
  const Context = createContext<RoundGameContextValue | null>(null);

  function Provider({ children }: { children: React.ReactNode }) {
    const { difficulty } = useSettings();
    const initialRound = useMemo(() => freshRound(config.pickWordLength, new Set()), []);
    const [round, setRound] = useState<PersistedRound>(initialRound);
    const [currentGuess, setCurrentGuess] = useState('');
    const [stats, setStats] = useState<RoundStats>(EMPTY_STATS);
    const [invalidReason, setInvalidReason] = useState<InvalidReason>(null);
    const [loaded, setLoaded] = useState(false);
    const statusRef = useRef(round.status);
    statusRef.current = round.status;
    const currentGuessRef = useRef(currentGuess);
    currentGuessRef.current = currentGuess;
    const roundRef = useRef(round);
    roundRef.current = round;

    useEffect(() => {
      (async () => {
        const [savedRound, savedStats] = await Promise.all([
          loadJson<PersistedRound | null>(config.storageKeys.round, null),
          loadJson<RoundStats>(config.storageKeys.stats, EMPTY_STATS),
        ]);
        setStats(savedStats);
        if (savedRound) {
          setRound(savedRound);
        } else {
          saveJson(config.storageKeys.round, initialRound);
        }
        setLoaded(true);
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const persistRound = useCallback((next: PersistedRound) => {
      saveJson(config.storageKeys.round, next);
    }, []);

    const evaluations = useMemo(
      () => round.guesses.map((g) => evaluateGuess(g, round.answer)),
      [round.guesses, round.answer]
    );

    // Kolay modda tur ipucusu + yeşil bulunan harfler, oturum ipucu hakkı
    // kullanıldıysa o hücre: hepsi aktif satırda kilitli gelir.
    const locked = useMemo(
      () =>
        computeLockedLetters(round.answer, evaluations, {
          easy: difficulty === 'easy',
          hintIndex: round.hintIndex,
          sessionHintIndex: round.hintRevealIndex ?? null,
        }),
      [round.answer, evaluations, difficulty, round.hintIndex, round.hintRevealIndex]
    );
    const lockedRef = useRef(locked);
    lockedRef.current = locked;
    const evaluationsRef = useRef(evaluations);
    evaluationsRef.current = evaluations;

    const addLetter = useCallback((letter: string) => {
      if (statusRef.current !== 'playing') return;
      setInvalidReason(null);
      const unlockedCount = lockedRef.current.filter((l) => l == null).length;
      setCurrentGuess((g) =>
        g.length < unlockedCount ? g + toLowerTr(letter) : g
      );
    }, []);

    const removeLetter = useCallback(() => {
      if (statusRef.current !== 'playing') return;
      setInvalidReason(null);
      setCurrentGuess((g) => g.slice(0, -1));
    }, []);

    const submitGuess = useCallback(() => {
      if (statusRef.current !== 'playing') return;
      const current = roundRef.current;
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
      if (!isValidWord(guess, current.wordLength)) {
        setInvalidReason('notInList');
        return;
      }
      const nextGuesses = [...current.guesses, guess];
      const won = toLowerTr(guess) === toLowerTr(current.answer);
      const maxGuesses = maxGuessesForLength(current.wordLength);
      const finished = won || nextGuesses.length >= maxGuesses;
      const nextStatus: GameStatus = won ? 'won' : finished ? 'lost' : 'playing';
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const nextRoundState: PersistedRound = { ...current, guesses: nextGuesses, status: nextStatus };
      setRound(nextRoundState);
      setCurrentGuess('');
      persistRound(nextRoundState);
      if (finished) {
        setStats((s) => {
          const nextStats = applyRoundEnd(s, won);
          saveJson(config.storageKeys.stats, nextStats);
          return nextStats;
        });
      }
    }, [persistRound]);

    const nextRound = useCallback(() => {
      if (statusRef.current === 'playing') return;
      const current = roundRef.current;
      const exclude = new Set(current.recentWords);
      // Kayıpla biten oturumdan sonra yeni seri başlar: ipucu hakkı yenilenir.
      // Galibiyette seri sürer, kullanılmış hak sonraki turlara taşınır.
      const carryHintUsed = current.status === 'lost' ? false : (current.sessionHintUsed ?? false);
      const next = freshRound(config.pickWordLength, exclude, carryHintUsed);
      // Burada bilinçli olarak LayoutAnimation YOK: tur geçişi StatsModal'ın
      // kapanış animasyonuyla çakışınca Android eski mimaride animasyon
      // kuyruğu kilitleniyor ve ızgara görsel olarak donuyordu (state
      // güncellense de kutular yerinden oynamıyordu). Yeni tur zaten
      // RoundGameArea'daki key ile temiz remount ediliyor.
      setRound(next);
      setCurrentGuess('');
      setInvalidReason(null);
      persistRound(next);
    }, [persistRound]);

    const revealSessionHint = useCallback(() => {
      if (statusRef.current !== 'playing') return;
      const current = roundRef.current;
      if (current.sessionHintUsed) return;
      // Zaten bilinen (kilitli veya daha önce yeşil bulunmuş) hücreye ipucu
      // harcamak anlamsız — adaylar bilinmeyen konumlardan seçilir.
      const known = new Set<number>();
      lockedRef.current.forEach((l, i) => {
        if (l != null) known.add(i);
      });
      evaluationsRef.current.forEach((row) =>
        row.forEach((state, i) => {
          if (state === 'correct') known.add(i);
        })
      );
      const candidates: number[] = [];
      for (let i = 0; i < current.wordLength; i++) {
        if (!known.has(i)) candidates.push(i);
      }
      if (candidates.length === 0) return; // açılacak harf kalmadı, hakkı yakma
      const idx = candidates[Math.floor(Math.random() * candidates.length)];
      const next: PersistedRound = { ...current, sessionHintUsed: true, hintRevealIndex: idx };
      setRound(next);
      persistRound(next);
    }, [persistRound]);

    const keyStates = useMemo(() => {
      const rank: Record<LetterState, number> = { absent: 0, present: 1, correct: 2 };
      const map: Record<string, LetterState> = {};
      round.guesses.forEach((guess, gi) => {
        const evalRow = evaluations[gi];
        [...toLowerTr(guess)].forEach((ch, i) => {
          const s = evalRow[i];
          if (!map[ch] || rank[s] > rank[map[ch]]) map[ch] = s;
        });
      });
      return map;
    }, [round.guesses, evaluations]);

    const value: RoundGameContextValue = {
      wordLength: round.wordLength,
      maxGuesses: maxGuessesForLength(round.wordLength),
      answer: round.answer,
      guesses: round.guesses,
      evaluations,
      currentGuess,
      activeRow: composeActiveRow(locked, currentGuess),
      status: round.status,
      stats,
      hintIndex: round.hintIndex,
      keyStates,
      invalidReason,
      loaded,
      sessionHintUsed: round.sessionHintUsed ?? false,
      sessionHintIndex: round.hintRevealIndex ?? null,
      addLetter,
      removeLetter,
      submitGuess,
      nextRound,
      revealSessionHint,
      clearInvalid: useCallback(() => setInvalidReason(null), []),
    };

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useRoundGame(): RoundGameContextValue {
    const ctx = useContext(Context);
    if (!ctx) throw new Error('useRoundGame, ilgili Provider içinde kullanılmalı');
    return ctx;
  }

  return { Provider, useRoundGame };
}
