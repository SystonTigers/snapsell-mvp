const mockSeries = [
  { date: '2024-07-15', profit: 210.5 },
  { date: '2024-07-16', profit: 98.75 },
  { date: '2024-07-17', profit: 305.2 }
];

export default function ProfitPage() {
  const total = mockSeries.reduce((sum, row) => sum + row.profit, 0);
  return (
    <main>
      <h1>Profit</h1>
      <p style={{ color: '#4b5563' }}>
        Profit snapshot uses `vw_profit_per_sale` combined with fees, shipping, and recovery
        allocations. Export the data set via `/export/profit.csv?from=&to=` for Google Sheets.
      </p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          {mockSeries.map((row) => (
            <tr key={row.date}>
              <td>{row.date}</td>
              <td>£{row.profit.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ fontWeight: 600 }}>Total</td>
            <td>£{total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </main>
  );
}
