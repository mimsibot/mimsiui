import { StyleSheet, Text, View } from 'react-native';

export function MetricCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={[styles.card, { borderColor: accent }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161C23',
    borderRadius: 22,
    borderWidth: 1,
    flexGrow: 1,
    gap: 8,
    minWidth: 150,
    padding: 18,
  },
  label: {
    color: '#8D9AA8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  value: {
    color: '#F5F2EE',
    fontSize: 28,
    fontWeight: '800',
  },
});
