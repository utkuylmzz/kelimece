import { ANSWER_WORDS } from '../data/answerWords';
import { VALID_WORDS } from '../data/validWords';
import { WORDS_BY_LENGTH } from '../data/wordsByLength';
import { toLowerTr } from './turkish';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

/** Bir tahmindeki tek harfin değerlendirme sonucu. */
export type LetterState = 'correct' | 'present' | 'absent';

export type GuessEvaluation = LetterState[];

export type GameStatus = 'playing' | 'won' | 'lost';

/**
 * Klasik Wordle iki geçişli değerlendirme: önce doğru konumdakiler işaretlenir
 * ve cevaptaki harf sayacından düşülür; ikinci geçişte kalan sayaçlara göre
 * "var ama yanlış yerde" belirlenir. Böylece çift harfler doğru işlenir
 * (ör. cevapta bir tane 'a' varken tahminde iki 'a' varsa yalnızca biri boyanır).
 * Girdi/cevap küçük harfe normalize edilir.
 */
export function evaluateGuess(guess: string, answer: string): GuessEvaluation {
  const g = toLowerTr(guess);
  const a = toLowerTr(answer);
  if (g.length !== a.length) {
    throw new Error(`Tahmin ve cevap uzunlukları eşit olmalı: ${g} / ${a}`);
  }
  const result: GuessEvaluation = new Array(g.length).fill('absent');
  const remaining = new Map<string, number>();

  for (let i = 0; i < g.length; i++) {
    if (g[i] === a[i]) {
      result[i] = 'correct';
    } else {
      remaining.set(a[i], (remaining.get(a[i]) ?? 0) + 1);
    }
  }
  for (let i = 0; i < g.length; i++) {
    if (result[i] === 'correct') continue;
    const count = remaining.get(g[i]) ?? 0;
    if (count > 0) {
      result[i] = 'present';
      remaining.set(g[i], count - 1);
    }
  }
  return result;
}

const VALID_SET = new Set<string>(VALID_WORDS);
const VALID_SETS_BY_LENGTH: Record<number, Set<string>> = Object.fromEntries(
  Object.entries(WORDS_BY_LENGTH).map(([len, words]) => [Number(len), new Set(words)])
);

export function isValidWord(word: string, length: number = WORD_LENGTH): boolean {
  const w = toLowerTr(word);
  if (length === WORD_LENGTH) return VALID_SET.has(w);
  return VALID_SETS_BY_LENGTH[length]?.has(w) ?? false;
}

/** Çılgın modu için tur başına deneme hakkı: uzunluk + 1 (5→6 … 9→10). */
export function maxGuessesForLength(length: number): number {
  return length + 1;
}

/**
 * Sürekli/Çılgın modları için rastgele cevap seçer. `exclude` son oynanan
 * kelimeleri tutar ki art arda aynı kelime çıkmasın (havuz o kadar
 * daralırsa tekrar kaçınılmaz olabilir, o durumda tüm havuzdan seçilir).
 */
export function pickRandomWord(length: number, exclude: ReadonlySet<string> = new Set()): string {
  const pool = WORDS_BY_LENGTH[length] ?? [];
  const candidates = pool.filter((w) => !exclude.has(w));
  const source = candidates.length > 0 ? candidates : pool;
  return source[Math.floor(Math.random() * source.length)];
}

/** Kolay zorlukta tur başında açılacak rastgele harf indeksini seçer (tur bazlı modlar). */
export function pickHintIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

/** Aktif satırdaki tek hücre: kilitliyse harf önceden açılmıştır, yazılamaz/silinemez. */
export interface ActiveCell {
  letter: string;
  locked: boolean;
}

/**
 * Önceden açılmış (kilitli) hücreleri hesaplar. Kolay modda: tur ipucusu +
 * önceki tahminlerde doğru konumda bulunan harfler yerinde sabitlenir. Oturum
 * ipucu hakkı (Sürekli mod) zorluktan bağımsız kendi hücresini kilitler.
 */
export function computeLockedLetters(
  answer: string,
  evaluations: GuessEvaluation[],
  opts: { easy: boolean; hintIndex: number; sessionHintIndex?: number | null }
): (string | null)[] {
  const a = toLowerTr(answer);
  const locked: (string | null)[] = new Array(a.length).fill(null);
  if (opts.easy) {
    locked[opts.hintIndex] = a[opts.hintIndex];
    evaluations.forEach((row) =>
      row.forEach((state, i) => {
        if (state === 'correct') locked[i] = a[i];
      })
    );
  }
  if (opts.sessionHintIndex != null) {
    locked[opts.sessionHintIndex] = a[opts.sessionHintIndex];
  }
  return locked;
}

/** Kilitli hücreler + sırayla yazılan harflerden aktif satırı oluşturur:
 * yazılan her harf soldan sağa ilk boş (kilitsiz) hücreye yerleşir. */
export function composeActiveRow(locked: (string | null)[], typed: string): ActiveCell[] {
  const cells: ActiveCell[] = locked.map((l) => ({ letter: l ?? '', locked: l != null }));
  let t = 0;
  for (let i = 0; i < cells.length && t < typed.length; i++) {
    if (!cells[i].locked) {
      cells[i].letter = typed[t++];
    }
  }
  return cells;
}

/**
 * Günün bulmacası için ipucu harf indeksi — gün indeksinden deterministik
 * türetilir (herkes aynı gün aynı ipucu konumunu görür), böylece ayrıca
 * depolanmasına gerek kalmaz.
 */
export function getHintIndexForDay(dayIndex: number, length: number): number {
  return hashDay(dayIndex + 0x5bd1e995) % length;
}

/** Oyunun 1. günü (yerel takvim). Bu tarihten itibaren gün sayılır. */
const EPOCH = { year: 2026, month: 0, day: 1 };

/**
 * Yerel takvim gününe göre epoch'tan bu yana geçen gün sayısı.
 * UTC yerine yerel gün kullanılır ki bulmaca kullanıcının gece yarısında yenilensin.
 */
export function getDayIndex(date: Date = new Date()): number {
  const start = new Date(EPOCH.year, EPOCH.month, EPOCH.day);
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((today.getTime() - start.getTime()) / 86_400_000);
}

/**
 * Deterministik tamsayı karıştırıcı (splitmix benzeri). Gün indeksini havuz
 * indeksine çevirir; ardışık günlerin ardışık kelimelere denk gelmesini önler.
 * Sunucu gerekmez: aynı gün herkes aynı kelimeyi üretir.
 */
function hashDay(n: number): number {
  let x = (n + 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97) >>> 0;
  return (x ^ (x >>> 15)) >>> 0;
}

/** Belirli bir gün indeksi için kelime (bkz. getDailyWord). Geçmiş günün
 * kelimesini göstermek gibi durumlarda doğrudan indeksle çağrılır. */
export function getWordForDayIndex(dayIndex: number): string {
  const idx = hashDay(dayIndex) % ANSWER_WORDS.length;
  return ANSWER_WORDS[idx];
}

export function getDailyWord(date: Date = new Date()): string {
  return getWordForDayIndex(getDayIndex(date));
}
