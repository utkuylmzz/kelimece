import { createRoundGameContext } from './createRoundGameContext';
import { KEYS } from '../utils/storage';
import { WORD_LENGTH } from '../utils/gameLogic';

const { Provider: EndlessProvider, useRoundGame: useEndlessGame } = createRoundGameContext({
  storageKeys: { round: KEYS.endlessRound, stats: KEYS.endlessStats },
  pickWordLength: () => WORD_LENGTH,
});

export { EndlessProvider, useEndlessGame };
