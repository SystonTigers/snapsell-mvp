import { Router } from "itty-router";
const r = Router({ base: "/auth" });

// TODO: redirect to eBay OAuth authorize with scopes
r.get("/ebay/login", () => new Response("Not implemented", { status: 501 }));

// TODO: exchange code, store token in Supabase.accounts
r.get("/ebay/callback", () => new Response("Not implemented", { status: 501 }));

export default { handle: r.handle };
