const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * react-native-google-mobile-ads kendi buildscript'inde eski usul
 * `rootProject.ext.kotlinVersion` değişkenini okuyor (expo-build-properties'in
 * android.kotlinVersion ayarı ona ulaşmıyor). Bu ext bloğu olmadan RN'in
 * varsayılan Kotlin sürümü (2.1.0) kullanılıyor ki bazı play-services-ads
 * sürümleri daha yeni Kotlin metadata'sıyla derlenmiş olabiliyor ve derleme
 * "incompatible version of Kotlin" hatasıyla patlıyor.
 *
 * Her `expo prebuild` çalıştığında android/build.gradle sıfırdan üretildiği
 * için bu düzeltmeyi manuel eklemek yerine kalıcı bir config plugin olarak
 * uyguluyoruz.
 */
function withGoogleMobileAdsKotlinFix(config, { kotlinVersion = '2.2.20' } = {}) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error('withGoogleMobileAdsKotlinFix yalnızca Groovy build.gradle destekler');
    }
    const marker = 'ext {\n  // react-native-google-mobile-ads kotlinVersion fix';
    if (config.modResults.contents.includes(marker)) {
      return config;
    }
    config.modResults.contents = config.modResults.contents.replace(
      'buildscript {',
      `${marker}\n  kotlinVersion = '${kotlinVersion}'\n}\n\nbuildscript {`
    );
    return config;
  });
}

module.exports = withGoogleMobileAdsKotlinFix;
