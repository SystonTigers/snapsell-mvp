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
// Extension pulls pending relist jobs for its platform
// GET /extension/tasks?platform=facebook|vinted|gumtree&limit=5
r.get(
  "/tasks",
  async () =>
    new Response(JSON.stringify({ tasks: [] }), {
      headers: { "Content-Type": "application/json" }
    })
);

// Extension marks a task in progress
// POST /extension/tasks/:id/start
r.post("/tasks/:id/start", async () => new Response(JSON.stringify({ ok: true })));

// Extension completes a task (with new listing id/url)
// POST /extension/tasks/:id/complete { platformListingId, url }
r.post("/tasks/:id/complete", async () => new Response(JSON.stringify({ ok: true })));

// Extension reports failure (increments attempts, stores error)
// POST /extension/tasks/:id/fail { error }
r.post("/tasks/:id/fail", async () => new Response(JSON.stringify({ ok: true })));

// Delist task polling for browser extension workers
// GET /extension/delist-tasks?platform=facebook|vinted|gumtree&limit=5
r.get(
  "/delist-tasks",
  async () =>
    new Response(JSON.stringify({ tasks: [] }), {
      headers: { "Content-Type": "application/json" }
    })
);

// POST /extension/delist-tasks/:id/start
r.post("/delist-tasks/:id/start", async () => new Response(JSON.stringify({ ok: true })));

// POST /extension/delist-tasks/:id/complete
r.post("/delist-tasks/:id/complete", async () => new Response(JSON.stringify({ ok: true })));

// POST /extension/delist-tasks/:id/fail { error }
r.post("/delist-tasks/:id/fail", async () => new Response(JSON.stringify({ ok: true })));

export default { handle: r.handle };
