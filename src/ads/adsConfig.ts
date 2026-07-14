import { Platform } from 'react-native';

/**
 * AdMob reklam birimi kimlikleri.
 *
 * Android: gerçek AdMob ID'leri kullanılıyor.
 * iOS: henüz AdMob'da uygulama oluşturulmadığından Google'ın test ID'leri
 * kullanılıyor — iOS'a çıkarken AdMob konsolunda ayrı bir iOS uygulaması ve
 * reklam birimleri oluşturup buradaki ve app.json'daki iosAppId'yi güncelleyin.
 */
export const AD_UNIT_IDS = {
  banner: Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716', // TEST — gerçek iOS banner ID ile değiştirin
    default: 'ca-app-pub-4610058472211087/5271091249', // Android banner (gerçek)
  })!,
  interstitial: Platform.select({
    ios: 'ca-app-pub-3940256099942544/4411468910', // TEST — gerçek iOS geçiş reklamı ID ile değiştirin
    default: 'ca-app-pub-4610058472211087/4358454506', // Android geçiş reklamı (gerçek)
  })!,
};

/**
 * react-native-google-mobile-ads native modül gerektirir; Expo Go'da yoktur.
 * Modül yoksa (Expo Go) reklamlar sessizce devre dışı kalır, uygulama çalışmaya
 * devam eder. Development build / production build'de reklamlar aktifleşir.
 */
export function loadAdsModule(): typeof import('react-native-google-mobile-ads') | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-google-mobile-ads');
  } catch {
    return null;
  }
}

export const adsModule = loadAdsModule();
export const adsAvailable = adsModule != null;
