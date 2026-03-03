import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { SectionCard } from '@/components/section-card';
import { StatusPill } from '@/components/status-pill';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ContextOverview } from '@/lib/types';

export default function ContextScreen() {
  const { session } = useAuth();
  const [data, setData] = useState<ContextOverview | null>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContextOverview['memories']>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!session) {
      return;
    }
    setRefreshing(true);
    setError('');
    try {
      setData(await api.fetchContextOverview(session.accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load context');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [session?.accessToken]);

  const search = async () => {
    if (!session || query.trim().length < 2) {
      return;
    }
    try {
      setSearchResults(await api.searchContext(session.accessToken, query.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to search memories');
    }
  };

  return (
    <ScreenShell
      title="Context"
      subtitle="What the bot currently knows: memories, reusable agents and recent task traces."
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#F7C873" />}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <SectionCard title="Search bot memory">
        <TextInput
          onChangeText={setQuery}
          placeholder="Search memory, decisions, previous knowledge"
          placeholderTextColor="#677482"
          style={styles.input}
          value={query}
        />
        <Pressable onPress={search} style={styles.button}>
          <Text style={styles.buttonText}>Search context</Text>
        </Pressable>
        {searchResults.map((item) => (
          <View key={item.id} style={styles.rowBlock}>
            <Text style={styles.rowTitle}>{item.title || `${item.scope_type}:${item.scope_key}`}</Text>
            <Text style={styles.copy}>{item.content}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Memory">
        {data?.memories.map((item) => (
          <View key={item.id} style={styles.rowBlock}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>{item.title || `${item.scope_type}:${item.scope_key}`}</Text>
              <StatusPill text={`p${item.importance}`} tone="neutral" />
            </View>
            <Text style={styles.copy}>{item.content}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Agents">
        {data?.agents.map((item) => (
          <View key={item.id} style={styles.rowBlock}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <StatusPill text={item.active ? 'active' : 'off'} tone={item.active ? 'ok' : 'warning'} />
            </View>
            <Text style={styles.meta}>{item.role} · versions={item.version_count}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Recent tasks">
        {data?.recent_tasks.map((item) => (
          <View key={item.id} style={styles.rowBlock}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>#{item.id} {item.title}</Text>
              <StatusPill
                text={item.status}
                tone={item.status === 'failed' ? 'danger' : item.status === 'running' ? 'warning' : 'ok'}
              />
            </View>
            <Text style={styles.meta}>{item.trigger} · {item.triggered_by || 'auto'}</Text>
          </View>
        ))}
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#10161D',
    borderColor: '#2E3945',
    borderRadius: 18,
    borderWidth: 1,
    color: '#F5F2EE',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#24303B',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#F5F2EE',
    fontSize: 15,
    fontWeight: '700',
  },
  rowBlock: {
    borderTopColor: '#2A3541',
    borderTopWidth: 1,
    gap: 6,
    paddingTop: 12,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowTitle: {
    color: '#F5F2EE',
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 12,
  },
  copy: {
    color: '#D7D2CC',
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: '#8D9AA8',
    fontSize: 12,
  },
  error: {
    color: '#FF9B89',
    fontSize: 13,
  },
});
