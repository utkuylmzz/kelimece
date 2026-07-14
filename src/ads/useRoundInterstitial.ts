import { useCallback, useEffect, useRef } from 'react';
import { AD_UNIT_IDS, adsAvailable, adsModule } from './adsConfig';
import { loadJson, saveJson } from '../utils/storage';

const ROUNDS_PER_AD = 5;

/**
 * Sürekli/Çılgın modları için her turda değil, her ROUNDS_PER_AD turda bir
 * gösterilen geçiş reklamı. Aynı tur sayısında iki kez göstermemek için son
 * gösterilen tur sayısı AsyncStorage'da tutulur. Expo Go'da no-op.
 */
export function useRoundInterstitial(roundsPlayed: number, storageKey: string) {
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

  const maybeShow = useCallback(async () => {
    if (!adsAvailable || !interstitialRef.current || !loadedRef.current) return;
    if (roundsPlayed === 0 || roundsPlayed % ROUNDS_PER_AD !== 0) return;
    const lastShownAt = await loadJson<number | null>(storageKey, null);
    if (lastShownAt === roundsPlayed) return;
    await saveJson(storageKey, roundsPlayed);
    try {
      interstitialRef.current.show();
    } catch {
      // reklam gösterilemedi; oyunu etkilemesin
    }
  }, [roundsPlayed, storageKey]);

  return maybeShow;
}
