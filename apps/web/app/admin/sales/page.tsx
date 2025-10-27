const mockSales = [
  {
    id: 'sale-001',
    platform: 'eBay',
    orderId: 'EB12345',
    variantSku: 'SS-0001',
    qty: 1,
    salePrice: 199.99,
    fees: 20.5,
    cogs: 110,
    profit: 69.49
  }
];

export default function SalesPage() {
  return (
    <main>
      <h1>Sales</h1>
      <p style={{ color: '#4b5563' }}>
        FIFO lot consumption and pallet recovery adjustments are handled in the Worker when sales are
        recorded. Non-eBay sales trigger eBay quantity sync and potential auto-delist tasks if stock
        reaches zero.
      </p>
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Platform</th>
            <th>Variant</th>
            <th>Qty</th>
            <th>Sale price</th>
            <th>Fees</th>
            <th>COGS</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          {mockSales.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.orderId}</td>
              <td>{sale.platform}</td>
              <td>{sale.variantSku}</td>
              <td>{sale.qty}</td>
              <td>£{sale.salePrice.toFixed(2)}</td>
              <td>£{sale.fees.toFixed(2)}</td>
              <td>£{sale.cogs.toFixed(2)}</td>
              <td>£{sale.profit.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
