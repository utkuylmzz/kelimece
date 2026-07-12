/**
 * Türkçe büyük/küçük harf dönüşümü.
 *
 * JS'in varsayılan toLowerCase/toUpperCase'i İngilizce kurallarını uygular:
 * 'İ'.toLowerCase() === 'i̇' (i + combining dot) ve 'ı'.toUpperCase() === 'I'
 * dışında 'I'.toLowerCase() === 'i' verir — Türkçe'de yanlıştır.
 *
 * toLocaleLowerCase('tr-TR') doğru çalışır ama Hermes motorunun Intl desteği
 * platforma göre değişebildiğinden, İ/I ve i/ı eşlemesini elle yapıp kalanı
 * standart dönüşüme bırakıyoruz. ç, ğ, ö, ş, ü zaten locale'den bağımsız
 * doğru dönüşür.
 */
export function toLowerTr(s: string): string {
  return s.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
}

export function toUpperTr(s: string): string {
  return s.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
}

/** Türk alfabesindeki 29 harf (küçük). Klavye ve doğrulama için tek kaynak. */
export const TURKISH_ALPHABET = 'abcçdefgğhıijklmnoöprsştuüvyz';

const TURKISH_WORD_RE = new RegExp(`^[${TURKISH_ALPHABET}]+$`);

/** Sadece Türk alfabesi harflerinden oluşuyor mu? (küçük harf bekler) */
export function isTurkishLetters(s: string): boolean {
  return TURKISH_WORD_RE.test(s);
}
