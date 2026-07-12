import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import AppModal from './AppModal';
import { useGame } from '../context/GameContext';
import { ThemePreference, useSettings } from '../context/SettingsContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onShowHelp: () => void;
}

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistem' },
  { value: 'light', label: 'Aydınlık' },
  { value: 'dark', label: 'Karanlık' },
];

export default function SettingsModal({ visible, onClose, onShowHelp }: Props) {
  const {
    theme,
    themePreference,
    setThemePreference,
    colorBlind,
    setColorBlind,
    soundEnabled,
    setSoundEnabled,
  } = useSettings();
  const { devResetDaily, devResetStats } = useGame();

  return (
    <AppModal visible={visible} title="Ayarlar" onClose={onClose}>
      <Text style={[styles.label, { color: theme.text }]}>Tema</Text>
      <View style={styles.segment}>
        {THEME_OPTIONS.map((opt) => {
          const active = themePreference === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setThemePreference(opt.value)}
              style={[
                styles.segmentItem,
                { borderColor: theme.tileBorder },
                active && { backgroundColor: theme.accent, borderColor: theme.accent },
              ]}
            >
              <Text style={{ color: active ? '#fff' : theme.text, fontWeight: '600' }}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: theme.text }]}>Renk Körü Modu</Text>
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            Yeşil/sarı yerine turuncu/mavi kullanılır
          </Text>
        </View>
        <Switch value={colorBlind} onValueChange={setColorBlind} />
      </View>

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: theme.text }]}>Ses Efektleri</Text>
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            Tuş, kazanma ve hata sesleri
          </Text>
        </View>
        <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
      </View>

      <Pressable onPress={onShowHelp} style={[styles.helpLink, { borderColor: theme.tileBorder }]}>
        <Text style={{ color: theme.text, fontWeight: '600' }}>Nasıl Oynanır?</Text>
      </Pressable>

      {__DEV__ && (
        <View style={styles.devSection}>
          <Text style={[styles.label, { color: theme.textMuted }]}>
            Geliştirici Araçları (yalnızca dev)
          </Text>
          <Pressable
            onPress={() => {
              devResetDaily();
              onClose();
            }}
            style={[styles.devButton, { borderColor: theme.tileBorder }]}
          >
            <Text style={{ color: theme.text, fontWeight: '600' }}>
              Test: Bugünün Bulmacasını Sıfırla
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              devResetStats();
              onClose();
            }}
            style={[styles.devButton, { borderColor: theme.tileBorder }]}
          >
            <Text style={{ color: theme.text, fontWeight: '600' }}>
              Test: İstatistikleri Sıfırla
            </Text>
          </Pressable>
        </View>
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  hint: { fontSize: 12, marginTop: -4 },
  segment: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  segmentItem: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  helpLink: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  devSection: { marginTop: 20, gap: 8 },
  devButton: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
});
