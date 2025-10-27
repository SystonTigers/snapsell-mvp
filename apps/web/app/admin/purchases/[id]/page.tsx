interface PurchaseDetailProps {
  params: { id: string };
}

const mockLines = [
  { id: 'line-1', variantSku: 'SS-0001', qty: 5, unitCogs: 85.25 },
  { id: 'line-2', variantSku: 'SS-0002', qty: 3, unitCogs: 92.3 }
];

export default function PurchaseDetailPage({ params }: PurchaseDetailProps) {
  return (
    <main>
      <h1>Purchase {params.id}</h1>
      <section>
        <h2>Allocation snapshot</h2>
        <p>
          Current method: <strong>units</strong>. Adjust and re-run allocation via the Worker route to
          preview cost per unit before receiving stock.
        </p>
        <table>
          <thead>
            <tr>
              <th>Line</th>
              <th>Variant</th>
              <th>Qty</th>
              <th>Unit COGS</th>
            </tr>
          </thead>
          <tbody>
            {mockLines.map((line) => (
              <tr key={line.id}>
                <td>{line.id}</td>
                <td>{line.variantSku}</td>
                <td>{line.qty}</td>
                <td>£{line.unitCogs.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Recovery</h2>
        <p>
          Mode: <strong>allocate_recovery</strong>. Target £1,250.00, recovered £640.00 so far.
        </p>
      </section>
    </main>
  );
}
