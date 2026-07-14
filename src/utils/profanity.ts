import { toLowerTr } from './turkish';

// scripts/process-words.js içindeki kelime blok listesiyle aynı kökler +
// rumuzlarda geçebilecek ek varyantlar. Kök olarak arandığı için ekli/birleşik
// yazımları da yakalar (ör. "orospxyz").
const BLOCKED_ROOTS = [
  'yarak', 'amcık', 'amcik', 'göt', 'sikim', 'sikiş', 'sikis', 'sikme',
  'sikt', 'yavşa', 'yavsa', 'pezev', 'orosp', 'kaltak', 'sürtük', 'surtuk',
  'ibne', 'gavat', 'dalyar', 'amına', 'amina', 'piç', 'kahpe',
  'gerizekal', 'fuck', 'shit', 'bitch', 'nigg',
];

// Harf araya noktalama/rakam sokularak yapılan basit gizlemeleri de yakala
// ("s.i.k" gibi): harf olmayan her şeyi atıp öyle ara.
function normalize(s: string): string {
  return toLowerTr(s).replace(/[^a-zçğıöşü]/g, '');
}

/** Rumuz uygunsuz içerik barındırıyorsa true döner. */
export function isProfaneNickname(nickname: string): boolean {
  const n = normalize(nickname);
  return BLOCKED_ROOTS.some((root) => n.includes(root));
}
