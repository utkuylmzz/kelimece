import { LetterState } from '../utils/gameLogic';

export interface Theme {
  background: string;
  text: string;
  textMuted: string;
  tileBorder: string;
  tileBorderFilled: string;
  keyBg: string;
  keyText: string;
  modalBg: string;
  overlay: string;
  accent: string;
  /** Değerlendirme renkleri: correct / present / absent */
  states: Record<LetterState, string>;
  stateText: string;
}

/**
 * Kelimece'nin özgün renk kimliği: sıcak/toprak tonlu nötrler + zümrüt yeşili /
 * amber ikilisi. Bilinçli olarak NYT Wordle'ın soğuk gri paletinden ve
 * sarı-yeşil/haki tonlarından ayrışacak şekilde seçildi (bkz. proje notları).
 */
const normalStates = {
  light: { correct: '#1F8A70', present: '#D98E2B', absent: '#A69A87' },
  dark: { correct: '#22A480', present: '#C97F1E', absent: '#5C5346' },
};

/**
 * Renk körü paleti: turuncu/mavi ikilisi (Okabe-Ito bilimsel renk körü paleti —
 * NYT'ye özgü değil, deuteranopi/protanopide yaygın kullanılan genel bir
 * standart). Tonlar Kelimece'nin sıcak kimliğine göre ayarlandı.
 */
const colorBlindStates = {
  light: { correct: '#E0762E', present: '#3E86C4', absent: '#A69A87' },
  dark: { correct: '#E68A47', present: '#5B9BD8', absent: '#5C5346' },
};

export function getTheme(dark: boolean, colorBlind: boolean): Theme {
  const mode = dark ? 'dark' : 'light';
  return {
    background: dark ? '#171512' : '#FAF7F2',
    text: dark ? '#F5EFE6' : '#2B2620',
    textMuted: dark ? '#9C8F7C' : '#8A8074',
    tileBorder: dark ? '#3D372E' : '#D8CFC0',
    tileBorderFilled: dark ? '#5C5346' : '#A69A87',
    keyBg: dark ? '#4A4438' : '#E4DCCE',
    keyText: dark ? '#F5EFE6' : '#2B2620',
    modalBg: dark ? '#211E19' : '#FFFFFF',
    overlay: 'rgba(20,16,10,0.6)',
    accent: dark ? '#22A480' : '#1F8A70',
    states: colorBlind ? colorBlindStates[mode] : normalStates[mode],
    stateText: '#FFFFFF',
  };
}
