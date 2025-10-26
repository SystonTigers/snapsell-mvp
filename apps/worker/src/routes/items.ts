import { Router } from "itty-router";
const r = Router({ base: "/items" });

r.post("/ingest", async () => {
  // TODO: accept uploads -> Supabase Storage -> media rows
  return new Response(JSON.stringify({ ok: true, media: [] }), { headers: { "Content-Type": "application/json" }});
});

r.post("/price", async () => {
  // TODO: eBay sold comps -> median ± IQR
  return new Response(JSON.stringify({ ok: true, price: { low: 10, mid: 15, high: 20 }}), { headers: { "Content-Type": "application/json" }});
});

export default { handle: r.handle };
