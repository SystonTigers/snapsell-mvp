'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

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

type Props = {
  channels: Channel[];
  item: Item | null;
  apiBase: string | null;
  dryRunEnabled: boolean;
};

export function HomeClient({ channels, item, apiBase, dryRunEnabled }: Props) {
  const [priceMessage, setPriceMessage] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);
  const [listPayload, setListPayload] = useState<Record<string, unknown> | null>(null);
  const [action, setAction] = useState<'price' | 'list' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connected = useMemo(() => channels.some((channel) => channel.status === 'connected'), [channels]);
  const channelId = channels[0]?.id ?? 'demo-ebay';

  const handlePrice = async () => {
    if (!apiBase) {
      setPriceMessage('Pricing helper available once API base is configured.');
      return;
    }
    try {
      setAction('price');
      setError(null);
      setPriceMessage(null);
      const res = await fetch(`${apiBase}/items/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comps: [
            { price: 54.99, condition: 'used_good' },
            { price: 52.5, condition: 'used_good' },
            { price: 49.0, condition: 'used_fair' }
          ],
          targetCondition: 'used_good',
          expected: item?.base_price ?? 49.99
        })
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as { price?: { mid?: number } };
      const recommended = data.price?.mid ?? null;
      setPriceMessage(recommended ? `Recommended price: £${recommended.toFixed(2)}` : 'No recommendation returned');
    } catch (err) {
      setError(`Pricing failed: ${(err as Error).message}`);
    } finally {
      setAction(null);
    }
  };

  const handleList = async () => {
    if (!apiBase) {
      setListMessage('Listing simulation available once API base is configured.');
      return;
    }
    if (!item) {
      setListMessage('No item payload found. Seed the database first.');
      return;
    }
    try {
      setAction('list');
      setError(null);
      setListMessage(null);
      setListPayload(null);
      const payload = {
        tenantId: 'demo-tenant',
        channelId,
        itemId: item.id,
        payload: {
          title: item.title ?? 'SnapSell demo item',
          description: item.description ?? 'Lightly worn demo item',
          price: item.base_price ?? 49.99,
          currency: item.currency ?? 'GBP'
        }
      };
      const res = await fetch(`${apiBase}/listings/ebay/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { dryRun?: boolean; jobId?: string };
      setListPayload(payload.payload as Record<string, unknown>);
      setListMessage(
        data.dryRun
          ? `Dry run logged (job ${data.jobId ?? 'n/a'})`
          : `Listing queued (job ${data.jobId ?? 'n/a'})`
      );
    } catch (err) {
      setError(`Listing failed: ${(err as Error).message}`);
    } finally {
      setAction(null);
    }
  };

  const dryRunLabel = dryRunEnabled ? 'Dry run: enabled' : 'Dry run: disabled';

  return (
    <main style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
      {!connected && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            padding: '1rem 1.5rem',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem'
          }}
        >
          <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
            No sales channels connected
          </strong>
          <p style={{ marginBottom: '0.75rem' }}>
            Connect eBay to start listing directly from SnapSell. Tokens are stored securely in Supabase.
          </p>
          <Link
            href="/settings/channels"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              background: '#1d4ed8',
              color: '#fff',
              fontWeight: 600
            }}
          >
            Go to channel settings
          </Link>
        </div>
      )}

      <section style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>SnapSell demo workspace</h1>
        <p style={{ color: '#4b5563' }}>
          Use the seeded Nike Air Max item to trial the full workflow: pricing recommendation, marketplace dry run, and extension
          autofill.
        </p>
      </section>

      {item ? (
        <section
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)'
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{item.title ?? 'Demo item'}</h2>
          <p style={{ color: '#4b5563', marginBottom: '1rem' }}>{item.description ?? 'No description provided.'}</p>
          <p style={{ fontWeight: 600, marginBottom: '1rem' }}>
            Base price: £{(item.base_price ?? 49.99).toFixed(2)}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handlePrice}
              disabled={action === 'price'}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '999px',
                border: 'none',
                background: '#0f172a',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              {action === 'price' ? 'Pricing…' : 'Price item'}
            </button>
            <button
              type="button"
              onClick={handleList}
              disabled={action === 'list'}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '999px',
                border: '1px solid #0f172a',
                background: '#fff',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              {action === 'list' ? 'Submitting…' : 'List (dry run)'}
            </button>
            <span style={{ marginLeft: 'auto', color: '#4b5563' }}>{dryRunLabel}</span>
          </div>
          {priceMessage && <p style={{ marginTop: '1rem', color: '#047857' }}>{priceMessage}</p>}
          {listMessage && (
            <div style={{ marginTop: '1rem', color: '#047857' }}>
              <p>{listMessage}</p>
              {listPayload && (
                <pre
                  style={{
                    marginTop: '0.5rem',
                    background: '#f1f5f9',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.85rem',
                    overflowX: 'auto'
                  }}
                >
                  {JSON.stringify(listPayload, null, 2)}
                </pre>
              )}
            </div>
          )}
          {error && <p style={{ marginTop: '1rem', color: '#dc2626' }}>{error}</p>}
        </section>
      ) : (
        <p>No demo item found. Run `pnpm seed` and refresh.</p>
      )}
    </main>
  );
}
