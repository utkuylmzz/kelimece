import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { adsModule } from './src/ads/adsConfig';
import ErrorBoundary from './src/components/ErrorBoundary';
import { GameProvider } from './src/context/GameContext';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import GameScreen from './src/screens/GameScreen';

// Logo hızlı cihazlarda göz açıp kapayana kadar kaybolduğu için açılış
// ekranı en az SPLASH_MIN_MS boyunca ekranda tutuluyor.
const SPLASH_MIN_MS = 2500;

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const { isDark } = useSettings();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <GameScreen />
    </>
  );
}

export default function App() {
  // AdMob SDK'sını başlat (Expo Go'da modül yok → atlanır). Native modül ilk
  // kez gerçek bir build'de devreye girdiği için başlatma hatası tüm
  // uygulamayı çökertmesin diye korunuyor.
  useEffect(() => {
    try {
      adsModule?.default().initialize();
    } catch (e) {
      console.warn('AdMob initialize hatası:', e);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <SettingsProvider>
          <GameProvider>
            <Root />
          </GameProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
