import { appConfig } from '@/lib/config';
import { AuthMeResponse, BridgeRequest, OverviewResponse, ServiceState, TaskSummary } from '@/lib/types';

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
};
