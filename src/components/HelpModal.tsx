import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppModal from './AppModal';
import { useSettings } from '../context/SettingsContext';
import { LetterState } from '../utils/gameLogic';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function ExampleRow({
  word,
  highlight,
  state,
  text,
}: {
  word: string;
  highlight: number;
  state: LetterState;
  text: string;
}) {
  const { theme } = useSettings();
  return (
    <View style={styles.example}>
      <View style={styles.exampleRow}>
        {[...word].map((ch, i) => (
          <View
            key={i}
            style={[
              styles.exampleTile,
              { borderColor: theme.tileBorderFilled },
              i === highlight && {
                backgroundColor: theme.states[state],
                borderColor: theme.states[state],
              },
            ]}
          >
            <Text
              style={[
                styles.exampleLetter,
                { color: i === highlight ? theme.stateText : theme.text },
              ]}
            >
              {ch}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[styles.exampleText, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

export default function HelpModal({ visible, onClose }: Props) {
  const { theme } = useSettings();
  return (
    <AppModal visible={visible} title="Nasıl Oynanır?" onClose={onClose}>
      <ScrollView>
        <Text style={[styles.p, { color: theme.text }]}>
          Günün 5 harfli kelimesini <Text style={styles.bold}>6 denemede</Text> bul.
          Her tahminden sonra kutuların rengi, tahminine ne kadar yaklaştığını gösterir.
        </Text>
        <ExampleRow
          word="KALEM"
          highlight={0}
          state="correct"
          text="K harfi kelimede var ve doğru yerde."
        />
        <ExampleRow
          word="DENİZ"
          highlight={2}
          state="present"
          text="N harfi kelimede var ama yanlış yerde."
        />
        <ExampleRow
          word="ÇİÇEK"
          highlight={4}
          state="absent"
          text="K harfi kelimede hiç yok."
        />
        <Text style={[styles.p, { color: theme.text }]}>
          Her gün gece yarısı yeni bir kelime gelir. Herkes aynı gün aynı kelimeyi çözer —
          sonucunu arkadaşlarınla paylaşmayı unutma! 🎯
        </Text>
      </ScrollView>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  p: { fontSize: 14, lineHeight: 21, marginBottom: 14 },
  bold: { fontWeight: '700' },
  example: { marginBottom: 14 },
  exampleRow: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  exampleTile: {
    width: 38,
    height: 38,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exampleLetter: { fontWeight: '700', fontSize: 18 },
  exampleText: { fontSize: 13 },
});
