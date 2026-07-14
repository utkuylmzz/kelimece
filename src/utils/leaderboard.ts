import { supabase, supabaseAvailable } from './supabase';
import { KEYS, loadJson, saveJson } from './storage';

export interface LeaderboardRow {
  userId: string;
  nickname: string;
  bestStreak: number;
}

let sessionEnsured = false;

/** İlk çağrıda cihaza kalıcı bir anonim Supabase oturumu açar (bir kere). */
export async function ensureSession(): Promise<boolean> {
  if (!supabaseAvailable || !supabase) return false;
  if (sessionEnsured) return true;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) return false;
    }
    sessionEnsured = true;
    return true;
  } catch {
    return false;
  }
}

export async function getNickname(): Promise<string | null> {
  return loadJson<string | null>(KEYS.nickname, null);
}

export async function setNickname(nickname: string): Promise<void> {
  await saveJson(KEYS.nickname, nickname);
}

export type ClaimResult = 'ok' | 'taken' | 'error';

/**
 * Rumuzu ilk kez kaydetmeyi dener. Rumuzlar benzersizdir (şemada lower()
 * üzerinde unique index) — başka bir oyuncu almışsa 'taken' döner ki modal
 * kullanıcıya doğru hatayı gösterebilsin. upsertStreak'ten farklı olarak
 * hatayı sessizce yutmaz.
 */
export async function claimNickname(
  nickname: string,
  currentStreak: number
): Promise<ClaimResult> {
  if (!supabaseAvailable || !supabase) return 'error';
  try {
    const ok = await ensureSession();
    if (!ok) return 'error';
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return 'error';

    const { error } = await supabase.from('leaderboard_entries').upsert({
      user_id: userId,
      nickname,
      best_streak: currentStreak,
      current_streak: currentStreak,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      return error.code === '23505' ? 'taken' : 'error';
    }
    return 'ok';
  } catch {
    return 'error';
  }
}

/**
 * Sürekli moddaki güncel streak'i Supabase'e yazar (best_streak = mevcut ile
 * yeni değerin büyüğü). Ağ/oturum hatalarında sessizce yutulur — leaderboard
 * oyunun ana akışını etkilememeli.
 */
export async function upsertStreak(nickname: string, currentStreak: number): Promise<void> {
  if (!supabaseAvailable || !supabase) return;
  try {
    const ok = await ensureSession();
    if (!ok) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const { data: existing } = await supabase
      .from('leaderboard_entries')
      .select('best_streak')
      .eq('user_id', userId)
      .maybeSingle();

    const bestStreak = Math.max(existing?.best_streak ?? 0, currentStreak);

    await supabase.from('leaderboard_entries').upsert({
      user_id: userId,
      nickname,
      best_streak: bestStreak,
      current_streak: currentStreak,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // ağ hatası leaderboard dışında oyunu etkilemesin
  }
}

export async function fetchTopStreaks(limit = 50): Promise<LeaderboardRow[]> {
  if (!supabaseAvailable || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('user_id, nickname, best_streak')
      .order('best_streak', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => ({
      userId: row.user_id as string,
      nickname: row.nickname as string,
      bestStreak: row.best_streak as number,
    }));
  } catch {
    return [];
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  if (!supabaseAvailable || !supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
