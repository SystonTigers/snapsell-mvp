const allocationMethods = [
  'units',
  'weight',
  'value',
  'rrp_weighted',
  'expected_value',
  'manual'
];

export default function NewPurchasePage() {
  return (
    <main>
      <h1>New purchase</h1>
      <section>
        <h2>Header</h2>
        <p>
          Create the purchase header with supplier, currency, landed costs, and recovery target.
          Lines can then be added for each SKU in the pallet.
        </p>
      </section>
      <section>
        <h2>Allocation methods</h2>
        <ul style={{ paddingLeft: '1.25rem' }}>
          {allocationMethods.map((method) => (
            <li key={method}>{method}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Receive & lot creation</h2>
        <p>
          Once allocated, the `/purchases/{id}/receive` endpoint creates inventory lots, stock
          movements, and marks the purchase as received.
        </p>
      </section>
    </main>
  );
}
