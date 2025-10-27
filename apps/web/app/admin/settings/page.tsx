export default function SettingsPage() {
  return (
    <main>
      <h1>Settings</h1>
      <section>
        <h2>Fees & templates</h2>
        <p>
          Configure per-channel fee presets, shipping templates, and auto-relist policies. These are
          read by the Worker when calculating profit and when enqueuing relist tasks for the
          extension.
        </p>
      </section>
      <section>
        <h2>Automation toggles</h2>
        <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.6 }}>
          <li>Auto-relist: Facebook, Vinted, Gumtree.</li>
          <li>Auto-delist when stock reaches zero (all channels).</li>
          <li>eBay quantity sync after non-eBay sales.</li>
        </ul>
      </section>
    </main>
  );
}
