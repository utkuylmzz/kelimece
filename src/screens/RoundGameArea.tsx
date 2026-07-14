import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRoundInterstitial } from '../ads/useRoundInterstitial';
import { useGameSounds } from '../audio/useGameSounds';
import PuzzleView from '../components/PuzzleView';
import { useSettings } from '../context/SettingsContext';
import { RoundGameContextValue } from '../context/createRoundGameContext';
import { toUpperTr } from '../utils/turkish';

const INVALID_MESSAGES = {
  tooShort: 'Yetersiz harf',
  notInList: 'Kelime listesinde yok',
} as const;

interface Props {
  game: RoundGameContextValue;
  interstitialStorageKey: string;
  onFinished: () => void;
  /** Sürekli mod: seri rozeti + oturum başına 1 ipucu hakkı + kayıpta
   * "seri bitti / yeniden başla" akışı. Çılgın modda kapalı. */
  session?: boolean;
}

/** Sürekli ve Çılgın modları aynı tur-bazlı davranışı paylaşır; farkları
 * (kelime uzunluğu, depolama anahtarı, oturum özellikleri) çağırandan gelir. */
export default function RoundGameArea({ game, interstitialStorageKey, onFinished, session }: Props) {
  const { theme } = useSettings();
  const maybeShowInterstitial = useRoundInterstitial(game.stats.roundsPlayed, interstitialStorageKey);
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

  const lostMessage = session
    ? `Cevap: ${toUpperTr(game.answer)} — seri sona erdi!`
    : `Cevap: ${toUpperTr(game.answer)} — devam edelim!`;

  const message = game.invalidReason
    ? INVALID_MESSAGES[game.invalidReason]
    : game.status === 'won'
      ? 'Tebrikler! 🎉'
      : game.status === 'lost'
        ? lostMessage
        : null;

  const hintDisabled = game.sessionHintUsed || game.status !== 'playing';

  return (
    <>
      {session && (
        <View style={styles.sessionBar}>
          <Text style={[styles.streak, { color: theme.text }]}>
            🔥 Seri: {game.stats.currentStreak}
          </Text>
          <Pressable
            onPress={game.revealSessionHint}
            disabled={hintDisabled}
            hitSlop={6}
            style={[
              styles.hintButton,
              { borderColor: theme.tileBorder, opacity: hintDisabled ? 0.4 : 1 },
            ]}
          >
            <Text style={[styles.hintButtonText, { color: theme.text }]}>
              💡 İpucu {game.sessionHintUsed ? '(kullanıldı)' : '(1)'}
            </Text>
          </Pressable>
        </View>
      )}

      <PuzzleView
        // Her turda değişen key ile ızgara/klavye temiz remount edilir — takılı
        // kalmış bir LayoutAnimation durumu yeni tura taşınamaz (menüye çıkıp
        // girmenin düzelttiği donma hatasının kalıcı çözümü).
        key={`${game.wordLength}-${game.answer}`}
        wordLength={game.wordLength}
        maxGuesses={game.maxGuesses}
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
        onNext={game.nextRound}
        nextLabel={session && game.status === 'lost' ? 'YENİDEN BAŞLA' : 'SONRAKİ KELİME'}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sessionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  streak: { fontSize: 15, fontWeight: '800' },
  hintButton: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hintButtonText: { fontSize: 13, fontWeight: '600' },
});
