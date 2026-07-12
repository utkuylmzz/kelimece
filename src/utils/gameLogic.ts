import { ANSWER_WORDS } from '../data/answerWords';
import { VALID_WORDS } from '../data/validWords';
import { toLowerTr } from './turkish';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

/** Bir tahmindeki tek harfin değerlendirme sonucu. */
export type LetterState = 'correct' | 'present' | 'absent';

export type GuessEvaluation = LetterState[];

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

export function isValidWord(word: string): boolean {
  return VALID_SET.has(toLowerTr(word));
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
