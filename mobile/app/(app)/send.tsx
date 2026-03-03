import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { SectionCard } from '@/components/section-card';
import { StatusPill } from '@/components/status-pill';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BridgeRequest } from '@/lib/types';

export default function SendScreen() {
  const { config, session } = useAuth();
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<BridgeRequest[]>([]);

  const load = async () => {
    if (!session) {
      return;
    }
    setRefreshing(true);
    try {
      setRequests(await api.fetchBridgeRequests(session.accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load bridge requests');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [session?.accessToken]);

  const submit = async () => {
    if (!session) {
      return;
    }
    setError('');
    setInfo('');
    setIsSubmitting(true);
    try {
      const created = await api.createTask(session.accessToken, title, goal);
      setInfo(`Request #${created.request_id} queued for mimsibot.`);
      setTitle('');
      setGoal('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenShell
      title="Send to bot"
      subtitle="Create signed task requests. FastAPI accepts them, mimsibot imports them into its own queue."
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#F7C873" />}>
      <SectionCard title="New request">
        <Text style={styles.meta}>Write scope required: {config.writeScope}</Text>
        <TextInput
          onChangeText={setTitle}
          placeholder="Task title"
          placeholderTextColor="#677482"
          style={styles.input}
          value={title}
        />
        <TextInput
          multiline
          numberOfLines={6}
          onChangeText={setGoal}
          placeholder="Explain what the bot should do"
          placeholderTextColor="#677482"
          style={[styles.input, styles.textarea]}
          textAlignVertical="top"
          value={goal}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
        <Pressable disabled={isSubmitting || title.trim().length < 3 || goal.trim().length < 5} onPress={submit} style={styles.button}>
          <Text style={styles.buttonText}>{isSubmitting ? 'Sending...' : 'Queue task request'}</Text>
        </Pressable>
      </SectionCard>

      <SectionCard title="My recent requests">
        {requests.map((request) => (
          <View key={request.id} style={styles.request}>
            <View style={styles.requestHeader}>
              <Text style={styles.requestTitle}>#{request.id} {request.title}</Text>
              <StatusPill
                text={request.status}
                tone={request.status === 'failed' ? 'danger' : request.status === 'submitted' ? 'ok' : 'warning'}
              />
            </View>
            <Text style={styles.goal}>{request.goal}</Text>
            <Text style={styles.meta}>
              {request.task_id ? `Task #${request.task_id}` : 'Waiting for bot import'} · {request.created_at}
            </Text>
            {request.error ? <Text style={styles.error}>{request.error}</Text> : null}
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
  textarea: {
    minHeight: 140,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#F7C873',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#16100D',
    fontSize: 15,
    fontWeight: '800',
  },
  request: {
    borderTopColor: '#2A3541',
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 12,
  },
  requestHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requestTitle: {
    color: '#F5F2EE',
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 12,
  },
  goal: {
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
  info: {
    color: '#9BF3D9',
    fontSize: 13,
  },
});
