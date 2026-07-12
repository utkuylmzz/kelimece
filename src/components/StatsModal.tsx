import React from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import AppModal from './AppModal';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { getWordForDayIndex } from '../utils/gameLogic';
import { buildShareText } from '../utils/share';
import { toUpperTr } from '../utils/turkish';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function StatBox({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function StatsModal({ visible, onClose }: Props) {
  const { stats, status, evaluations, dayIndex } = useGame();
  const { theme, colorBlind } = useSettings();
  const yesterdayWord = dayIndex > 0 ? getWordForDayIndex(dayIndex - 1) : null;
  const winPct =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;
  const maxDist = Math.max(1, ...stats.distribution);
  const finished = status !== 'playing';

  const onShare = async () => {
    const text = buildShareText(dayIndex, evaluations, status === 'won', colorBlind);
    try {
      await Share.share({ message: text });
    } catch {
      // kullanıcı paylaşımı iptal etti
    }
  };

  return (
    <AppModal visible={visible} title="İstatistikler" onClose={onClose}>
      <View style={styles.statsRow}>
        <StatBox value={String(stats.gamesPlayed)} label="Oyun" color={theme.text} />
        <StatBox value={`%${winPct}`} label="Kazanma" color={theme.text} />
        <StatBox value={String(stats.currentStreak)} label="Seri" color={theme.text} />
        <StatBox value={String(stats.maxStreak)} label="En Uzun Seri" color={theme.text} />
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Tahmin Dağılımı</Text>
      {stats.distribution.map((count, i) => (
        <View key={i} style={styles.distRow}>
          <Text style={[styles.distLabel, { color: theme.text }]}>{i + 1}</Text>
          <View style={styles.distBarTrack}>
            <View
              style={[
                styles.distBar,
                {
                  backgroundColor: count > 0 ? theme.states.correct : theme.textMuted,
                  width: `${Math.max(8, (count / maxDist) * 100)}%`,
                },
              ]}
            >
              <Text style={styles.distCount}>{count}</Text>
            </View>
          </View>
        </View>
      ))}

      {finished && (
        <>
          {status === 'lost' && (
            <Text style={[styles.answerReveal, { color: theme.textMuted }]}>
              Bugünün kelimesi yarın burada görünecek
            </Text>
          )}
          <Pressable
            onPress={onShare}
            style={[styles.shareButton, { backgroundColor: theme.states.correct }]}
          >
            <Text style={styles.shareText}>PAYLAŞ 📤</Text>
          </Pressable>
        </>
      )}

      {yesterdayWord && (
        <Text style={[styles.yesterdayWord, { color: theme.textMuted }]}>
          Dünün kelimesi:{' '}
          <Text style={{ fontWeight: '700', color: theme.text }}>
            {toUpperTr(yesterdayWord)}
          </Text>
        </Text>
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18 },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 11, textAlign: 'center' },
  sectionTitle: { fontWeight: '700', marginBottom: 8, fontSize: 14 },
  distRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  distLabel: { width: 14, fontWeight: '600' },
  distBarTrack: { flex: 1 },
  distBar: {
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'flex-end',
    minWidth: 24,
  },
  distCount: { color: '#fff', fontWeight: '700', fontSize: 12 },
  answerReveal: { textAlign: 'center', marginTop: 14, fontSize: 14 },
  yesterdayWord: { textAlign: 'center', marginTop: 16, fontSize: 13 },
  shareButton: {
    marginTop: 14,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
