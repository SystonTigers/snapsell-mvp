import { Router } from "itty-router";
import items from "./routes/items";
import listings from "./routes/listings";
import auth from "./routes/auth";
import inventory from "./routes/inventory";
import exportsCsv from "./routes/exports";
import channels from "./routes/channels";
import extension from "./routes/extension";

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE: string;
  EBAY_CLIENT_ID: string;
  EBAY_CLIENT_SECRET: string;
  EBAY_REDIRECT_URI: string;
  JWT_SECRET: string;
}

const router = Router();
router.get("/", () => new Response("SnapSell API OK"));

router.all("/items/*", items.handle);
router.all("/listings/*", listings.handle);
router.all("/auth/*", auth.handle);
router.all("/inventory/*", inventory.handle);
router.all("/export/*", exportsCsv.handle);
router.all("/channels/*", channels.handle);
router.all("/extension/*", extension.handle);

export default { fetch: (req: Request, env: Env, ctx: ExecutionContext) => router.handle(req, env, ctx) };
