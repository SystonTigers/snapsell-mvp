const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? process.env.API_BASE ?? 'http://localhost:8787';
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE env vars are required for smoke test');
}

async function assert(condition: unknown, message: string): Promise<void> {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (error) {
      throw new Error(`Non-JSON response from ${url}: ${text}`);
    }
  }
  if (!res.ok) {
    throw new Error(`Request failed ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function checkHealth() {
  console.log(`Checking health at ${apiBase}/health`);
  const res = await fetch(`${apiBase}/health`);
  await assert(res.status === 200, 'Healthcheck did not return 200');
  console.log('Healthcheck OK');
}

async function checkSeedData() {
  console.log('Validating seed data for demo-item-1');
  const data = (await fetchJson(`${SUPABASE_URL}/rest/v1/items?id=eq.demo-item-1`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`
    }
  })) as unknown[];
  await assert(Array.isArray(data) && data.length > 0, 'Seed item demo-item-1 missing');
  console.log('Seed data OK');
}

async function checkPricing() {
  console.log('Calling pricing helper');
  const data = await fetchJson(`${apiBase}/items/price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      comps: [
        { price: 52.5, condition: 'used_good' },
        { price: 48, condition: 'used_good' }
      ],
      targetCondition: 'used_good'
    })
  });
  await assert((data as { ok?: boolean; price?: unknown }).ok === true, 'Pricing endpoint failed');
  console.log('Pricing endpoint OK');
}

async function checkDryRunList() {
  console.log('Calling listing publish (dry run)');
  const data = await fetchJson(`${apiBase}/listings/ebay/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantId: 'demo-tenant',
      channelId: 'demo-ebay',
      itemId: 'demo-item-1',
      payload: { title: 'Nike Air Max', price: 49.99 }
    })
  });
  const typed = data as { dryRun?: boolean };
  await assert(typed.dryRun === true, 'Dry run listing did not short circuit');
  console.log('Dry run listing OK');
}

await checkHealth();
await checkSeedData();
await checkPricing();
await checkDryRunList();

console.log('Smoke test complete');
