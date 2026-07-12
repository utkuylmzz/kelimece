import {
  evaluateGuess,
  getDailyWord,
  getDayIndex,
  isValidWord,
  MAX_GUESSES,
  WORD_LENGTH,
} from '../gameLogic';
import { ANSWER_WORDS } from '../../data/answerWords';
import { VALID_WORDS } from '../../data/validWords';
import { isTurkishLetters, toLowerTr } from '../turkish';

describe('evaluateGuess', () => {
  it('tam eşleşme hepsi correct', () => {
    expect(evaluateGuess('kalem', 'kalem')).toEqual([
      'correct', 'correct', 'correct', 'correct', 'correct',
    ]);
  });

  it('hiç ortak harf yoksa hepsi absent', () => {
    expect(evaluateGuess('bordo', 'kalem')).toEqual([
      'absent', 'absent', 'absent', 'absent', 'absent',
    ]);
  });

  it('yanlış yerdeki harf present olur', () => {
    // cevap: kalem — tahmin: metal → m,e,t,a,l
    expect(evaluateGuess('metal', 'kalem')).toEqual([
      'present', // m kelimede var, yanlış yer
      'present', // e var, yanlış yer
      'absent',  // t yok
      'present', // a var, yanlış yer
      'present', // l var, yanlış yer
    ]);
  });

  it('çift harf: cevapta tek harf varken tahminde iki tane varsa sadece biri boyanır', () => {
    // cevap: kalem (tek a) — tahmin: arapa değil, "araba" kullanılır: a,r,a,b,a
    const r = evaluateGuess('araba', 'kalem');
    // ilk a: present (cevaptaki tek a tüketilir), diğer a'lar absent
    expect(r).toEqual(['present', 'absent', 'absent', 'absent', 'absent']);
  });

  it('çift harf: doğru konumdaki harf önceliklidir', () => {
    // cevap: saray (iki a: 2. ve 4. konum) — tahmin: astar → a,s,t,a,r
    // a(0): cevapta konum 0 's' → present; s(1): present; t: absent;
    // a(3): cevapta 3. konum 'a' → correct; r: present
    expect(evaluateGuess('astar', 'saray')).toEqual([
      'present', 'present', 'absent', 'correct', 'present',
    ]);
  });

  it('ı ve i ayrı harflerdir', () => {
    // cevap: ışıma — tahmindeki 'i' cevaptaki 'ı' ile eşleşmemeli
    const r = evaluateGuess('işlek', 'ışıma');
    expect(r[0]).toBe('absent'); // 'i' cevapta yok ('ı' var ama farklı harf)
    expect(r[1]).toBe('correct'); // ş
  });

  it('büyük harfli girdi Türkçe kurallarla normalize edilir', () => {
    // 'KIRIK' → kırık; 'ILIK' → ılık (İngilizce lowercase olsaydı 'ilik' olurdu)
    expect(evaluateGuess('KIRIK', 'kırık')).toEqual([
      'correct', 'correct', 'correct', 'correct', 'correct',
    ]);
    expect(evaluateGuess('İĞNE'.padEnd(5, 'M'), 'iğnem')).toEqual([
      'correct', 'correct', 'correct', 'correct', 'correct',
    ]);
  });

  it('uzunluk uyuşmazlığında hata fırlatır', () => {
    expect(() => evaluateGuess('abcd', 'kalem')).toThrow();
  });
});

describe('kelime listeleri', () => {
  it('tüm cevap kelimeleri geçerli tahmin listesinde', () => {
    const valid = new Set(VALID_WORDS);
    for (const w of ANSWER_WORDS) expect(valid.has(w)).toBe(true);
  });

  it('tüm kelimeler 5 harfli, küçük harf ve Türk alfabesinde', () => {
    for (const w of VALID_WORDS) {
      expect(w).toHaveLength(WORD_LENGTH);
      expect(w).toBe(toLowerTr(w));
      expect(isTurkishLetters(w)).toBe(true);
    }
  });

  it('isValidWord büyük harfli Türkçe girdiyi kabul eder', () => {
    expect(isValidWord('KİTAP')).toBe(true);
    expect(isValidWord('IŞIK'.padEnd(5, 'A'))).toBe(false); // 4 harfli uydurma
    expect(isValidWord('kitap')).toBe(true);
    expect(isValidWord('zzzzz')).toBe(false);
  });
});

describe('günün kelimesi', () => {
  it('aynı gün için deterministik', () => {
    const d = new Date(2026, 6, 9, 8, 0);
    const d2 = new Date(2026, 6, 9, 23, 59);
    expect(getDailyWord(d)).toBe(getDailyWord(d2));
  });

  it('gün indeksi yerel gün sınırında artar', () => {
    expect(getDayIndex(new Date(2026, 0, 1))).toBe(0);
    expect(getDayIndex(new Date(2026, 0, 2, 0, 0, 1))).toBe(1);
  });

  it('cevap havuzundan seçer ve ardışık günlerde makul dağılır', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const w = getDailyWord(new Date(2026, 0, 1 + i));
      expect(ANSWER_WORDS).toContain(w);
      seen.add(w);
    }
    // 60 günde en az 50 farklı kelime beklenir (çakışma çok az olmalı)
    expect(seen.size).toBeGreaterThan(50);
  });

  it('MAX_GUESSES sabiti 6', () => {
    expect(MAX_GUESSES).toBe(6);
  });
});
