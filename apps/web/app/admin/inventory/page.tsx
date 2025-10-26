"use client";

import { useEffect, useMemo, useState } from "react";

type ChannelPlatform = "facebook" | "vinted" | "gumtree" | "ebay";

type ChannelListing = {
  id: string;
  platform: ChannelPlatform;
  status: string;
  last_synced_qty?: number;
  platform_listing_id?: string;
};

type VariantRow = {
  variantId: string;
  sku: string;
  variantSku: string;
  title: string;
  onHand: number;
  autoRelistFacebook: boolean;
  autoRelistVinted: boolean;
  autoRelistGumtree: boolean;
  listings: ChannelListing[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

const demoRows: VariantRow[] = [
  {
    variantId: "demo-1",
    sku: "SKU-1001",
    variantSku: "SKU-1001-RED",
    title: "Demo Trainer (Red, UK 8)",
    onHand: 4,
    autoRelistFacebook: true,
    autoRelistVinted: true,
    autoRelistGumtree: false,
    listings: [
      { id: "ebay-123", platform: "ebay", status: "active", last_synced_qty: 4, platform_listing_id: "123" },
      { id: "fb-456", platform: "facebook", status: "ended" }
    ]
  }
];

async function fetchVariantRows(): Promise<VariantRow[]> {
  if (!API_BASE) {
    return demoRows;
  }
  try {
    const res = await fetch(`${API_BASE}/inventory/stock`, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) {
      console.warn("SnapSell inventory fetch failed", res.status);
      return demoRows;
    }
    const data = (await res.json()) as { rows?: VariantRow[] };
    return Array.isArray(data.rows) && data.rows.length ? data.rows : demoRows;
  } catch (err) {
    console.error("SnapSell inventory fetch error", err);
    return demoRows;
  }
}

function formatListing(listing: ChannelListing) {
  if (listing.platform === "ebay") {
    const qty = listing.last_synced_qty ?? "?";
    return `eBay • qty ${qty} • ${listing.status}`;
  }
  return `${listing.platform} • ${listing.status}`;
}

export default function Inventory() {
  const [rows, setRows] = useState<VariantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const next = await fetchVariantRows();
      setRows(next);
      setLoading(false);
    })();
  }, []);

  const activePlatforms = useMemo(() => ["facebook", "vinted", "gumtree"] as const, []);

  function updateToggle(variantId: string, key: keyof Pick<VariantRow, "autoRelistFacebook" | "autoRelistVinted" | "autoRelistGumtree">, value: boolean) {
    setRows((prev) =>
      prev.map((row) =>
        row.variantId === variantId
          ? {
              ...row,
              [key]: value
            }
          : row
      )
    );
    console.log("SnapSell: update auto relist", variantId, key, value);
    // TODO: PATCH to worker endpoint to persist flag in variants table
  }

  async function generateDraft(variant: VariantRow, platform: ChannelPlatform) {
    console.log("SnapSell: generate relist task", { variantId: variant.variantId, platform });
    // TODO: POST /extension/tasks enqueue manual task
    setNotice(`Draft task requested for ${variant.variantSku} on ${platform}. Check the extension queue.`);
  }

  return (
    <main className="p-6 space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold">Inventory</h2>
        <p className="text-sm text-slate-500">
          Track on-hand stock, auto-relist preferences, and channel listings. Toggle relist automation per
          marketplace or generate a manual assisted draft when needed.
        </p>
      </header>

      {loading ? <p>Loading inventory…</p> : null}
      {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}

      <section className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Variant</th>
              <th className="px-3 py-2">On hand</th>
              <th className="px-3 py-2">Auto-relist</th>
              <th className="px-3 py-2">Active listings</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.variantId} className="bg-white shadow-sm">
                <td className="px-3 py-2">
                  <div className="font-medium">{row.title}</div>
                  <div className="text-xs text-slate-500">{row.sku} • {row.variantSku}</div>
                </td>
                <td className="px-3 py-2 text-sm">{row.onHand}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-1 text-xs">
                    {activePlatforms.map((platform) => {
                      const key = (
                        platform === "facebook"
                          ? "autoRelistFacebook"
                          : platform === "vinted"
                          ? "autoRelistVinted"
                          : "autoRelistGumtree"
                      ) as const;
                      const label = platform.charAt(0).toUpperCase() + platform.slice(1);
                      const checked = row[key];
                      return (
                        <label key={platform} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(ev) => updateToggle(row.variantId, key, ev.target.checked)}
                          />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {row.listings && row.listings.length ? (
                    <ul className="space-y-1">
                      {row.listings.map((listing) => (
                        <li key={listing.id}>{formatListing(listing)}</li>
                      ))}
                    </ul>
                  ) : (
                    <span>No active listings</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-2 text-xs">
                    {activePlatforms.map((platform) => (
                      <button
                        key={platform}
                        className="rounded bg-slate-900 px-3 py-1 text-white hover:bg-slate-700"
                        onClick={() => void generateDraft(row, platform)}
                      >
                        Draft for {platform}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
