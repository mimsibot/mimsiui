import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export function LoadingScreen({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color="#F7C873" size="large" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#0B0F14',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    color: '#D7D2CC',
    fontSize: 15,
  },
});
