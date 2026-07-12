import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface State {
  error: Error | null;
}

/**
 * Beklenmeyen bir render hatası uygulamayı sessizce kapatmak yerine ekranda
 * gösterir — cihaz loglarına erişim olmadığı durumlarda (ör. uzaktan destek)
 * kullanıcının hatayı ekran görüntüsüyle paylaşabilmesi için.
 */
export default class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Bir şeyler ters gitti</Text>
            <Text style={styles.message}>{this.state.error.message}</Text>
            <Text style={styles.stack}>{this.state.error.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1B', paddingTop: 60 },
  content: { padding: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  message: { color: '#fff', fontSize: 14, marginBottom: 16 },
  stack: { color: '#999', fontSize: 11 },
});
