import Link from 'next/link';

export default function PublishPage() {
  return (
    <main>
      <h1>Publish workflow</h1>
      <section>
        <h2>Steps</h2>
        <ol style={{ paddingLeft: '1.25rem', lineHeight: 1.6 }}>
          <li>Confirm specifics and pricing from smart helper output.</li>
          <li>Generate human-readable description sections automatically.</li>
          <li>Select channels (eBay API or extension-assisted marketplaces).</li>
          <li>Push live listings and enqueue relist/delist tasks as needed.</li>
        </ol>
      </section>
      <section>
        <h2>Listing templates</h2>
        <p>
          Configure fees, shipping presets, and fulfillment accounts in{' '}
          <Link href="/admin/settings">Settings</Link>. eBay accounts connect in{' '}
          <Link href="/admin/accounts">Accounts</Link> using OAuth.
        </p>
      </section>
    </main>
  );
}
