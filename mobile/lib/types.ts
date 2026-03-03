export type OverviewResponse = {
  system: {
    db_path: string;
    disk_free_gb: number;
    disk_total_gb: number;
    git_branch: string;
    git_head: string;
    root: string;
    tailscale_ip: string;
  };
  tasks: Record<string, number>;
  background: Record<string, number>;
  plugins: Array<{ key: string; value: string }>;
  latest_hooks: Array<{ event_name: string; created_at: string }>;
  degraded_templates: Array<{ subject_key: string; avg_value: number; n: number }>;
};

export type TaskSummary = {
  id: number;
  title: string;
  goal: string;
  status: string;
  trigger: string;
  triggered_by: string;
  created_at: string;
};

export type ServiceState = {
  name: string;
  state: string;
};

export type AuthMeResponse = {
  subject: string;
  claims: Record<string, unknown>;
};

export type BridgeRequest = {
  id: number;
  title: string;
  goal: string;
  status: string;
  task_id: number | null;
  error: string;
  created_at: string;
  processed_at: string | null;
};
