import { HomeClient } from './components/home-client';

type Channel = {
  id: string;
  name?: string;
  status?: string;
  type?: string;
};

type Item = {
  id: string;
  title?: string;
  description?: string;
  base_price?: number;
  currency?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
const FALLBACK_CHANNELS: Channel[] = [
  { id: 'demo-ebay', name: 'Demo eBay', status: 'disconnected', type: 'ebay' }
];
const FALLBACK_ITEM: Item = {
  id: 'demo-item-1',
  title: 'Nike Air Max (Demo)',
  description: 'Lightly worn, size 9. Run pnpm seed to sync with Supabase.',
  base_price: 49.99,
  currency: 'GBP'
};

async function fetchJson<T>(path: string): Promise<T | null> {
  if (!API_BASE) {
    return null;
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (error) {
    console.warn('Failed to fetch from worker', path, error);
    return null;
  }
}

export default async function Home() {
  const [channelPayload, itemPayload] = await Promise.all([
    fetchJson<{ channels?: Channel[] }>(`/channels/tenant/demo-tenant`),
    fetchJson<{ items?: Item[] }>(`/items/tenant/demo-tenant/demo`)
  ]);

  const channels = channelPayload?.channels ?? FALLBACK_CHANNELS;
  const item = itemPayload?.items?.[0] ?? FALLBACK_ITEM;
  const dryRunValue = process.env.NEXT_PUBLIC_DRY_RUN ?? process.env.DRY_RUN ?? 'true';
  const dryRunEnabled = String(dryRunValue).toLowerCase() === 'true';

  return <HomeClient channels={channels} item={item} apiBase={API_BASE || null} dryRunEnabled={dryRunEnabled} />;
}
