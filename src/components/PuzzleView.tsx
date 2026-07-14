import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GuessGrid from './GuessGrid';
import Keyboard from './Keyboard';
import SubmitButton from './SubmitButton';
import { useSettings } from '../context/SettingsContext';
import { ActiveCell, GameStatus, GuessEvaluation, LetterState } from '../utils/gameLogic';

interface Props {
  wordLength: number;
  maxGuesses: number;
  guesses: string[];
  evaluations: GuessEvaluation[];
  activeRow: ActiveCell[];
  status: GameStatus;
  invalid: boolean;
  keyStates: Record<string, LetterState>;
  loaded: boolean;
  message: string | null;
  onKey: (letter: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  /** Verilirse tur bitince buton bunu çağırır (Sürekli/Çılgın). */
  onNext?: () => void;
  /** Tur bitince görünen butonun etiketi (varsayılan: SONRAKİ KELİME) */
  nextLabel?: string;
}

export default function PuzzleView({
  wordLength,
  maxGuesses,
  guesses,
  evaluations,
  activeRow,
  status,
  invalid,
  keyStates,
  loaded,
  message,
  onKey,
  onDelete,
  onSubmit,
  onNext,
  nextLabel = 'SONRAKİ KELİME',
}: Props) {
  const { theme } = useSettings();
  const finished = status !== 'playing';
  const showNext = finished && !!onNext;
  const rowComplete = activeRow.length > 0 && activeRow.every((c) => c.letter !== '');

  return (
    <>
      <View style={styles.messageArea}>
        {message && (
          <View style={[styles.messageBubble, { backgroundColor: theme.text }]}>
            <Text style={[styles.messageText, { color: theme.background }]}>{message}</Text>
          </View>
        )}
      </View>

      <View style={styles.gridArea}>
        <GuessGrid
          guesses={guesses}
          evaluations={evaluations}
          activeRow={activeRow}
          invalid={invalid}
          showActiveRow={status === 'playing'}
          wordLength={wordLength}
          maxGuesses={maxGuesses}
        />
      </View>

      <SubmitButton
        label={showNext ? nextLabel : 'GÖNDER'}
        onPress={showNext ? onNext! : onSubmit}
        disabled={showNext ? !loaded : finished || !loaded || !rowComplete}
      />

      <Keyboard
        keyStates={keyStates}
        onKey={onKey}
        onDelete={onDelete}
        disabled={finished || !loaded}
      />
    </>
  );
}

const styles = StyleSheet.create({
  messageArea: { height: 44, alignItems: 'center', justifyContent: 'center' },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  messageText: { fontWeight: '700', fontSize: 13 },
  gridArea: { flex: 1, justifyContent: 'center' },
});
