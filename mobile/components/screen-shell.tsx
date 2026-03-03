import { PropsWithChildren, ReactElement } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = PropsWithChildren<{
  title: string;
  subtitle: string;
  scrollable?: boolean;
  refreshControl?: ReactElement;
}>;

export function ScreenShell({ children, title, subtitle, scrollable = true, refreshControl }: Props) {
  const content = (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        <View style={styles.scroll}>{content}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0B0F14',
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  content: {
    gap: 16,
    paddingBottom: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  header: {
    gap: 8,
    marginBottom: 4,
  },
  title: {
    color: '#F5F2EE',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#AAB4BF',
    fontSize: 15,
    lineHeight: 22,
  },
});
