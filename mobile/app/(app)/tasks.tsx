import { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { SectionCard } from '@/components/section-card';
import { StatusPill } from '@/components/status-pill';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { TaskSummary } from '@/lib/types';

export default function TasksScreen() {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!session) {
      return;
    }
    setRefreshing(true);
    setError('');
    try {
      setTasks(await api.fetchTasks(session.accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [session?.accessToken]);

  return (
    <ScreenShell
      title="Tasks"
      subtitle="Latest auto tasks, their trigger and current execution status."
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#F7C873" />}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {tasks.map((task) => (
        <SectionCard key={task.id} title={`#${task.id} ${task.title}`}>
          <View style={styles.row}>
            <StatusPill
              tone={task.status === 'failed' ? 'danger' : task.status === 'running' ? 'warning' : 'ok'}
              text={task.status}
            />
            <Text style={styles.meta}>{task.trigger || 'manual'}</Text>
          </View>
          <Text style={styles.goal}>{task.goal}</Text>
          <Text style={styles.meta}>By: {task.triggered_by || '-'}</Text>
          <Text style={styles.meta}>Created: {task.created_at || '-'}</Text>
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
    marginBottom: 10,
  },
  goal: {
    color: '#F5F2EE',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  meta: {
    color: '#8D9AA8',
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: '#FF9B89',
    fontSize: 14,
  },
});
