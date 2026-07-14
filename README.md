# Kelimece 🟩🟨

Türkçe kelime bulmaca oyunu (Wordle benzeri), üç modlu: **Günlük** (herkesin
aynı gün aynı kelimeyi çözdüğü, cihazda deterministik hesaplanan klasik mod),
**Sürekli** (5 harfli, art arda oynanan, streak'e dayalı mod) ve **Çılgın**
(5-9 harf arası rastgele uzunlukta kelimelerle sürekli oynanan mod). İki zorluk
seviyesi var: Kolay'da tur başında rastgele bir harf açık gösterilir, Zor'da
hiçbir ipucu yok. Günlük ve Çılgın modları tamamen çevrimdışı çalışır; Sürekli
moddaki global streak leaderboard'u için (opsiyonel) Supabase gerekir — bkz.
[Leaderboard kurulumu](#leaderboard-kurulumu-supabase).

## Çalıştırma

```bash
npm install
npm start          # Expo Go ile QR kodu okutun (reklamlar Expo Go'da görünmez)
```

**Reklamları test etmek için development build gerekir** (AdMob native modül içerir,
Expo Go'da çalışmaz — uygulama Expo Go'da reklamsız ama sorunsuz çalışır):

```bash
npx expo run:android   # veya: npx expo run:ios (macOS gerekir)
# ya da EAS ile:
npx eas build --profile development --platform android
```

Testler ve tip kontrolü:

```bash
npm test           # 23 birim testi (Türkçe karakter edge-case'leri dahil)
npm run typecheck
```

## AdMob gerçek ID'leri nereye eklenir?

**Android için gerçek AdMob ID'leri kullanılıyor.** iOS henüz AdMob'da
oluşturulmadığından test ID'lerinde kaldı — iOS'a çıkarken:

1. **Reklam birimi ID'leri** → [`src/ads/adsConfig.ts`](src/ads/adsConfig.ts)
   (banner + interstitial, iOS/Android ayrı ayrı)
2. **Uygulama ID'leri (App ID)** → [`app.json`](app.json) içindeki
   `react-native-google-mobile-ads` eklenti bloğu (`androidAppId`, `iosAppId`)
3. App ID değişince yeniden native build alın (`npx expo prebuild --clean` + build).

Reklam davranışı: ana ekran altında banner; bulmaca bittiğinde (kazan/kaybet)
**günde en fazla bir kez** geçiş reklamı.

## Leaderboard kurulumu (Supabase)

Sürekli moddaki global streak sıralaması Supabase (Postgres + Anonymous Auth)
kullanır. Kurulum olmadan uygulama sorunsuz çalışır, 🏆 ikonu "şu an
kullanılamıyor" gösterir.

1. [supabase.com](https://supabase.com) üzerinde ücretsiz bir proje oluşturun.
2. Proje SQL Editor'de [`docs/supabase-schema.sql`](docs/supabase-schema.sql)
   dosyasını çalıştırın (tablo + RLS politikaları).
3. Authentication → Providers → **Anonymous Sign-Ins**'i açın (varsayılan kapalı).
4. `.env.example` dosyasını `.env` olarak kopyalayıp Project Settings → API'den
   **Project URL** ve **anon public key**'i girin:
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```
5. `.env` `.gitignore`'da — anon key public/client-safe olsa da commit'lenmez,
   her geliştirici kendi `.env`'ini oluşturur.

Kimlik doğrulama yok (hesap/şifre istenmez): her cihaz ilk Sürekli mod
etkileşiminde anonim bir Supabase oturumu açar, kullanıcıdan yalnızca bir rumuz
istenir. RLS her cihazın yalnızca kendi satırını yazabilmesini, herkesin tüm
sıralamayı okuyabilmesini sağlar.

## Mimari kararlar

- **State:** React Context (`GameContext`, `SettingsContext`) + AsyncStorage.
  Tek ekranlı küçük bir uygulama için Redux gereksiz.
- **Navigasyon yok:** İstatistik / Nasıl Oynanır / Ayarlar modal olarak açılır;
  react-navigation bağımlılığına gerek kalmadı.
- **Türkçe harf dönüşümü:** `İ→i, I→ı` eşlemesi elle yapılır
  ([`src/utils/turkish.ts`](src/utils/turkish.ts)) — Hermes'in Intl desteğine
  güvenmemek için `toLocaleLowerCase('tr-TR')` yerine deterministik regex eşlemesi.
  Birim testleriyle doğrulandı.
- **Günün kelimesi:** yerel takvim günü → splitmix benzeri hash → havuz indeksi
  ([`src/utils/gameLogic.ts`](src/utils/gameLogic.ts)). Sunucusuz, deterministik,
  ardışık günler tahmin edilemez.
- **Kelime listesi (5 harf):** [MehmetHuseyinDelipalta/Wordle-Turkce-Kelime-Listesi](https://github.com/MehmetHuseyinDelipalta/Wordle-Turkce-Kelime-Listesi)
  (MIT). `scripts/process-words.js` filtreler (Türk alfabesi, 5 harf, argo blok
  listesi) ve iki dosya üretir: `validWords.ts` (5.444 geçerli tahmin) ve
  `answerWords.ts` (384 yaygın günün kelimesi).
- **Kelime listesi (6-9 harf, Çılgın modu):** `scripts/raw-words-6-9.txt`,
  [tdd-ai/hunspell-tr](https://github.com/tdd-ai/hunspell-tr) (MPL-2.0) kök
  listesi ile [CanNuhlar/Turkce-Kelime-Listesi](https://github.com/CanNuhlar/Turkce-Kelime-Listesi)
  (TDK İmla Kılavuzu bazlı) kelime listesinin kesişimi alınarak üretildi —
  hunspell kökleri tek başına genelde eksik/ek almamış gövdelerdir, TDK
  listesiyle kesişim yalnızca gerçek/tam kelimeleri bırakır. `wordsByLength.ts`
  dosyasını üretir (5-9 harf, uzunluğa göre gruplu). Tüm listeleri yenilemek
  için: `npm run words`.
- **Kelime uzunluğu esnek:** `WORD_LENGTH`/`MAX_GUESSES` sabitleri ve tüm mantık
  parametrik; Çılgın modu bunu 5-9 harf aralığında zaten kullanıyor.
- **Özgün görsel kimlik:** [`src/theme/colors.ts`](src/theme/colors.ts) bilinçli
  olarak NYT Wordle'ın gri/sarı-yeşil paletinden ayrışan sıcak/toprak tonlu
  nötrler + zümrüt yeşili/amber ikilisi kullanır (ilk sürümde yanlışlıkla
  NYT'nin tam koyu tema hex kodları kopyalanmıştı, düzeltildi). Oyun kuralları
  telif korumasına tabi değil ama görsel "trade dress" benzerliğinden
  kaçınmak için renk kimliği bilinçli olarak farklılaştırıldı. Enter tuşu da
  klavyeden kaldırılıp ekranda ayrı bir "GÖNDER" butonuna taşındı (hem NYT'nin
  klavye-içi Enter deseninden ayrışmak hem de keşfedilebilirliği artırmak
  için).

## Klasör yapısı

```
src/
  ads/         AdMob sarmalayıcıları (Expo Go'da sessizce devre dışı)
  components/  Izgara, klavye, modallar, PuzzleView (paylaşılan oyun ekranı)
  context/     GameContext (Günlük), createRoundGameContext fabrikası +
               EndlessContext/FantasyContext (Sürekli/Çılgın), ModeContext
               (seçili mod), SettingsContext (tema + zorluk)
  data/        Üretilen kelime listeleri (elle düzenlemeyin)
  screens/     GameScreen (mod yönlendirici), DailyGameArea, RoundGameArea
  theme/       Renk paletleri (normal + renk körü modu)
  utils/       Oyun mantığı, Türkçe harf işlemleri, paylaşım, depolama,
               Supabase client + leaderboard API
scripts/       Kelime listesi işleme scripti
docs/          Supabase şema SQL'i
```

## Sonraya bırakılanlar

- Günün kelimesi havuzunu genişletme (384 kelime; `scripts/process-words.js`
  içindeki aday listesine ekleme yapıp `npm run words` çalıştırın)
- Kutu çevirme animasyonları, haptic geri bildirim
- iOS App Tracking Transparency izin akışı (AdMob kişiselleştirilmiş reklam için;
  şu an `requestNonPersonalizedAdsOnly: true` ile izinsiz çalışır)
- Uygulama ikonu / açılış ekranı özelleştirmesi (şablon varsayılanları duruyor)
- Çılgın/Sürekli modlar için de dev-reset araçları (şu an yalnızca Günlük'te var)
