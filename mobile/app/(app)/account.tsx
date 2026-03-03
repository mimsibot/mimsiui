import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function AccountScreen() {
  const { config, session, signOut } = useAuth();
  const [subject, setSubject] = useState('-');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!session) {
        return;
      }
      try {
        const me = await api.fetchMe(session.accessToken);
        if (!cancelled) {
          setSubject(me.subject || '-');
        }
      } catch {
        if (!cancelled) {
          setSubject('Unable to resolve current subject');
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

  return (
    <ScreenShell
      title="Account"
      subtitle="Current identity, API base and scope gate used to reach mimsibot through FastAPI."
      scrollable={false}>
      <SectionCard title="Session">
        <Text style={styles.line}>Subject: {subject}</Text>
        <Text style={styles.line}>Scope: {session?.scope || config.requiredScope}</Text>
        <Text style={styles.line}>Issuer: {config.oidcIssuer || '-'}</Text>
        <Text style={styles.line}>Audience: {config.oidcAudience || '-'}</Text>
      </SectionCard>

      <SectionCard title="Bridge">
        <Text style={styles.line}>API base: {config.apiBaseUrl}</Text>
        <Text style={styles.line}>Pattern: React Native -> FastAPI -> mimsibot</Text>
      </SectionCard>

      <Pressable onPress={signOut} style={styles.button}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  line: {
    color: '#F5F2EE',
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#24303B',
    borderColor: '#394654',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#F5F2EE',
    fontSize: 15,
    fontWeight: '700',
  },
});
