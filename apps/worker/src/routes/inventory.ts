import { Router } from "itty-router";

const r = Router({ base: "/inventory" });

r.post("/receive", async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const { variantId, qty, costPerUnit } = body as {
    variantId?: string;
    qty?: number;
    costPerUnit?: number;
  };

  if (!variantId || typeof qty !== "number") {
    return new Response(JSON.stringify({ ok: false, error: "variantId and qty required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  console.log("[inventory] receive stock", { variantId, qty, costPerUnit });
  // TODO: insert stock movement (reason=purchase) + inventory lot

  return new Response(JSON.stringify({ ok: true, variantId, qty, costPerUnit }), {
    headers: { "Content-Type": "application/json" }
  });
});

r.post("/adjust", async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const { variantId, qty, reason } = body as {
    variantId?: string;
    qty?: number;
    reason?: string;
  };

  if (!variantId || typeof qty !== "number") {
    return new Response(JSON.stringify({ ok: false, error: "variantId and qty required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  console.log("[inventory] adjust stock", { variantId, qty, reason });
  // TODO: insert adjustment stock movement

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
});

r.post("/sale", async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const {
    platform,
    orderId,
    variantId,
    qty,
    salePrice,
    fees,
    shippingCost,
    otherCosts
  } = body as {
    platform?: string;
    orderId?: string;
    variantId?: string;
    qty?: number;
    salePrice?: number;
    fees?: number;
    shippingCost?: number;
    otherCosts?: number;
  };

  if (!platform || !variantId || typeof qty !== "number" || typeof salePrice !== "number") {
    return new Response(JSON.stringify({ ok: false, error: "platform, variantId, qty, salePrice required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  console.log("[inventory] record sale", {
    platform,
    orderId,
    variantId,
    qty,
    salePrice,
    fees,
    shippingCost,
    otherCosts
  });

  // TODO: 1) insert sales row 2) stock_movements (-qty) 3) compute new on_hand
  // TODO: 4) trigger /channels/ebay/sync-qty when required
  // TODO: 5) enqueue relist_tasks for facebook/vinted/gumtree when stock remains
  // TODO: 6) if sale not on eBay but active eBay listing exists -> sync qty

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
});
// POST /inventory/sale  { platform, orderId, variantId, qty, salePrice, fees, shippingCost, otherCosts }
// 1) insert into sales (+ cogs), 2) insert stock_movements (-qty)
// 3) compute new on_hand
// 4) if platform === 'ebay' -> POST /channels/ebay/sync-qty
// 5) if platform in {'facebook','vinted','gumtree'} and on_hand>0 and auto_relist flag:
//      insert into relist_tasks (pending) with template_payload
// 6) if platform !== 'ebay' && there is an active eBay listing for this variant:
//      POST /channels/ebay/sync-qty
// 7) if new_on_hand === 0 -> POST /channels/delist-all to end listings everywhere
r.post("/sale", async () => new Response(JSON.stringify({ ok: true })));

r.get("/stock", async () =>
  new Response(JSON.stringify({ rows: [] }), {
    headers: { "Content-Type": "application/json" }
  })
);

r.get("/profit", async () =>
  new Response(JSON.stringify({ rows: [] }), {
    headers: { "Content-Type": "application/json" }
  })
);

export default { handle: r.handle };
