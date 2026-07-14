/**
 * Ham kelime listesini işler:
 *  - tr-TR locale ile küçük harfe çevirir (İ→i, I→ı doğru çalışır)
 *  - Sadece Türk alfabesindeki harflerden oluşan tam 5 harfli kelimeleri tutar
 *  - Argo/uygunsuz kelimeleri filtreler
 *  - Yaygın kelime adaylarını geçerli listeyle kesiştirip günün kelimesi havuzunu üretir
 * Çıktı: src/data/validWords.ts ve src/data/answerWords.ts
 */
const fs = require('fs');
const path = require('path');

const TURKISH_LETTERS = /^[abcçdefgğhıijklmnoöprsştuüvyz]{5}$/;
const TURKISH_LETTERS_6_9 = /^[abcçdefgğhıijklmnoöprsştuüvyz]{6,9}$/;
const FANTASY_LENGTHS = [5, 6, 7, 8, 9];

// Uygunsuz/argo kelime blok listesi (günün kelimesi VE geçerli tahmin listesinden çıkarılır)
const BLOCKLIST = new Set([
  'bacak'.length === 5 ? '' : '', // placeholder yok; gerçek liste aşağıda
]);
const blocked = [
  'yarak', 'amcık', 'göt', 'sikim', 'sikiş', 'sikme', 'yavşa', 'pezev',
  'orosp', 'kaltak', 'sürtük', 'ibne', 'gavat', 'dalyar', 'amına',
];
// blocked: tam eşleşme veya kök olarak içerme
function isBlocked(w) {
  return blocked.some((b) => w.includes(b) || b.includes(w) && b.length === 5);
}

const raw = fs.readFileSync(path.join(__dirname, 'raw-words.txt'), 'utf8');
const valid = [
  ...new Set(
    raw
      .split(/\r?\n/)
      .map((w) => w.trim().toLocaleLowerCase('tr-TR'))
      .filter((w) => TURKISH_LETTERS.test(w) && !isBlocked(w))
  ),
].sort((a, b) => a.localeCompare(b, 'tr-TR'));

// Günün kelimesi adayları: yaygın, herkesin bildiği kelimeler (elle küre edildi).
// Sadece geçerli listede de bulunanlar havuza girer.
const candidates = `
abide abone acele acemi aceyi adres afiyet agora ahali ahenk ahtapot akarsu
bahar bahçe bakır balık bardak
kitap kalem masal deniz güneş yıldız çiçek meyve sebze ekmek
tabak çatal bıçak kaşık sürahi
kapak defter silgi tahta duvar
sokak cadde şehir kasap manav bakkal
horoz tavuk civciv koyun keçi sığır
elmas altın gümüş bakır demir çelik
kumaş iplik düğme makas
yastık yorgan
sabun havlu ayna tarak
şemsiye
armut kiraz vişne erik üzüm kavun karpuz
salça biber domates
soğan patates havuç
turşu reçel
peynir
yoğurt
tereyağı
zeytin
fındık fıstık badem ceviz
şeker
tuzluk
kahve
salep
ayran
limon
nane
kekik
sumak
hardal
sirke
maden
petrol
kömür
orman
ağaç
çınar kavak söğüt meşe
palmiye
yaprak
tomurcuk
filiz
kökler
gövde
budak
diken
çimen
bahçıvan
tohum
gübre
tarla
çiftçi
traktör
kağnı
saban
harman
başak buğday
arpa
mısır
pirinç
bulgur
nohut
fasulye
mercimek
bezelye
ıspanak
marul
lahana
kereviz
pırasa
turp
kabak
patlıcan
bamya
enginar
karnabahar
brokoli
semizotu
roka
tere
dereotu
maydanoz
fesleğen
biberiye
adaçayı
ıhlamur
papatya
menekşe
sümbül
zambak
karanfil
orkide
begonvil
manolya
akasya
mimoza
fulya
nergis
çiğdem
kardelen
gelincik
gonca
demet
buket
vazoda
saksı
balkon
teras
çatıda
bacada
merdiven
asansör
koridor
salon
mutfak
banyo
tuvalet
yatak
dolap
çekmece
sehpa
koltuk
sandalye
tabure
kilim
halı
perde
avize
lamba
priz
anahtar
kapı
pencere
eşik
tavan
zemin
bodrum
garaj
kiler
sundurma
veranda
çardak
kameriye
havuz
şadırvan
çeşme
kuyu
sarnıç
bent
baraj
kanal
dere
ırmak
nehir
göl
gölet
pınar
kaynak
şelale
çağlayan
girdap
dalga
köpük
kumsal
plaj
falez
kayalık
mağara
vadi
yamaç
tepe
zirve
doruk
uçurum
yayla
ova
bozkır
çöl
vaha
bataklık
sazlık
kamış
saz
hasır
sepet
küfe
heybe
torba
çuval
bohça
paket
koli
sandık
kasa
kutu
şişe
kavanoz
testi
küp
çömlek
güveç
tencere
tava
kazan
ocak
fırın
mangal
ızgara
şiş
kebap
köfte
sucuk
pastırma
salam
sosis
jambon
`.split(/\s+/).map((w) => w.trim().toLocaleLowerCase('tr-TR')).filter(Boolean);

// Ek elle seçilmiş yaygın 5 harfli kelimeler (doğrudan)
const extra = `
kitap kalem deniz bahar bahçe balık ekmek tabak kaşık bıçak duvar sokak
cadde şehir horoz tavuk koyun sığır altın demir çelik kumaş iplik düğme
makas sabun havlu tarak armut kiraz vişne kavun soğan havuç turşu reçel
zeytin şeker kahve ayran limon maden kömür orman kavak söğüt filiz gövde
budak diken çimen tohum gübre tarla saban başak arpa nohut turp kabak
bamya marul roka salon banyo dolap sehpa halı perde avize lamba kapı eşik
tavan zemin garaj kiler havuz çeşme kuyu baraj kanal dere nehir pınar
dalga köpük plaj vadi yamaç tepe zirve doruk yayla bozkır vaha kamış
hasır sepet küfe heybe torba çuval bohça paket sandık kasa kutu şişe
testi güveç tava kazan ocak fırın kebap köfte sucuk salam sosis
kalem masal güneş çiçek meyve sebze bardak bakır silgi tahta kasap manav
elmas gümüş yorgan
salça biber
kekik sirke
ağaç meşe
harman
mısır bulgur
lahana
tere
gonca demet buket saksı balkon teras
tabure kilim priz
bodrum
gölet
kumsal
mağara
çöl
sazlık
bakla acaba kadın erkek çocuk bebek anne baba abla kardeş dede nine amca
dayı hala teyze yenge enişte damat gelin düğün nişan bayram tatil okul
sınıf öğrenci hoca dersane sınav
kalp beyin damar kemik deri saç göz kulak burun ağız dudak dil diş çene
boyun omuz kol dirsek bilek parmak tırnak bacak diz ayak topuk
yürek ciğer mide böbrek
nabız nefes soluk
hasta doktor hekim eczane ilaç şurup merhem
iğne
sargı
yara bere çürük şişlik
ateş
öksürük
nezle grip
sağlık
huzur mutlu neşe keyif sevinç hüzün keder tasa dert çile
umut hayal düş rüya
uyku
sabah öğle akşam gece yarın dün bugün hafta aylar yıllar mevsim
ilkbahar
yaz kış güz
ocak şubat mart nisan mayıs haziran temmuz
eylül ekim kasım aralık
pazar salı
cuma
saat dakika saniye
zaman vakit süre an
erken
hızlı yavaş
uzak yakın
büyük küçük
uzun kısa
geniş dar
kalın ince
ağır hafif
sıcak soğuk ılık serin
kuru ıslak nemli
temiz kirli
yeni eski
genç yaşlı
güzel çirkin
iyi kötü
doğru yanlış
kolay zor
ucuz pahalı
zengin fakir yoksul
akıllı deli
cesur korkak
çalışkan tembel
dürüst
nazik kaba
sakin sinirli
sessiz
gürültü
karanlık aydınlık
parlak sönük mat
renkli
beyaz siyah
sarı yeşil mavi
pembe mor lacivert turuncu kahverengi gri bej
kırmızı
bordo
eflatun
turkuaz
haki
krem
gökkuşağı
bulut yağmur kar dolu sis pus çiy kırağı
rüzgar
fırtına
kasırga
tayfun
hortum
şimşek
gökgürültüsü
yıldırım
sel
çığ
deprem
heyelan
volkan
lav
kül
duman
alev
ateş
kıvılcım
köz
ocakta
soba
şömine
kalorifer
klima
vantilatör
pervane
motor
makine
çark
dişli
vida
somun
cıvata
çivi
çekiç
pense
tornavida
matkap
testere
rende
keski
eğe
zımpara
boya
fırça
rulo
tiner
vernik
cila
macun
alçı
çimento
harç
tuğla
briket
kiremit
çatı
oluk
dere
saçak
sundurma
kepenk
panjur
korkuluk
parmaklık
çit
tel
kafes
kümes
ahır
ağıl
samanlık
ambar
depo
hangar
atölye
fabrika
şantiye
inşaat
temel
kolon
kiriş
beton
demirci
marangoz
terzi
kunduracı
berber
kuaför
aşçı
garson
şoför
pilot
kaptan
tayfa
gemici
denizci
balıkçı
avcı
çoban
sürü
kurt kuzu oğlak buzağı tay sıpa
eşek katır
deve
manda
öküz
boğa
inek
dana
tosun
koç
teke
keçi
horoz
hindi
kaz ördek
güvercin
serçe
karga
saksağan
bülbül
kanarya
papağan
muhabbet
baykuş
kartal
şahin
atmaca
doğan
akbaba
leylek
turna
flamingo
pelikan
martı
karabatak
balıkçıl
kuğu
tavus
sülün
keklik
bıldırcın
çulluk
ağaçkakan
guguk
ibibik
kırlangıç
sığırcık
ispinoz
florya
saka
iskete
baştankara
çalıkuşu
yelve
arı
eşekarısı
yaban
bal
petek
kovan
oğul
polen
nektar
kelebek
tırtıl
koza
krizalit
uğurböceği
ateşböceği
cırcır
çekirge
peygamberdevesi
mantis
kınkanatlı
gübre böceği
osurgan
hamamböceği
karınca
termit
örümcek
akrep
kene
pire
bit
sinek
sivrisinek
tatarcık
üvez
atsineği
bok böceği
`.split(/\s+/).map((w) => w.trim().toLocaleLowerCase('tr-TR')).filter(Boolean);

// Ek yaygın 5 harfli kelimeler (havuzu genişletmek için, Temmuz 2026).
const extra2 = `
araba vapur tekne durak liman yolcu bilet valiz çanta çadır fener kablo
ampul radyo müzik şarkı gitar keman davul kaval zurna resim tablo gönye
ceket kazak şapka çorap kemer fular yelek palto yanak taban ekran dosya
yüzme güreş tenis kayak paten yarış hakem takım rakip polis asker hakim
yazar aktör korku sevgi gurur utanç merak kaygı sabır güven özgür barış
savaş zafer yüzde rakam hesap banka kredi fiyat vergi ücret sahil boğaz
tarih şimdi karne topaç aslan zebra yılan yunus midye köpek kirpi samur
tilki çakal incir çilek lokum helva aşure pasta turta simit börek dürüm
döner çorba pilav omlet gazoz şarap votka viski kuzey güney öğlen
`.split(/\s+/).map((w) => w.trim().toLocaleLowerCase('tr-TR')).filter(Boolean);

const validSet = new Set(valid);
const answers = [
  ...new Set(
    [...candidates, ...extra, ...extra2].filter(
      (w) => w.length === 5 && validSet.has(w)
    )
  ),
].sort((a, b) => a.localeCompare(b, 'tr-TR'));

// Çılgın modu: 5-9 harfli kelime havuzu. 5 harf → yukarıdaki `valid` (5.444
// kelime, mevcut Wordle listesi). 6-9 harf → raw-words-6-9.txt: iki açık
// kaynağın kesişimi — tdd-ai/hunspell-tr (MPL-2.0) kök listesi ile
// CanNuhlar/Turkce-Kelime-Listesi (TDK İmla Kılavuzu bazlı) kesiştirilerek
// hem lisanslı bir kaynaktan gelen hem gerçek/tam kelime olan girdiler seçildi
// (hunspell kökleri tek başına ek almamış, çoğu zaman eksik/anlamsız
// gövdelerdir — TDK listesiyle kesişim bu gövde çöplerini eler).
const raw6to9 = fs.readFileSync(path.join(__dirname, 'raw-words-6-9.txt'), 'utf8');
const words6to9 = [
  ...new Set(
    raw6to9
      .split(/\r?\n/)
      .map((w) => w.trim().toLocaleLowerCase('tr-TR'))
      .filter((w) => TURKISH_LETTERS_6_9.test(w) && !isBlocked(w))
  ),
];
const wordsByLength = Object.fromEntries(
  FANTASY_LENGTHS.map((len) => [
    len,
    (len === 5 ? valid : words6to9.filter((w) => w.length === len)).sort((a, b) =>
      a.localeCompare(b, 'tr-TR')
    ),
  ])
);

const header = '// Bu dosya scripts/process-words.js tarafından üretildi. Elle düzenlemeyin.\n';
fs.writeFileSync(
  path.join(__dirname, '..', 'src', 'data', 'validWords.ts'),
  header +
    'export const VALID_WORDS: readonly string[] = ' +
    JSON.stringify(valid) +
    ';\n'
);
fs.writeFileSync(
  path.join(__dirname, '..', 'src', 'data', 'answerWords.ts'),
  header +
    'export const ANSWER_WORDS: readonly string[] = ' +
    JSON.stringify(answers) +
    ';\n'
);
fs.writeFileSync(
  path.join(__dirname, '..', 'src', 'data', 'wordsByLength.ts'),
  header +
    'export const WORDS_BY_LENGTH: Readonly<Record<number, readonly string[]>> = ' +
    JSON.stringify(wordsByLength) +
    ';\n'
);
console.log('geçerli:', valid.length, '| günün kelimesi havuzu:', answers.length);
console.log(
  'çılgın mod havuzu:',
  FANTASY_LENGTHS.map((len) => `${len}h:${wordsByLength[len].length}`).join(' ')
);
