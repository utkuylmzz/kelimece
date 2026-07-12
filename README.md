# Kelimece 🟩🟨

Günlük Türkçe kelime bulmaca oyunu (Wordle benzeri). Tamamen çevrimdışı çalışır;
günün kelimesi cihazda tarihten deterministik olarak hesaplanır — herkes aynı gün
aynı kelimeyi çözer.

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

Şu an **Google'ın resmî test ID'leri** kullanılıyor. Yayına almadan önce:

1. **Reklam birimi ID'leri** → [`src/ads/adsConfig.ts`](src/ads/adsConfig.ts)
   (banner + interstitial, iOS/Android ayrı ayrı)
2. **Uygulama ID'leri (App ID)** → [`app.json`](app.json) içindeki
   `react-native-google-mobile-ads` eklenti bloğu (`androidAppId`, `iosAppId`)
3. App ID değişince yeniden native build alın (`npx expo prebuild --clean` + build).

Reklam davranışı: ana ekran altında banner; bulmaca bittiğinde (kazan/kaybet)
**günde en fazla bir kez** geçiş reklamı.

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
- **Kelime listesi:** [MehmetHuseyinDelipalta/Wordle-Turkce-Kelime-Listesi](https://github.com/MehmetHuseyinDelipalta/Wordle-Turkce-Kelime-Listesi)
  (MIT). `scripts/process-words.js` filtreler (Türk alfabesi, 5 harf, argo blok
  listesi) ve iki dosya üretir: `validWords.ts` (5.444 geçerli tahmin) ve
  `answerWords.ts` (277 yaygın günün kelimesi). Yenilemek için: `npm run words`.
- **Kelime uzunluğu esnek:** `WORD_LENGTH`/`MAX_GUESSES` sabitleri ve tüm mantık
  parametrik; 4/6 harfli modlar için yalnızca yeni liste + sabit gerekir.
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
  components/  Izgara, klavye, modallar
  context/     GameContext (oyun+istatistik), SettingsContext (tema)
  data/        Üretilen kelime listeleri (elle düzenlemeyin)
  screens/     GameScreen
  theme/       Renk paletleri (normal + renk körü modu)
  utils/       Oyun mantığı, Türkçe harf işlemleri, paylaşım, depolama
scripts/       Kelime listesi işleme scripti
```

## Sonraya bırakılanlar

- 4/6 harfli modlar (altyapı hazır, liste + mod seçici gerekir)
- Günün kelimesi havuzunu genişletme (277 kelime ≈ 9 ay; `scripts/process-words.js`
  içindeki aday listesine ekleme yapıp `npm run words` çalıştırın)
- Kutu çevirme animasyonları, haptic geri bildirim
- iOS App Tracking Transparency izin akışı (AdMob kişiselleştirilmiş reklam için;
  şu an `requestNonPersonalizedAdsOnly: true` ile izinsiz çalışır)
- Uygulama ikonu / açılış ekranı özelleştirmesi (şablon varsayılanları duruyor)
