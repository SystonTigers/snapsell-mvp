import { getDb } from './db';
import type { EnvChecked } from './env';

export type JobEventInput = {
  tenantId: string;
  channelId?: string;
  jobId?: string;
  action: string;
  payload?: unknown;
  result?: unknown;
  status?: string;
};

export async function logJobEvent(env: EnvChecked, input: JobEventInput) {
  const db = getDb(env);
  const entry = {
    tenant_id: input.tenantId,
    channel_id: input.channelId ?? null,
    job_id: input.jobId ?? null,
    action: input.action,
    payload: input.payload ?? null,
    result: input.result ?? null,
    status: input.status ?? 'pending'
  };
  const { error } = await db.from('job_events').insert(entry);
  if (error) {
    console.warn(JSON.stringify({ level: 'warn', message: 'Failed to log job event', error }));
  }
}
