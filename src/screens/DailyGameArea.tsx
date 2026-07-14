import React, { useEffect, useRef } from 'react';
import { useInterstitial } from '../ads/useInterstitial';
import { useGameSounds } from '../audio/useGameSounds';
import PuzzleView from '../components/PuzzleView';
import { useGame } from '../context/GameContext';
import { WORD_LENGTH, MAX_GUESSES } from '../utils/gameLogic';

const INVALID_MESSAGES = {
  tooShort: 'Yetersiz harf',
  notInList: 'Kelime listesinde yok',
} as const;

interface Props {
  onFinished: () => void;
}

export default function DailyGameArea({ onFinished }: Props) {
  const game = useGame();
  const maybeShowInterstitial = useInterstitial(game.dayIndex);
  const sounds = useGameSounds();
  const prevStatus = useRef(game.status);
  const prevInvalidReason = useRef(game.invalidReason);

  useEffect(() => {
    if (prevStatus.current === 'playing' && game.status !== 'playing') {
      if (game.status === 'won') sounds.playWin();
      else if (game.status === 'lost') sounds.playLose();
      const t = setTimeout(() => {
        onFinished();
        maybeShowInterstitial();
      }, 1200);
      prevStatus.current = game.status;
      return () => clearTimeout(t);
    }
    prevStatus.current = game.status;
  }, [game.status, maybeShowInterstitial, onFinished, sounds]);

  useEffect(() => {
    if (!game.invalidReason) {
      prevInvalidReason.current = game.invalidReason;
      return;
    }
    if (!prevInvalidReason.current) sounds.playInvalid();
    prevInvalidReason.current = game.invalidReason;
    const t = setTimeout(game.clearInvalid, 2000);
    return () => clearTimeout(t);
  }, [game.invalidReason, game.clearInvalid, sounds]);

  const message = game.invalidReason
    ? INVALID_MESSAGES[game.invalidReason]
    : game.status === 'won'
      ? 'Tebrikler! 🎉'
      : game.status === 'lost'
        ? 'Bu sefer olmadı, yarın tekrar dene!'
        : null;

  return (
    <PuzzleView
      wordLength={WORD_LENGTH}
      maxGuesses={MAX_GUESSES}
      guesses={game.guesses}
      evaluations={game.evaluations}
      activeRow={game.activeRow}
      status={game.status}
      invalid={game.invalidReason != null}
      keyStates={game.keyStates}
      loaded={game.loaded}
      message={message}
      onKey={(letter) => {
        sounds.playKey();
        game.addLetter(letter);
      }}
      onDelete={() => {
        sounds.playDelete();
        game.removeLetter();
      }}
      onSubmit={game.submitGuess}
    />
  );
}
