import { useCallback, useMemo } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { useSettings } from '../context/SettingsContext';

const SOURCES = {
  key: require('../../assets/sounds/key.mp3'),
  delete: require('../../assets/sounds/delete.mp3'),
  invalid: require('../../assets/sounds/invalid.mp3'),
  win: require('../../assets/sounds/win.mp3'),
  lose: require('../../assets/sounds/lose.mp3'),
};

/** Oyun ses efektleri. Ayarlardan kapatılırsa sessizce no-op olur. */
export function useGameSounds() {
  const { soundEnabled } = useSettings();
  const keyPlayer = useAudioPlayer(SOURCES.key);
  const deletePlayer = useAudioPlayer(SOURCES.delete);
  const invalidPlayer = useAudioPlayer(SOURCES.invalid);
  const winPlayer = useAudioPlayer(SOURCES.win);
  const losePlayer = useAudioPlayer(SOURCES.lose);

  const play = useCallback(
    (player: ReturnType<typeof useAudioPlayer>) => {
      if (!soundEnabled) return;
      player.seekTo(0);
      player.play();
    },
    [soundEnabled]
  );

  return useMemo(
    () => ({
      playKey: () => play(keyPlayer),
      playDelete: () => play(deletePlayer),
      playInvalid: () => play(invalidPlayer),
      playWin: () => play(winPlayer),
      playLose: () => play(losePlayer),
    }),
    [play, keyPlayer, deletePlayer, invalidPlayer, winPlayer, losePlayer]
  );
}
