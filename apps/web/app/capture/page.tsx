import Link from 'next/link';

export default function CapturePage() {
  return (
    <main>
      <h1>Capture</h1>
      <p style={{ color: '#4b5563', maxWidth: 560 }}>
        Start a capture session by uploading photos, scanning barcodes, or using the SnapSell
        extension. Items land in the ingest queue for enrichment and pricing.
      </p>
      <section>
        <h2>Quick actions</h2>
        <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.6 }}>
          <li>Upload photos directly from mobile or desktop.</li>
          <li>Scan SKU/UPC/ISBN to auto-populate product specifics.</li>
          <li>Trigger background pricing via the Worker `/items/price` route.</li>
        </ul>
        <p>
          Need to keep working? Visit the{' '}
          <Link href="/items">Items workspace</Link> to review captured drafts.
        </p>
      </section>
    </main>
  );
}
