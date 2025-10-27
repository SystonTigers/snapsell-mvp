interface ItemDetailProps {
  params: { id: string };
}

const mockComps = [
  { marketplace: 'eBay', price: 185.0, condition: 'Good', date: '2024-07-01' },
  { marketplace: 'eBay', price: 192.5, condition: 'Very Good', date: '2024-06-26' },
  { marketplace: 'Gumtree', price: 180.0, condition: 'Good', date: '2024-06-21' }
];

export default function ItemDetailPage({ params }: ItemDetailProps) {
  return (
    <main>
      <h1>Item detail</h1>
      <p style={{ color: '#4b5563' }}>Draft ID: {params.id}</p>

      <section>
        <h2>Pricing signals</h2>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>Suggested price: £189.99 (condition-normalised median).</li>
          <li>COGS: £110.00 → target margin 40%.</li>
          <li>RRP: £279.99 (ceiling snap).</li>
        </ul>
        <table>
          <thead>
            <tr>
              <th>Marketplace</th>
              <th>Price</th>
              <th>Condition</th>
              <th>Sold at</th>
            </tr>
          </thead>
          <tbody>
            {mockComps.map((comp) => (
              <tr key={`${comp.marketplace}-${comp.date}`}>
                <td>{comp.marketplace}</td>
                <td>£{comp.price.toFixed(2)}</td>
                <td>{comp.condition}</td>
                <td>{comp.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Channel mapping</h2>
        <p>SnapSell auto-delist triggers for single-quantity channels when stock reaches zero.</p>
      </section>
    </main>
  );
}
