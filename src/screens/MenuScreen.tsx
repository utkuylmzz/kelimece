import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HelpModal from '../components/HelpModal';
import SettingsModal from '../components/SettingsModal';
import { useEndlessGame } from '../context/EndlessContext';
import { useFantasyGame } from '../context/FantasyContext';
import { useGame } from '../context/GameContext';
import { GameMode, useMode } from '../context/ModeContext';
import { useSettings } from '../context/SettingsContext';
import { KEYS, loadJson, saveJson } from '../utils/storage';

interface Props {
  onPlay: () => void;
}

interface ModeCardProps {
  emoji: string;
  title: string;
  description: string;
  statLine: string | null;
  onPress: () => void;
}

function ModeCard({ emoji, title, description, statLine, onPress }: ModeCardProps) {
  const { theme } = useSettings();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.modalBg,
          borderColor: theme.tileBorder,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text style={styles.cardEmoji}>{emoji}</Text>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.cardDescription, { color: theme.textMuted }]}>{description}</Text>
        {statLine && (
          <Text style={[styles.cardStat, { color: theme.accent }]}>{statLine}</Text>
        )}
      </View>
      <Text style={[styles.cardChevron, { color: theme.textMuted }]}>›</Text>
    </Pressable>
  );
}

export default function MenuScreen({ onPlay }: Props) {
  const { theme } = useSettings();
  const { setMode } = useMode();
  const daily = useGame();
  const endless = useEndlessGame();
  const fantasy = useFantasyGame();
  const [helpVisible, setHelpVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // İlk açılışta "Nasıl Oynanır?"ı otomatik göster
  useEffect(() => {
    if (!daily.loaded) return;
    loadJson<boolean>(KEYS.helpSeen, false).then((seen) => {
      if (!seen) {
        setHelpVisible(true);
        saveJson(KEYS.helpSeen, true);
      }
    });
  }, [daily.loaded]);

  const startMode = (mode: GameMode) => {
    setMode(mode);
    onPlay();
  };

  const dailyStat =
    daily.status === 'won'
      ? 'Bugünkü bulmaca çözüldü ✓'
      : daily.status === 'lost'
        ? 'Bugünlük bitti — yarın yeni kelime'
        : daily.guesses.length > 0
          ? `Devam ediyor (${daily.guesses.length} tahmin)`
          : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.hero}>
        <Text style={[styles.title, { color: theme.text }]}>KELİMECE</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Türkçe kelime bulmaca oyunu
        </Text>
      </View>

      <View style={styles.cards}>
        <ModeCard
          emoji="📅"
          title="Günlük"
          description="Günün kelimesini herkesle aynı anda çöz"
          statLine={dailyStat}
          onPress={() => startMode('daily')}
        />
        <ModeCard
          emoji="🔁"
          title="Sürekli"
          description="Bitmeyen 5 harfli seri — en uzun seriyi yakala"
          statLine={
            endless.stats.currentStreak > 0
              ? `Güncel seri: ${endless.stats.currentStreak} 🔥`
              : endless.stats.maxStreak > 0
                ? `En uzun seri: ${endless.stats.maxStreak}`
                : null
          }
          onPress={() => startMode('endless')}
        />
        <ModeCard
          emoji="🎲"
          title="Çılgın"
          description="Her turda 5-9 harf arası sürpriz uzunlukta kelime"
          statLine={
            fantasy.stats.currentStreak > 0
              ? `Güncel seri: ${fantasy.stats.currentStreak} 🔥`
              : fantasy.stats.maxStreak > 0
                ? `En uzun seri: ${fantasy.stats.maxStreak}`
                : null
          }
          onPress={() => startMode('fantasy')}
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => setHelpVisible(true)}
          style={[styles.footerButton, { borderColor: theme.tileBorder }]}
        >
          <Text style={[styles.footerButtonText, { color: theme.text }]}>❓ Nasıl Oynanır</Text>
        </Pressable>
        <Pressable
          onPress={() => setSettingsVisible(true)}
          style={[styles.footerButton, { borderColor: theme.tileBorder }]}
        >
          <Text style={[styles.footerButtonText, { color: theme.text }]}>⚙️ Ayarlar</Text>
        </Pressable>
      </View>

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
  hero: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  title: { fontSize: 36, fontWeight: '800', letterSpacing: 4 },
  subtitle: { fontSize: 14, marginTop: 6 },
  cards: { flex: 1, paddingHorizontal: 20, gap: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  cardEmoji: { fontSize: 30 },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  cardDescription: { fontSize: 13, lineHeight: 18 },
  cardStat: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  cardChevron: { fontSize: 26, fontWeight: '300' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  footerButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerButtonText: { fontSize: 13, fontWeight: '600' },
});
