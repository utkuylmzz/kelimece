import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdBanner from '../ads/AdBanner';
import { useInterstitial } from '../ads/useInterstitial';
import { useGameSounds } from '../audio/useGameSounds';
import GuessGrid from '../components/GuessGrid';
import HelpModal from '../components/HelpModal';
import Keyboard from '../components/Keyboard';
import SettingsModal from '../components/SettingsModal';
import StatsModal from '../components/StatsModal';
import SubmitButton from '../components/SubmitButton';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { WORD_LENGTH } from '../utils/gameLogic';
import { KEYS, loadJson, saveJson } from '../utils/storage';

const INVALID_MESSAGES = {
  tooShort: 'Yetersiz harf',
  notInList: 'Kelime listesinde yok',
} as const;

export default function GameScreen() {
  const game = useGame();
  const { theme } = useSettings();
  const [statsVisible, setStatsVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const maybeShowInterstitial = useInterstitial(game.dayIndex);
  const sounds = useGameSounds();
  const prevStatus = useRef(game.status);
  const prevInvalidReason = useRef(game.invalidReason);

  // İlk açılışta "Nasıl Oynanır?"ı otomatik göster
  useEffect(() => {
    if (!game.loaded) return;
    loadJson<boolean>(KEYS.helpSeen, false).then((seen) => {
      if (!seen) {
        setHelpVisible(true);
        saveJson(KEYS.helpSeen, true);
      }
    });
  }, [game.loaded]);

  // Oyun bittiğinde: ses + kısa gecikmeyle istatistik modalı + günde bir kez geçiş reklamı
  useEffect(() => {
    if (prevStatus.current === 'playing' && game.status !== 'playing') {
      if (game.status === 'won') sounds.playWin();
      else if (game.status === 'lost') sounds.playLose();
      const t = setTimeout(() => {
        setStatsVisible(true);
        maybeShowInterstitial();
      }, 1200);
      prevStatus.current = game.status;
      return () => clearTimeout(t);
    }
    prevStatus.current = game.status;
  }, [game.status, maybeShowInterstitial, sounds]);

  // Geçersiz tahmin: ses çal + birkaç saniye sonra otomatik temizle
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.tileBorder }]}>
        <Pressable onPress={() => setHelpVisible(true)} hitSlop={8}>
          <Text style={[styles.headerIcon, { color: theme.textMuted }]}>❓</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>KELİMECE</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={() => setStatsVisible(true)} hitSlop={8}>
            <Text style={[styles.headerIcon, { color: theme.textMuted }]}>📊</Text>
          </Pressable>
          <Pressable onPress={() => setSettingsVisible(true)} hitSlop={8}>
            <Text style={[styles.headerIcon, { color: theme.textMuted }]}>⚙️</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.messageArea}>
        {message && (
          <View style={[styles.messageBubble, { backgroundColor: theme.text }]}>
            <Text style={[styles.messageText, { color: theme.background }]}>
              {message}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.gridArea}>
        <GuessGrid
          guesses={game.guesses}
          evaluations={game.evaluations}
          currentGuess={game.currentGuess}
          invalid={game.invalidReason != null}
          showActiveRow={game.status === 'playing'}
        />
      </View>

      <SubmitButton
        onPress={game.submitGuess}
        disabled={
          game.status !== 'playing' ||
          !game.loaded ||
          game.currentGuess.length < WORD_LENGTH
        }
      />

      <Keyboard
        keyStates={game.keyStates}
        onKey={(letter) => {
          sounds.playKey();
          game.addLetter(letter);
        }}
        onDelete={() => {
          sounds.playDelete();
          game.removeLetter();
        }}
        disabled={game.status !== 'playing' || !game.loaded}
      />

      <AdBanner />

      <StatsModal visible={statsVisible} onClose={() => setStatsVisible(false)} />
      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onShowHelp={() => {
          setSettingsVisible(false);
          setHelpVisible(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  headerIcon: { fontSize: 20 },
  headerRight: { flexDirection: 'row', gap: 14 },
  messageArea: { height: 44, alignItems: 'center', justifyContent: 'center' },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  messageText: { fontWeight: '700', fontSize: 13 },
  gridArea: { flex: 1, justifyContent: 'center' },
});
