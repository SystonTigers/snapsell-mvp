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

export default { handle: r.handle };
