import { Platform } from 'react-native';

/**
 * AdMob reklam birimi kimlikleri.
 *
 * ŞU AN GOOGLE'IN RESMİ TEST ID'LERİ KULLANILIYOR.
 * Yayına almadan önce AdMob konsolunda oluşturduğunuz gerçek reklam birimi
 * ID'lerini buraya yazın. Uygulama kimliği (App ID) ise app.json içindeki
 * "react-native-google-mobile-ads" eklenti ayarında güncellenmelidir.
 */
export const AD_UNIT_IDS = {
  banner: Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716', // TEST — gerçek iOS banner ID ile değiştirin
    default: 'ca-app-pub-3940256099942544/6300978111', // TEST — gerçek Android banner ID ile değiştirin
  })!,
  interstitial: Platform.select({
    ios: 'ca-app-pub-3940256099942544/4411468910', // TEST — gerçek iOS geçiş reklamı ID ile değiştirin
    default: 'ca-app-pub-3940256099942544/1033173712', // TEST — gerçek Android geçiş reklamı ID ile değiştirin
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
