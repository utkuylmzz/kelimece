import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AD_UNIT_IDS, adsAvailable, adsModule } from './adsConfig';

/**
 * Ana ekranın altındaki banner reklam. Expo Go'da (native modül yokken)
 * hiçbir şey render etmez.
 */
export default function AdBanner() {
  if (!adsAvailable || !adsModule) return null;
  const { BannerAd, BannerAdSize } = adsModule;
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={AD_UNIT_IDS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
});
