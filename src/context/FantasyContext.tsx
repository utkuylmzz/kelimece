import { createRoundGameContext } from './createRoundGameContext';
import { KEYS } from '../utils/storage';

const FANTASY_MIN_LENGTH = 5;
const FANTASY_MAX_LENGTH = 9;

function pickFantasyLength(): number {
  const span = FANTASY_MAX_LENGTH - FANTASY_MIN_LENGTH + 1;
  return FANTASY_MIN_LENGTH + Math.floor(Math.random() * span);
}

const { Provider: FantasyProvider, useRoundGame: useFantasyGame } = createRoundGameContext({
  storageKeys: { round: KEYS.fantasyRound, stats: KEYS.fantasyStats },
  pickWordLength: pickFantasyLength,
});

export { FantasyProvider, useFantasyGame };
