import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { LetterState } from '../utils/gameLogic';
import { toUpperTr } from '../utils/turkish';

/**
 * Türkçe-Q klavye düzeni. q/w/x, Türk alfabesinde olmadığından (bkz.
 * TURKISH_ALPHABET) hiçbir geçerli kelimede geçemez; bu yüzden klavyeden
 * tamamen çıkarıldı — hem gereksiz dokunma hedefleri ortadan kalktı hem de
 * kalan tuşlar büyüyüp yanlışlıkla komşu tuşa basma ihtimali azaldı.
 * Gönderme işlemi ayrı bir "GÖNDER" butonuyla yapılır (bkz. SubmitButton) —
 * klavye köşesindeki gizli Enter tuşu kullanıcılar tarafından fark
 * edilmediği için kaldırıldı.
 */
const ROWS: string[][] = [
  ['e', 'r', 't', 'y', 'u', 'ı', 'o', 'p', 'ğ', 'ü'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ş', 'i'],
  ['z', 'c', 'v', 'b', 'n', 'm', 'ö', 'ç', 'DEL'],
];

interface Props {
  keyStates: Record<string, LetterState>;
  onKey: (letter: string) => void;
  onDelete: () => void;
  disabled: boolean;
}

export default function Keyboard({ keyStates, onKey, onDelete, disabled }: Props) {
  const { theme } = useSettings();
  const { width } = useWindowDimensions();
  // En geniş satır 11 tuş: kenar boşlukları ve aralıklara göre tuş genişliği
  const keyWidth = (width - 12 - 10 * 4) / 11;

  const renderKey = (key: string) => {
    const isDelete = key === 'DEL';
    const state = keyStates[key];
    const bg = state ? theme.states[state] : theme.keyBg;
    const label = isDelete ? '⌫' : toUpperTr(key);

    return (
      <Pressable
        key={key}
        disabled={disabled}
        hitSlop={{ top: 4, bottom: 4 }}
        onPress={() => (isDelete ? onDelete() : onKey(key))}
        style={({ pressed }) => [
          styles.key,
          {
            width: isDelete ? keyWidth * 1.5 : keyWidth,
            backgroundColor: bg,
            opacity: pressed ? 0.6 : disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.keyText,
            { color: state ? theme.stateText : theme.keyText },
            isDelete && { fontSize: 20 },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.keyboard}>
      {ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map(renderKey)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: { paddingHorizontal: 4, gap: 6, paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  key: {
    height: 52,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 15, fontWeight: '700' },
});
