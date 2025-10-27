import Link from 'next/link';

const sections = [
  { href: '/capture', label: 'Capture item' },
  { href: '/items', label: 'Items' },
  { href: '/publish', label: 'Publish' },
  { href: '/admin/inventory', label: 'Inventory' },
  { href: '/admin/sales', label: 'Sales' },
  { href: '/admin/profit', label: 'Profit' },
  { href: '/admin/purchases', label: 'Purchases' },
  { href: '/admin/accounts', label: 'Accounts' },
  { href: '/admin/settings', label: 'Settings' }
];

export default function Home() {
  return (
    <main>
      <h1>SnapSell</h1>
      <p style={{ color: '#4b5563', marginBottom: '1.5rem', maxWidth: 560 }}>
        Mobile-first workflow to capture products, price them using smart signals, and publish
        across sales channels while keeping stock, purchases, and recovery reporting in sync.
      </p>
      <nav style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            style={{
              display: 'block',
              padding: '0.85rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb',
              background: '#fff',
              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
              fontWeight: 600
            }}
          >
            {section.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
