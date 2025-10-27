const mockInventory = [
  { variantSku: 'SS-0001', title: 'Nintendo Switch Console', onHand: 4, value: 440.0 },
  { variantSku: 'SS-0002', title: 'iPhone 13 128GB Blue', onHand: 2, value: 520.0 }
];

export default function InventoryPage() {
  const totalValue = mockInventory.reduce((sum, row) => sum + row.value, 0);
"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, createApiClient } from "../../lib/api";

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
const api = createApiClient(API_BASE || "");

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
    const data = await api.get<{ rows?: VariantRow[] }>("/inventory/stock");
    return Array.isArray(data.rows) && data.rows.length ? data.rows : demoRows;
  } catch (err) {
    if (err instanceof ApiError) {
      console.warn("SnapSell inventory fetch failed", err.status);
    } else {
      console.error("SnapSell inventory fetch error", err);
    }
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
