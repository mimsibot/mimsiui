import { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { MetricCard } from '@/components/metric-card';
import { ScreenShell } from '@/components/screen-shell';
import { SectionCard } from '@/components/section-card';
import { StatusPill } from '@/components/status-pill';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { OverviewResponse } from '@/lib/types';

export default function OverviewScreen() {
  const { session } = useAuth();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!session) {
      return;
    }
    setRefreshing(true);
    setError('');
    try {
      setData(await api.fetchOverview(session.accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overview');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [session?.accessToken]);

  const taskCount = Object.values(data?.tasks ?? {}).reduce((acc, value) => acc + value, 0);
  const degradedCount = data?.degraded_templates.length ?? 0;
  const hookCount = data?.latest_hooks.length ?? 0;

  return (
    <ScreenShell
      title="System overview"
      subtitle="State of the bot, queue pressure, services and degraded templates."
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#F7C873" />}>
      <View style={styles.grid}>
        <MetricCard label="Tasks tracked" value={String(taskCount)} accent="#F7C873" />
        <MetricCard label="Recent hooks" value={String(hookCount)} accent="#6FD1B5" />
        <MetricCard label="Degraded templates" value={String(degradedCount)} accent="#FF9B89" />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <SectionCard title="System">
        <Text style={styles.line}>Repo: {data?.system.git_branch || '-'}</Text>
        <Text style={styles.line}>Commit: {data?.system.git_head || '-'}</Text>
        <Text style={styles.line}>Disk free: {data?.system.disk_free_gb ?? '-'} GB</Text>
        <Text style={styles.line}>Tailscale: {data?.system.tailscale_ip || '-'}</Text>
      </SectionCard>

      <SectionCard title="Task states">
        {Object.entries(data?.tasks ?? {}).map(([key, value]) => (
          <View key={key} style={styles.row}>
            <StatusPill tone={key === 'failed' ? 'danger' : key === 'running' ? 'warning' : 'ok'} text={key} />
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Background jobs">
        {Object.entries(data?.background ?? {}).map(([key, value]) => (
          <View key={key} style={styles.row}>
            <StatusPill tone={key === 'failed' ? 'danger' : 'neutral'} text={key} />
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  line: {
    color: '#F5F2EE',
    fontSize: 15,
    lineHeight: 22,
  },
  value: {
    color: '#F5F2EE',
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: '#FF9B89',
    fontSize: 14,
  },
});
