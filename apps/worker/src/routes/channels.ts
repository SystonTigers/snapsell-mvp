import { Router } from "itty-router";
const r = Router({ base: "/channels" });

r.post("/ebay/sync-qty", async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const { variantId, newQty } = body as { variantId?: string; newQty?: number };

  if (!variantId || typeof newQty !== "number") {
    return new Response(JSON.stringify({ ok: false, error: "variantId and newQty required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // TODO: integrate with eBay Sell API and persist last_synced_qty in channel_listings
  console.log("[channels] sync eBay quantity", { variantId, newQty });

  return new Response(JSON.stringify({ ok: true, variantId, newQty }), {
    headers: { "Content-Type": "application/json" }
  });
});

r.post("/map", async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const { platform, variantId, platformListingId, status, payload } = body as {
    platform?: string;
    variantId?: string;
    platformListingId?: string;
    status?: string;
    payload?: unknown;
  };

  if (!platform || !variantId) {
    return new Response(JSON.stringify({ ok: false, error: "platform and variantId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  console.log("[channels] map listing", { platform, variantId, platformListingId, status, payload });
  // TODO: upsert into channel_listings table via Supabase service role

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
});

r.get("/variant/:variantId", async (req) => {
  const { variantId } = req.params as { variantId: string };
  if (!variantId) {
    return new Response(JSON.stringify({ listings: [] }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // TODO: query vw_variant_channels for the specific variant via Supabase REST
  console.log("[channels] fetch variant listings", { variantId });

  return new Response(JSON.stringify({ listings: [] }), {
    headers: { "Content-Type": "application/json" }
  });
});

const r = Router({ base: "/channels" });

// Called after sale: decrement eBay quantity or end listing
// POST /channels/ebay/sync-qty { variantId, newQty }
r.post("/ebay/sync-qty", async () => new Response(JSON.stringify({ ok: true })));

// Administrative: attach/map a channel listing to a variant (when known)
// POST /channels/map { platform, variantId, platformListingId, status, payload }
r.post("/map", async () => new Response(JSON.stringify({ ok: true })));

// Helper: list active listings per variant
// GET /channels/variant/:variantId
r.get(
  "/variant/:variantId",
  async () =>
    new Response(JSON.stringify({ listings: [] }), {
      headers: { "Content-Type": "application/json" }
    })
);

export default { handle: r.handle };
