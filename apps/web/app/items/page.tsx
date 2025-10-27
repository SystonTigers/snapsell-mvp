import Link from 'next/link';

const mockItems = [
  {
    id: 'itm-001',
    title: 'Nintendo Switch Console',
    status: 'pricing',
    suggested: 189.99,
    condition: 'Very Good',
    lastUpdated: '2024-07-18'
  },
  {
    id: 'itm-002',
    title: 'Apple iPhone 13 128GB',
    status: 'ready',
    suggested: 329.99,
    condition: 'Excellent',
    lastUpdated: '2024-07-17'
  }
];

export default function ItemsPage() {
  return (
    <main>
      <h1>Items</h1>
      <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
        Review captured items, pricing insights, and listing readiness. Click through for detailed
        specifics, comps, and channel mappings.
      </p>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Suggested price</th>
            <th>Condition</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {mockItems.map((item) => (
            <tr key={item.id}>
              <td>
                <Link href={`/items/${item.id}`}>{item.title}</Link>
              </td>
              <td>{item.status}</td>
              <td>£{item.suggested.toFixed(2)}</td>
              <td>{item.condition}</td>
              <td>{item.lastUpdated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
