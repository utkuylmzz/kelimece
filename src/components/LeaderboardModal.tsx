import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import AppModal from './AppModal';
import { useEndlessGame } from '../context/EndlessContext';
import { useSettings } from '../context/SettingsContext';
import {
  claimNickname,
  fetchTopStreaks,
  getCurrentUserId,
  getNickname,
  LeaderboardRow,
  setNickname as saveNickname,
} from '../utils/leaderboard';
import { isProfaneNickname } from '../utils/profanity';
import { supabaseAvailable } from '../utils/supabase';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LeaderboardModal({ visible, onClose }: Props) {
  const { theme } = useSettings();
  const { stats } = useEndlessGame();
  const [nickname, setNicknameState] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    getNickname().then((n) => {
      setNicknameState(n);
      setNicknameInput(n ?? '');
    });
  }, [visible]);

  const load = async () => {
    setLoading(true);
    const [top, uid] = await Promise.all([fetchTopStreaks(50), getCurrentUserId()]);
    setRows(top);
    setUserId(uid);
    setLoading(false);
  };

  useEffect(() => {
    if (visible && nickname) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, nickname]);

  const onSaveNickname = async () => {
    const trimmed = nicknameInput.trim();
    if (trimmed.length < 2 || trimmed.length > 20) return;
    if (isProfaneNickname(trimmed)) {
      setNicknameError('Bu rumuz kullanılamaz, başka bir tane dene');
      return;
    }
    setNicknameError(null);
    setLoading(true);
    const result = await claimNickname(trimmed, stats.currentStreak);
    setLoading(false);
    if (result === 'taken') {
      setNicknameError('Bu rumuz zaten alınmış, başka bir tane dene');
      return;
    }
    if (result === 'error') {
      setNicknameError('Kaydedilemedi — bağlantını kontrol edip tekrar dene');
      return;
    }
    await saveNickname(trimmed);
    setNicknameState(trimmed);
    load();
  };

  return (
    <AppModal visible={visible} title="Sürekli Mod Sıralaması 🏆" onClose={onClose}>
      {!supabaseAvailable ? (
        <Text style={[styles.info, { color: theme.textMuted }]}>
          Sıralama şu an kullanılamıyor.
        </Text>
      ) : !nickname ? (
        <View>
          <Text style={[styles.info, { color: theme.text }]}>
            Sıralamada görünmek için bir rumuz seç (2-20 karakter):
          </Text>
          <TextInput
            value={nicknameInput}
            onChangeText={(t) => {
              setNicknameInput(t);
              setNicknameError(null);
            }}
            placeholder="Rumuz"
            placeholderTextColor={theme.textMuted}
            maxLength={20}
            style={[styles.input, { borderColor: theme.tileBorder, color: theme.text }]}
          />
          {nicknameError && (
            <Text style={styles.nicknameError}>{nicknameError}</Text>
          )}
          <Pressable
            onPress={onSaveNickname}
            disabled={nicknameInput.trim().length < 2}
            style={[
              styles.saveButton,
              { backgroundColor: theme.accent, opacity: nicknameInput.trim().length < 2 ? 0.4 : 1 },
            ]}
          >
            <Text style={styles.saveButtonText}>KAYDET</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <ActivityIndicator color={theme.accent} />
      ) : rows.length === 0 ? (
        <Text style={[styles.info, { color: theme.textMuted }]}>
          Henüz sıralamada kimse yok. İlk sen ol!
        </Text>
      ) : (
        rows.map((row, i) => {
          const isMe = row.userId === userId;
          return (
            <View
              key={row.userId}
              style={[
                styles.row,
                { borderBottomColor: theme.tileBorder },
                isMe && { backgroundColor: theme.tileBorder },
              ]}
            >
              <Text style={[styles.rank, { color: theme.textMuted }]}>{i + 1}</Text>
              <Text style={[styles.nickname, { color: theme.text }]} numberOfLines={1}>
                {row.nickname}
                {isMe ? ' (sen)' : ''}
              </Text>
              <Text style={[styles.streak, { color: theme.states.correct }]}>
                {row.bestStreak}
              </Text>
            </View>
          );
        })
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  info: { fontSize: 14, lineHeight: 20, marginBottom: 12, textAlign: 'center' },
  input: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  nicknameError: { color: '#D32F2F', fontSize: 12, marginTop: -6, marginBottom: 10 },
  saveButton: { borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    gap: 10,
    borderRadius: 4,
  },
  rank: { width: 26, fontWeight: '700', fontSize: 13 },
  nickname: { flex: 1, fontSize: 14, fontWeight: '600' },
  streak: { fontWeight: '800', fontSize: 15 },
});
