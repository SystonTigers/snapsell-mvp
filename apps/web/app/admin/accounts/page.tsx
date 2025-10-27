const mockAccounts = [
  {
    id: 'acct-ebay-1',
    platform: 'eBay',
    status: 'connected',
    refreshAt: '2024-07-22 09:15'
  }
];

export default function AccountsPage() {
  return (
    <main>
      <h1>Connected accounts</h1>
      <p style={{ color: '#4b5563' }}>
        Manage OAuth tokens for eBay and configure credentials for extension-based channels. Tokens
        are stored server-side via Supabase using the service role.
      </p>
      <table>
        <thead>
          <tr>
            <th>Platform</th>
            <th>Status</th>
            <th>Last refreshed</th>
          </tr>
        </thead>
        <tbody>
          {mockAccounts.map((account) => (
            <tr key={account.id}>
              <td>{account.platform}</td>
              <td>{account.status}</td>
              <td>{account.refreshAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: '1rem' }}>
        eBay quantity sync uses the Sell Inventory API `bulkUpdatePriceQuantity` endpoint after each
        sale recorded via `/inventory/sale`.
      </p>
    </main>
  );
}
