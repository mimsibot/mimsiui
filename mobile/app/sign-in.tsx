import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { useAuth } from '@/lib/auth';

export default function SignInScreen() {
  const { authError, authReady, config, isAuthenticating, signIn } = useAuth();

  return (
    <ScreenShell
      title="mimsiui"
      subtitle="Strong-auth gateway into mimsibot. The app talks to FastAPI, FastAPI talks to the bot."
      scrollable={false}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Android-first control plane</Text>
        <Text style={styles.copy}>
          Login uses OAuth 2.0 Authorization Code with PKCE. The API only serves protected routes after JWT
          verification against your OIDC issuer.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>API</Text>
        <Text style={styles.value}>{config.apiBaseUrl}</Text>
        <Text style={styles.label}>OIDC issuer</Text>
        <Text style={styles.value}>{config.oidcIssuer || 'Not configured yet'}</Text>
        {authError ? <Text style={styles.error}>{authError}</Text> : null}
        <Pressable disabled={!authReady || isAuthenticating} onPress={signIn} style={styles.button}>
          <Text style={styles.buttonText}>
            {isAuthenticating ? 'Authenticating...' : authReady ? 'Sign in with OAuth 2.0' : 'OIDC not configured'}
          </Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 12,
  },
  kicker: {
    color: '#F7C873',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  copy: {
    color: '#D7D2CC',
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#1E2630',
    borderColor: '#394654',
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    marginTop: 20,
    padding: 20,
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
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    color: '#FF9B89',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#D47C4A',
    borderRadius: 18,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  buttonText: {
    color: '#160F0D',
    fontSize: 16,
    fontWeight: '800',
  },
});
