import { useEffect, useRef } from 'react';
import { useEndlessGame } from '../context/EndlessContext';
import { getNickname, upsertStreak } from '../utils/leaderboard';
import { supabaseAvailable } from '../utils/supabase';

/**
 * Görünmez senkronizasyon bileşeni: Sürekli mod turu her bittiğinde (rumuz
 * zaten seçilmişse) güncel streak'i arka planda Supabase'e yazar. Rumuz henüz
 * seçilmemişse hiçbir şey yapmaz — kullanıcı LeaderboardModal'dan ilk kez
 * rumuz belirleyince ilk yazım oradan tetiklenir.
 */
export default function LeaderboardSync() {
  const { stats } = useEndlessGame();
  const lastSynced = useRef<number | null>(null);

  useEffect(() => {
    if (!supabaseAvailable) return;
    if (stats.roundsPlayed === 0) return;
    if (lastSynced.current === stats.roundsPlayed) return;
    lastSynced.current = stats.roundsPlayed;
    getNickname().then((nickname) => {
      if (nickname) upsertStreak(nickname, stats.currentStreak);
    });
  }, [stats.roundsPlayed, stats.currentStreak]);

  return null;
}
