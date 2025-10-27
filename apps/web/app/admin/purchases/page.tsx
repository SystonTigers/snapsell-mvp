import Link from 'next/link';

const mockPurchases = [
  {
    id: 'po-001',
    supplier: 'UK Pallet Co',
    ref: 'PAL-778',
    totalLanded: 1250.5,
    recoveryMode: 'allocate_recovery',
    recoveredAmount: 640,
    remaining: 610.5,
    status: 'received',
    purchasedAt: '2024-07-12'
  }
];

export default function PurchasesPage() {
  return (
    <main>
      <h1>Purchases</h1>
      <p style={{ color: '#4b5563' }}>
        Track pallets, landed costs, and recovery targets. Allocations can be recalculated using
        methods like units, weight, value, RRP weighted, expected value, or manual overrides.
      </p>
      <Link
        href="/admin/purchases/new"
        style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}
      >
        ➕ New purchase
      </Link>
      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Ref</th>
            <th>Total landed</th>
            <th>Recovery</th>
            <th>Status</th>
            <th>Purchased</th>
          </tr>
        </thead>
        <tbody>
          {mockPurchases.map((purchase) => (
            <tr key={purchase.id}>
              <td>{purchase.supplier}</td>
              <td>
                <Link href={`/admin/purchases/${purchase.id}`}>{purchase.ref}</Link>
              </td>
              <td>£{purchase.totalLanded.toFixed(2)}</td>
              <td>
                Mode: {purchase.recoveryMode} · Recovered £
                {purchase.recoveredAmount.toFixed(2)} (remaining £{purchase.remaining.toFixed(2)})
              </td>
              <td>{purchase.status}</td>
              <td>{purchase.purchasedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
