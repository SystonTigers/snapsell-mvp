import { Router } from "itty-router";

const r = Router({ base: "/extension" });

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

export default { handle: r.handle };
