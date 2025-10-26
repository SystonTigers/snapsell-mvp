import { Router } from "itty-router";
const r = Router({ base: "/inventory" });

// POST { variantId, qty, costPerUnit? } => +stock
r.post("/receive", async () => new Response(JSON.stringify({ ok: true })));

// POST { variantId, qty } => +/- correction
r.post("/adjust", async () => new Response(JSON.stringify({ ok: true })));

// POST /inventory/sale  { platform, orderId, variantId, qty, salePrice, fees, shippingCost, otherCosts }
// 1) insert into sales (+ cogs), 2) insert stock_movements (-qty)
// 3) compute new on_hand
// 4) if platform === 'ebay' -> POST /channels/ebay/sync-qty
// 5) if platform in {'facebook','vinted','gumtree'} and on_hand>0 and auto_relist flag:
//      insert into relist_tasks (pending) with template_payload
// 6) if platform !== 'ebay' && there is an active eBay listing for this variant:
//      POST /channels/ebay/sync-qty
r.post("/sale", async () => new Response(JSON.stringify({ ok: true })));

// GET stock view
r.get("/stock", async () =>
  new Response(JSON.stringify({ rows: [] }), { headers: { "Content-Type": "application/json" }})
);

// GET profit view (optional date range params)
r.get("/profit", async () =>
  new Response(JSON.stringify({ rows: [] }), { headers: { "Content-Type": "application/json" }})
);

export default { handle: r.handle };
