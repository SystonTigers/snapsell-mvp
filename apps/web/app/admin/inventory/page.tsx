'use client';

import { useEffect, useState } from 'react';

type InventoryRow = {
  variantSku: string;
  title: string;
  onHand: number;
  value: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

const fallbackRows: InventoryRow[] = [
  { variantSku: 'SKU-1001-RED', title: 'Demo Trainer (Red, UK 8)', onHand: 4, value: 440 },
  { variantSku: 'SKU-1002-BLK', title: 'Demo Hoodie (Black, M)', onHand: 3, value: 210 }
];

async function fetchInventory(): Promise<InventoryRow[]> {
  if (!API_BASE) {
    return fallbackRows;
  }
  try {
    const res = await fetch(`${API_BASE}/inventory/stock`);
    if (!res.ok) {
      throw new Error(`Unexpected status ${res.status}`);
    }
    const data = (await res.json()) as { stock?: InventoryRow[] };
    return Array.isArray(data.stock) && data.stock.length ? data.stock : fallbackRows;
  } catch (error) {
    console.warn('Inventory fetch failed', error);
    return fallbackRows;
  }
}

export default function InventoryPage() {
  const [rows, setRows] = useState<InventoryRow[]>(fallbackRows);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const data = await fetchInventory();
      setRows(data);
      setLoading(false);
    })();
  }, []);

  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Inventory snapshot</h1>
      <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
        FIFO valuation preview. Data hydrates from Supabase when the worker is running locally.
      </p>
      {loading && <p>Loading inventory…</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '0.5rem' }}>Variant SKU</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '0.5rem' }}>Title</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #e5e7eb', padding: '0.5rem' }}>On hand</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #e5e7eb', padding: '0.5rem' }}>Inventory value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.variantSku}>
              <td style={{ padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{row.variantSku}</td>
              <td style={{ padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{row.title}</td>
              <td style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{row.onHand}</td>
              <td style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>
                £{row.value.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ padding: '0.5rem', fontWeight: 600 }} colSpan={3}>
              Total
            </td>
            <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>£{total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </main>
  );
}
