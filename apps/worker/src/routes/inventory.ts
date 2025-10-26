import { Router } from "itty-router";
const r = Router({ base: "/inventory" });

// POST { variantId, qty, costPerUnit? } => +stock
r.post("/receive", async () => new Response(JSON.stringify({ ok: true })));

// POST { variantId, qty } => +/- correction
r.post("/adjust", async () => new Response(JSON.stringify({ ok: true })));

// POST { platform, orderId, variantId, qty, salePrice, fees, shippingCost, otherCosts }
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
