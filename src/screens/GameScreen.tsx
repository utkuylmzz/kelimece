import React, { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdBanner from '../ads/AdBanner';
import HelpModal from '../components/HelpModal';
import LeaderboardModal from '../components/LeaderboardModal';
import LeaderboardSync from '../components/LeaderboardSync';
import SettingsModal from '../components/SettingsModal';
import StatsModal from '../components/StatsModal';
import { useEndlessGame } from '../context/EndlessContext';
import { useFantasyGame } from '../context/FantasyContext';
import { GameMode, useMode } from '../context/ModeContext';
import { useSettings } from '../context/SettingsContext';
import { KEYS } from '../utils/storage';
import DailyGameArea from './DailyGameArea';
import RoundGameArea from './RoundGameArea';

const MODE_TITLES: Record<GameMode, string> = {
  daily: 'GÜNLÜK',
  endless: 'SÜREKLİ',
  fantasy: 'ÇILGIN',
};

interface Props {
  onBack: () => void;
}

export default function GameScreen({ onBack }: Props) {
  const { mode } = useMode();
  const { theme } = useSettings();
  const endlessGame = useEndlessGame();
  const fantasyGame = useFantasyGame();
  const [statsVisible, setStatsVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);

  // Android donanım geri tuşu: uygulamadan çıkmak yerine menüye dön
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.tileBorder }]}>
        <Pressable onPress={onBack} hitSlop={8}>
          <Text style={[styles.backArrow, { color: theme.textMuted }]}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{MODE_TITLES[mode]}</Text>
        <View style={styles.headerRight}>
          {mode === 'endless' && (
            <Pressable onPress={() => setLeaderboardVisible(true)} hitSlop={8}>
              <Text style={[styles.headerIcon, { color: theme.textMuted }]}>🏆</Text>
            </Pressable>
          )}
          <Pressable onPress={() => setStatsVisible(true)} hitSlop={8}>
            <Text style={[styles.headerIcon, { color: theme.textMuted }]}>📊</Text>
          </Pressable>
          <Pressable onPress={() => setSettingsVisible(true)} hitSlop={8}>
            <Text style={[styles.headerIcon, { color: theme.textMuted }]}>⚙️</Text>
          </Pressable>
        </View>
      </View>

      <LeaderboardSync />

      {mode === 'daily' && <DailyGameArea onFinished={() => setStatsVisible(true)} />}
      {mode === 'endless' && (
        <RoundGameArea
          game={endlessGame}
          interstitialStorageKey={KEYS.endlessInterstitialRound}
          onFinished={() => setStatsVisible(true)}
          session
        />
      )}
      {mode === 'fantasy' && (
        <RoundGameArea
          game={fantasyGame}
          interstitialStorageKey={KEYS.fantasyInterstitialRound}
          onFinished={() => setStatsVisible(true)}
        />
      )}

      <AdBanner />

      <StatsModal mode={mode} visible={statsVisible} onClose={() => setStatsVisible(false)} />
      <LeaderboardModal visible={leaderboardVisible} onClose={() => setLeaderboardVisible(false)} />
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
  title: { fontSize: 20, fontWeight: '800', letterSpacing: 2 },
  backArrow: { fontSize: 24, fontWeight: '600' },
  headerIcon: { fontSize: 20 },
  headerRight: { flexDirection: 'row', gap: 14 },
});
