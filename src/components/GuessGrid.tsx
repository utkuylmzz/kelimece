import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  UIManager,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { ActiveCell, GuessEvaluation, MAX_GUESSES, WORD_LENGTH } from '../utils/gameLogic';
import { toUpperTr } from '../utils/turkish';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  guesses: string[];
  evaluations: GuessEvaluation[];
  /** Aktif satır hücreleri; kilitli olanlar (ipucu/yeşil) önceden dolu gelir */
  activeRow: ActiveCell[];
  /** true ise aktif satır "geçersiz kelime" görünümüyle vurgulanır */
  invalid: boolean;
  /** true iken tamamlanan satırların altına aktif + önizleme satırı eklenir */
  showActiveRow: boolean;
  /** Varsayılan: gameLogic.WORD_LENGTH (Günlük/Sürekli mod, 5 harf) */
  wordLength?: number;
  /** Varsayılan: gameLogic.MAX_GUESSES (Günlük/Sürekli mod, 6 hak) */
  maxGuesses?: number;
}

type RowRole = 'history' | 'active' | 'preview';

export default function GuessGrid({
  guesses,
  evaluations,
  activeRow,
  invalid,
  showActiveRow,
  wordLength = WORD_LENGTH,
  maxGuesses = MAX_GUESSES,
}: Props) {
  const { theme } = useSettings();
  const { width } = useWindowDimensions();
  const baseSize = Math.min(62, (width - 40 - (wordLength - 1) * 6) / wordLength);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Geçersiz tahmin (kısa veya sözlükte olmayan kelime): aktif satırı silkeleyerek
  // reddedildiğini belirgin biçimde göster — küçük bir mesaj baloncuğu tek başına
  // kolayca gözden kaçabiliyordu.
  useEffect(() => {
    if (!invalid) return;
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [invalid, shakeAnim]);

  // Satır boyutu geçişleri (tamamlanan satır küçülüp yukarı kayar, önizleme
  // satırı büyüyüp aktif hale gelir) GameContext.submitGuess içinde tetiklenen
  // LayoutAnimation ile animasyonlu olur — bkz. GameContext.tsx.

  // Geçmiş (tamamlanmış) satırlar küçük gösterilir, aktif satır büyük ve net,
  // bir sonraki hakkın önizlemesi küçük ve soluk şekilde altta bekler.
  const totalRows = Math.min(maxGuesses, guesses.length + (showActiveRow ? 2 : 0));

  const rows = [];
  for (let r = 0; r < totalRows; r++) {
    const role: RowRole =
      r < guesses.length ? 'history' : r === guesses.length ? 'active' : 'preview';
    const isActive = role === 'active';

    const tileSize = role === 'history' ? baseSize * 0.6 : role === 'preview' ? baseSize * 0.55 : baseSize;
    const rowOpacity = role === 'preview' ? 0.35 : 1;

    const word = role === 'history' ? guesses[r] : '';
    const evalRow = role === 'history' ? evaluations[r] : null;

    const tiles = [];
    for (let c = 0; c < wordLength; c++) {
      const activeCell = role === 'active' ? activeRow[c] : null;
      const letter = role === 'history' ? (word[c] ?? '') : (activeCell?.letter ?? '');
      const isLockedCell = activeCell?.locked ?? false;
      const state = evalRow ? evalRow[c] : null;
      tiles.push(
        <View
          key={c}
          style={[
            styles.tile,
            { width: tileSize, height: tileSize, borderColor: theme.tileBorder },
            letter !== '' && !state && { borderColor: theme.tileBorderFilled },
            // Kilitli (önceden açılmış) hücre: hafif vurgulu çerçeveyle "verili"
            // olduğu belli olur, kullanıcı buraya yazamaz/silemez.
            isLockedCell && { borderColor: theme.accent },
            isActive && invalid && { borderColor: '#D32F2F' },
            state != null && {
              backgroundColor: theme.states[state],
              borderColor: theme.states[state],
            },
          ]}
        >
          <Text
            style={[
              styles.letter,
              { fontSize: tileSize * 0.5 },
              { color: state ? theme.stateText : isLockedCell ? theme.accent : theme.text },
            ]}
          >
            {toUpperTr(letter)}
          </Text>
        </View>
      );
    }

    // Her satır aynı bileşen tipinde (Animated.View) kalır ki rol değişiminde
    // (history/active/preview arası) React satırı yeniden kurmak yerine yerinde
    // güncellesin — LayoutAnimation geçişinin akıcı olması buna bağlı.
    rows.push(
      <Animated.View
        key={r}
        style={[
          styles.row,
          { opacity: rowOpacity },
          { transform: [{ translateX: isActive ? shakeAnim : 0 }] },
        ]}
      >
        {tiles}
      </Animated.View>
    );
  }

  return <View style={styles.grid}>{rows}</View>;
}

const styles = StyleSheet.create({
  grid: { alignItems: 'center', gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  tile: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  letter: { fontWeight: '700' },
});
