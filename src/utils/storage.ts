import AsyncStorage from '@react-native-async-storage/async-storage';

/** JSON tabanlı ince AsyncStorage sarmalayıcı. Hatalarda sessizce varsayılana döner. */
export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw != null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // depolama hatası oyunu durdurmasın
  }
}

export async function removeJson(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // depolama hatası oyunu durdurmasın
  }
}

export const KEYS = {
  dailyState: 'kelimece/dailyState',
  stats: 'kelimece/stats',
  settings: 'kelimece/settings',
  interstitialDay: 'kelimece/interstitialDay',
  helpSeen: 'kelimece/helpSeen',
} as const;
