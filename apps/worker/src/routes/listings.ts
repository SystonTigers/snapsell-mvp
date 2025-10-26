import { Router } from "itty-router";
const r = Router({ base: "/listings" });

r.post("/ebay/draft", async () => {
  // TODO: create eBay draft listing
  return new Response(JSON.stringify({ ok: true, draftId: "demo" }), { headers: { "Content-Type": "application/json" }});
});

r.post("/ebay/publish", async () => {
  // TODO: publish eBay listing
  return new Response(JSON.stringify({ ok: true, url: "https://www.ebay.co.uk/itm/demo" }), { headers: { "Content-Type": "application/json" }});
});

export default { handle: r.handle };
