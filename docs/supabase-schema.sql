-- Kelimece — Sürekli mod global streak leaderboard şeması.
-- Supabase projesi oluşturduktan sonra bu dosyayı SQL Editor'de çalıştırın.
-- Kimlik: hesap/şifre yok, Supabase Anonymous Auth (signInAnonymously) her
-- cihaza kalıcı bir auth.uid() verir; RLS bu id ile yalnızca kendi satırını
-- yazmasına izin verir, herkes tüm satırları okuyabilir (public leaderboard).

create table if not exists leaderboard_entries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 20),
  best_streak int not null default 0,
  current_streak int not null default 0,
  updated_at timestamptz not null default now()
);

-- Her rumuz yalnızca bir oyuncu tarafından alınabilir (büyük/küçük harf
-- duyarsız). İhlalde istemciye 23505 (unique_violation) döner ve uygulama
-- "bu rumuz alınmış" uyarısı gösterir.
create unique index if not exists leaderboard_entries_nickname_unique
  on leaderboard_entries (lower(nickname));

alter table leaderboard_entries enable row level security;

create policy "herkes okuyabilir"
  on leaderboard_entries for select
  using (true);

create policy "sadece kendi satırını yazar"
  on leaderboard_entries for insert
  with check (auth.uid() = user_id);

create policy "sadece kendi satırını günceller"
  on leaderboard_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Ayrıca: Authentication > Providers bölümünden "Anonymous Sign-Ins"
-- özelliğinin açık olduğundan emin olun (varsayılan olarak kapalı gelebilir).
