import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSettings } from '../context/SettingsContext';

interface Props {
  onPress: () => void;
  disabled: boolean;
}

/** Ekranda ayrı, belirgin gönder butonu — klavyedeki gizli Enter tuşu yerine. */
export default function SubmitButton({ onPress, disabled }: Props) {
  const { theme } = useSettings();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.accent,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text style={styles.text}>GÖNDER</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
});
