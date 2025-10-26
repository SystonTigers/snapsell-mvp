import { Router } from "itty-router";
const r = Router({ base: "/export" });

// GET /export/stock.csv
r.get("/stock.csv", async () => {
  // TODO: query vw_stock, build CSV text
  const csv = "sku,variant_sku,title,on_hand\n";
  return new Response(csv, { headers: { "Content-Type": "text/csv" }});
});

// GET /export/profit.csv?from=YYYY-MM-DD&to=YYYY-MM-DD
r.get("/profit.csv", async () => {
  // TODO: query vw_profit_per_sale, build CSV
  const csv = "sold_at,platform,order_id,sku,qty,price,fees,cogs,profit\n";
  return new Response(csv, { headers: { "Content-Type": "text/csv" }});
});

// GET /export/purchases.csv
r.get("/purchases.csv", async () => {
  // TODO: query purchases with recovery fields
  const csv = "purchased_at,supplier,ref,total_landed,recovery_mode,recovered_amount,remaining,status\n";
  return new Response(csv, { headers: { "Content-Type": "text/csv" }});
});

// GET /export/valuation.csv
r.get("/valuation.csv", async () => {
  // TODO: query vw_inventory_valuation
  const csv = "sku,variant_sku,title,qty_remaining,inventory_value\n";
  return new Response(csv, { headers: { "Content-Type": "text/csv" }});
});

// GET /export/recovery.csv
r.get("/recovery.csv", async () => {
  // TODO: query vw_purchase_recovery
  const csv = "purchase_id,supplier,ref,total_landed,recovery_mode,recovered_amount,remaining_to_recover,status\n";
  return new Response(csv, { headers: { "Content-Type": "text/csv" }});
});

export default { handle: r.handle };
