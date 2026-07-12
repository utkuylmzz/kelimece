import { isTurkishLetters, toLowerTr, toUpperTr } from '../turkish';

describe('toLowerTr', () => {
  it('İ → i (İngilizce locale gibi noktalı kombine karakter üretmez)', () => {
    expect(toLowerTr('İSTANBUL')).toBe('istanbul');
    expect(toLowerTr('İ')).toHaveLength(1);
  });

  it('I → ı (İngilizce i değil)', () => {
    expect(toLowerTr('ILIK')).toBe('ılık');
    expect(toLowerTr('KIRIK')).toBe('kırık');
  });

  it('diğer Türkçe harfler korunur', () => {
    expect(toLowerTr('ÇĞÖŞÜ')).toBe('çğöşü');
  });

  it('karışık kelime: İĞNE → iğne, IŞIK → ışık', () => {
    expect(toLowerTr('İĞNE')).toBe('iğne');
    expect(toLowerTr('IŞIK')).toBe('ışık');
  });
});

describe('toUpperTr', () => {
  it('i → İ ve ı → I', () => {
    expect(toUpperTr('iğne')).toBe('İĞNE');
    expect(toUpperTr('ışık')).toBe('IŞIK');
    expect(toUpperTr('kitap')).toBe('KİTAP');
    expect(toUpperTr('kırık')).toBe('KIRIK');
  });

  it('gidiş-dönüş tutarlı: toLowerTr(toUpperTr(w)) === w', () => {
    for (const w of ['iğne', 'ışık', 'çiçek', 'sığır', 'üzüm', 'jilet']) {
      expect(toLowerTr(toUpperTr(w))).toBe(w);
    }
  });
});

describe('isTurkishLetters', () => {
  it('Türk alfabesi harflerini kabul eder', () => {
    expect(isTurkishLetters('çğıiöşü')).toBe(true);
  });
  it('q, w, x ve rakamları reddeder', () => {
    expect(isTurkishLetters('qwert')).toBe(false);
    expect(isTurkishLetters('abc1d')).toBe(false);
  });
});
