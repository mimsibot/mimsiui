import { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { SectionCard } from '@/components/section-card';
import { StatusPill } from '@/components/status-pill';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ServiceState } from '@/lib/types';

export default function ServicesScreen() {
  const { session } = useAuth();
  const [services, setServices] = useState<ServiceState[]>([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!session) {
      return;
    }
    setRefreshing(true);
    setError('');
    try {
      setServices(await api.fetchServices(session.accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [session?.accessToken]);

  return (
    <ScreenShell
      title="Runtime services"
      subtitle="Read-only health of the host services that keep the bot alive."
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#F7C873" />}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {services.map((service) => (
        <SectionCard key={service.name} title={service.name}>
          <View style={styles.row}>
            <StatusPill tone={service.state === 'active' ? 'ok' : service.state === 'failed' ? 'danger' : 'warning'} text={service.state} />
            <Text style={styles.meta}>systemd</Text>
          </View>
        </SectionCard>
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    color: '#8D9AA8',
    fontSize: 13,
  },
  error: {
    color: '#FF9B89',
    fontSize: 14,
  },
});
