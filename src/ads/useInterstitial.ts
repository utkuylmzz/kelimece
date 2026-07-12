import { useCallback, useEffect, useRef } from 'react';
import { AD_UNIT_IDS, adsAvailable, adsModule } from './adsConfig';
import { KEYS, loadJson, saveJson } from '../utils/storage';

/**
 * Bulmaca bittiğinde bir kez gösterilen geçiş reklamı.
 * Günde en fazla bir kez gösterilir (gösterilen gün AsyncStorage'da tutulur).
 * Expo Go'da no-op.
 */
export function useInterstitial(dayIndex: number) {
  const interstitialRef = useRef<any>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!adsAvailable || !adsModule) return;
    const { InterstitialAd, AdEventType } = adsModule;
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
      requestNonPersonalizedAdsOnly: true,
    });
    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
    });
    ad.load();
    interstitialRef.current = ad;
    return () => {
      unsubLoaded();
      interstitialRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  /** Oyun bittiğinde çağrılır; bugün gösterilmediyse ve yüklendiyse gösterir. */
  const maybeShow = useCallback(async () => {
    if (!adsAvailable || !interstitialRef.current || !loadedRef.current) return;
    const shownDay = await loadJson<number | null>(KEYS.interstitialDay, null);
    if (shownDay === dayIndex) return;
    await saveJson(KEYS.interstitialDay, dayIndex);
    try {
      interstitialRef.current.show();
    } catch {
      // reklam gösterilemedi; oyunu etkilemesin
    }
  }, [dayIndex]);

  return maybeShow;
}
