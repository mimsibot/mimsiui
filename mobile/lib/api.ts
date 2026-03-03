import { appConfig } from '@/lib/config';
import {
  AuthMeResponse,
  BridgeRequest,
  ChatMessage,
  ChatSession,
  ContextOverview,
  OverviewResponse,
  ServiceState,
  TaskSummary,
} from '@/lib/types';

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${appConfig.apiBaseUrl}/api/v1${path}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new ApiError(response.status, `API ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as T;
}

export const api = {
  fetchOverview(accessToken: string) {
    return request<OverviewResponse>('/overview', accessToken);
  },
  async fetchTasks(accessToken: string) {
    const payload = await request<{ items: TaskSummary[] }>('/tasks?limit=12', accessToken);
    return payload.items;
  },
  async fetchServices(accessToken: string) {
    const payload = await request<{ items: ServiceState[] }>('/services', accessToken);
    return payload.items;
  },
  fetchMe(accessToken: string) {
    return request<AuthMeResponse>('/auth/me', accessToken);
  },
  async createTask(accessToken: string, title: string, goal: string) {
    const response = await fetch(`${appConfig.apiBaseUrl}/api/v1/bridge/tasks`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, goal }),
    });
    if (!response.ok) {
      throw new ApiError(response.status, `API ${response.status}: ${await response.text()}`);
    }
    return (await response.json()) as { request_id: number; status: string; task_id: number | null };
  },
  async fetchBridgeRequests(accessToken: string) {
    const payload = await request<{ items: BridgeRequest[] }>('/bridge/requests', accessToken);
    return payload.items;
  },
  async fetchChatSessions(accessToken: string) {
    const payload = await request<{ items: ChatSession[] }>('/chat/sessions', accessToken);
    return payload.items;
  },
  async createChatSession(accessToken: string, title = '') {
    const response = await fetch(`${appConfig.apiBaseUrl}/api/v1/chat/sessions`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      throw new ApiError(response.status, `API ${response.status}: ${await response.text()}`);
    }
    return (await response.json()) as { session_id: number; status: string };
  },
  async fetchChatMessages(accessToken: string, sessionId: number) {
    const payload = await request<{ items: ChatMessage[] }>(`/chat/sessions/${sessionId}/messages`, accessToken);
    return payload.items;
  },
  async sendChatMessage(accessToken: string, sessionId: number, content: string) {
    const response = await fetch(`${appConfig.apiBaseUrl}/api/v1/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      throw new ApiError(response.status, `API ${response.status}: ${await response.text()}`);
    }
    return (await response.json()) as { message_id: number; status: string };
  },
  fetchContextOverview(accessToken: string) {
    return request<ContextOverview>('/context/overview', accessToken);
  },
  async searchContext(accessToken: string, query: string) {
    const payload = await request<{ items: ContextOverview['memories'] }>(
      `/context/search?query=${encodeURIComponent(query)}`,
      accessToken,
    );
    return payload.items;
  },
};
