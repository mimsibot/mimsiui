import { useEffect, useRef, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { SectionCard } from '@/components/section-card';
import { StatusPill } from '@/components/status-pill';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ChatMessage, ChatSession } from '@/lib/types';

export default function ChatScreen() {
  const { session } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSessions = async (preferLatest = true) => {
    if (!session) {
      return;
    }
    const items = await api.fetchChatSessions(session.accessToken);
    setSessions(items);
    if (preferLatest && items.length > 0 && !activeSessionId) {
      setActiveSessionId(items[0].id);
    }
  };

  const loadMessages = async (sessionId: number) => {
    if (!session) {
      return;
    }
    const items = await api.fetchChatMessages(session.accessToken, sessionId);
    setMessages(items);
  };

  const ensureSession = async () => {
    if (!session) {
      return null;
    }
    if (activeSessionId) {
      return activeSessionId;
    }
    const created = await api.createChatSession(session.accessToken, 'Chat principal');
    setActiveSessionId(created.session_id);
    await loadSessions(false);
    return created.session_id;
  };

  const refresh = async () => {
    if (!session) {
      return;
    }
    setRefreshing(true);
    setError('');
    try {
      await loadSessions();
      if (activeSessionId) {
        await loadMessages(activeSessionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to refresh chat');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [session?.accessToken]);

  useEffect(() => {
    if (!session || !activeSessionId) {
      return;
    }
    loadMessages(activeSessionId).catch(() => undefined);
    pollRef.current = setInterval(() => {
      loadMessages(activeSessionId).catch(() => undefined);
    }, 3000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [session?.accessToken, activeSessionId]);

  const send = async () => {
    if (!session || !draft.trim()) {
      return;
    }
    setSending(true);
    setError('');
    try {
      const sessionId = await ensureSession();
      if (!sessionId) {
        return;
      }
      await api.sendChatMessage(session.accessToken, sessionId, draft.trim());
      setDraft('');
      await loadMessages(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenShell
      title="Chat"
      subtitle="Persistent conversation with mimsibot through FastAPI. Messages are processed by the bot and stored with history."
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#F7C873" />}>
      <SectionCard title="Sessions">
        <View style={styles.sessionRow}>
          {sessions.slice(0, 4).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setActiveSessionId(item.id)}
              style={[styles.sessionChip, activeSessionId === item.id ? styles.sessionChipActive : null]}>
              <Text style={styles.sessionChipText}>#{item.id} {item.title || 'Untitled'}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Conversation">
        {messages.map((message) => (
          <View
            key={message.id}
            style={[styles.messageBubble, message.sender === 'assistant' ? styles.assistantBubble : styles.userBubble]}>
            <View style={styles.messageMeta}>
              <StatusPill text={message.sender} tone={message.sender === 'assistant' ? 'ok' : 'warning'} />
              <Text style={styles.metaText}>{message.status}</Text>
            </View>
            <Text style={styles.messageText}>{message.content}</Text>
            {message.route_used ? <Text style={styles.metaText}>{message.route_used}</Text> : null}
            {message.error ? <Text style={styles.error}>{message.error}</Text> : null}
          </View>
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </SectionCard>

      <SectionCard title="Send message">
        <TextInput
          multiline
          numberOfLines={5}
          onChangeText={setDraft}
          placeholder="Ask the bot. Use the Tasks / Send screens for explicit autonomous work."
          placeholderTextColor="#677482"
          style={[styles.input, styles.textarea]}
          textAlignVertical="top"
          value={draft}
        />
        <Pressable disabled={sending || draft.trim().length < 1} onPress={send} style={styles.button}>
          <Text style={styles.buttonText}>{sending ? 'Sending...' : 'Send to bot'}</Text>
        </Pressable>
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  sessionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sessionChip: {
    backgroundColor: '#11161C',
    borderColor: '#2A3541',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sessionChipActive: {
    borderColor: '#F7C873',
  },
  sessionChipText: {
    color: '#F5F2EE',
    fontSize: 13,
    fontWeight: '700',
  },
  messageBubble: {
    borderRadius: 20,
    gap: 8,
    padding: 14,
  },
  assistantBubble: {
    backgroundColor: '#14211C',
  },
  userBubble: {
    backgroundColor: '#1A1E25',
  },
  messageMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  metaText: {
    color: '#8D9AA8',
    fontSize: 12,
  },
  messageText: {
    color: '#F5F2EE',
    fontSize: 15,
    lineHeight: 22,
  },
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
    minHeight: 120,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#6FD1B5',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#122019',
    fontSize: 15,
    fontWeight: '800',
  },
  error: {
    color: '#FF9B89',
    fontSize: 13,
  },
});
