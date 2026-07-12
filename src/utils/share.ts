import { GuessEvaluation } from './gameLogic';

const EMOJI: Record<string, { normal: string; colorBlind: string }> = {
  correct: { normal: '🟩', colorBlind: '🟧' },
  present: { normal: '🟨', colorBlind: '🟦' },
  absent: { normal: '⬛', colorBlind: '⬛' },
};

/**
 * Sonucu kelimeyi ele vermeden emoji ızgarası olarak üretir.
 * Örnek: "Kelimece #190 4/6" + satır başına 5 emoji.
 */
export function buildShareText(
  dayIndex: number,
  evaluations: GuessEvaluation[],
  won: boolean,
  colorBlind: boolean
): string {
  const attempts = won ? String(evaluations.length) : 'X';
  const grid = evaluations
    .map((row) =>
      row.map((s) => (colorBlind ? EMOJI[s].colorBlind : EMOJI[s].normal)).join('')
    )
    .join('\n');
  return `Kelimece #${dayIndex + 1} ${attempts}/6\n\n${grid}`;
}
