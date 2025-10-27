const mockInventory = [
  { variantSku: 'SS-0001', title: 'Nintendo Switch Console', onHand: 4, value: 440.0 },
  { variantSku: 'SS-0002', title: 'iPhone 13 128GB Blue', onHand: 2, value: 520.0 }
];

export default function InventoryPage() {
  const totalValue = mockInventory.reduce((sum, row) => sum + row.value, 0);
  return (
    <main>
      <h1>Inventory</h1>
      <p style={{ color: '#4b5563' }}>
        Snapshot is powered by `vw_inventory_valuation` combining FIFO lots and remaining quantity.
        Adjustments flow through `stock_movements` for auditability.
      </p>
      <table>
        <thead>
          <tr>
            <th>Variant</th>
            <th>Title</th>
            <th>On hand</th>
            <th>Inventory value</th>
          </tr>
        </thead>
        <tbody>
          {mockInventory.map((row) => (
            <tr key={row.variantSku}>
              <td>{row.variantSku}</td>
              <td>{row.title}</td>
              <td>{row.onHand}</td>
              <td>£{row.value.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} style={{ fontWeight: 600 }}>
              Total
            </td>
            <td>£{totalValue.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </main>
  );
}
