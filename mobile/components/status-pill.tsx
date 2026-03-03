import { StyleSheet, Text, View } from 'react-native';

type Tone = 'ok' | 'warning' | 'danger' | 'neutral';

const toneMap: Record<Tone, { background: string; border: string; text: string }> = {
  ok: { background: '#17332D', border: '#256354', text: '#9BF3D9' },
  warning: { background: '#3A2A16', border: '#7F5B2D', text: '#FFD38B' },
  danger: { background: '#3A1E1A', border: '#87403A', text: '#FFB6AA' },
  neutral: { background: '#1F2630', border: '#475667', text: '#CBD5E1' },
};

export function StatusPill({ text, tone = 'neutral' }: { text: string; tone?: Tone }) {
  const colors = toneMap[tone];
  return (
    <View style={[styles.pill, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
