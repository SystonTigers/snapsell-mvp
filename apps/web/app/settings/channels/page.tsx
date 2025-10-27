import Link from 'next/link';

type Channel = {
  id: string;
  name?: string;
  status?: string;
  type?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

async function fetchChannels(): Promise<Channel[]> {
  if (!API_BASE) {
    return [{ id: 'demo-ebay', name: 'Demo eBay', status: 'disconnected', type: 'ebay' }];
  }
  try {
    const res = await fetch(`${API_BASE}/channels/tenant/demo-tenant`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as { channels?: Channel[] };
    return data.channels ?? [];
  } catch (error) {
    console.warn('Failed to fetch channels', error);
    return [{ id: 'demo-ebay', name: 'Demo eBay', status: 'disconnected', type: 'ebay' }];
  }
}

function connectUrl(channelId: string) {
  if (!API_BASE) {
    return '#';
  }
  const url = new URL(`${API_BASE}/auth/ebay/login`);
  url.searchParams.set('state', channelId);
  return url.toString();
}

export default async function ChannelsPage() {
  const channels = await fetchChannels();
  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Channel connections</h1>
      <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
        Connect eBay to enable live listing sync. During development the worker keeps `DRY_RUN=true` and logs marketplace calls
        to `job_events`.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {channels.map((channel) => (
          <li
            key={channel.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '1rem',
              padding: '1.25rem',
              marginBottom: '1rem',
              background: '#fff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 600 }}>{channel.name ?? channel.id}</p>
                <p style={{ color: '#4b5563' }}>Status: {channel.status ?? 'unknown'}</p>
              </div>
              <a
                href={connectUrl(channel.id)}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: '#0f172a',
                  color: '#fff',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                Connect eBay (sandbox)
              </a>
            </div>
          </li>
        ))}
      </ul>
      <p style={{ color: '#4b5563' }}>
        Looking for the happy-path checklist? Head back to{' '}
        <Link href="/" style={{ color: '#1d4ed8' }}>
          the dashboard
        </Link>{' '}
        to price and list the seeded item.
      </p>
    </main>
  );
}
