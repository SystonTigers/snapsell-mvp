import { Router } from "itty-router";

const r = Router({ base: "/channels" });

// Called after sale: decrement eBay quantity or end listing
// POST /channels/ebay/sync-qty { variantId, newQty }
r.post("/ebay/sync-qty", async () => new Response(JSON.stringify({ ok: true })));

// POST /channels/delist-all { variantId }
// -> For ebay: end listing (or set qty 0). For FB/Vinted/Gumtree: insert delist_tasks for each active listing.
r.post("/delist-all", async () => new Response(JSON.stringify({ ok: true })));

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
