import { Router } from "itty-router";

const r = Router({ base: "/extension" });

r.get("/tasks", async (req) => {
  const url = new URL(req.url);
  const platform = url.searchParams.get("platform");
  const limit = Number(url.searchParams.get("limit") ?? "5");

  if (!platform) {
    return new Response(JSON.stringify({ tasks: [], error: "platform required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  console.log("[extension] fetch tasks", { platform, limit });
  // TODO: query relist_tasks table for pending rows matching platform and owner

  return new Response(JSON.stringify({ tasks: [] }), {
    headers: { "Content-Type": "application/json" }
  });
});

r.post("/tasks/:id/start", async (req) => {
  const { id } = req.params as { id: string };
  console.log("[extension] start task", { id });
  // TODO: mark task as in_progress and increment attempts
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
});

r.post("/tasks/:id/complete", async (req) => {
  const { id } = req.params as { id: string };
  const body = await req.json().catch(() => ({}));
  console.log("[extension] complete task", { id, body });
  // TODO: mark task completed, write channel_listings mapping if provided
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
});

r.post("/tasks/:id/fail", async (req) => {
  const { id } = req.params as { id: string };
  const body = await req.json().catch(() => ({}));
  console.log("[extension] fail task", { id, body });
  // TODO: increment attempts, persist error, keep pending if attempts remain
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
});

export default { handle: r.handle };
