import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function SectionCard({ children, title }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161C23',
    borderColor: '#2A3541',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  title: {
    color: '#F7C873',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  body: {
    gap: 8,
  },
});
