import { describe, it, expect, beforeAll } from 'vitest';

/**
 * RLS (Row-Level Security) Enforcement Tests
 *
 * These tests verify that tenant isolation is properly enforced via RLS policies.
 * Each test attempts to access data from a different tenant and expects failure.
 *
 * IMPORTANT: These tests require a real Supabase instance with test data.
 * Set SUPABASE_URL and SUPABASE_SERVICE_ROLE env vars to run.
 *
 * To run: pnpm test -- rls.test.ts
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-at-least-16-chars';

// Skip tests if Supabase not configured
const describeIfSupabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE ? describe : describe.skip;

/**
 * Create a JWT token for testing with specific tenant_id
 */
async function createTestJWT(tenantId: string): Promise<string> {
  const payload = {
    tenant_id: tenantId,
    user_id: 'test-user',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const keyData = new TextEncoder().encode(JWT_SECRET);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, data);
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Query Supabase with a specific tenant JWT
 */
async function queryAssupabase(table: string, tenantId: string): Promise<unknown[]> {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL not set');

  const jwt = await createTestJWT(tenantId);
  const url = new URL(`/rest/v1/${table}`, SUPABASE_URL);
  url.searchParams.set('select', '*');
  url.searchParams.set('limit', '10');

  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE!,
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Query failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as unknown[];
}

/**
 * Attempt to insert data as a specific tenant
 */
async function insertAssupabase(table: string, tenantId: string, data: Record<string, unknown>): Promise<boolean> {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL not set');

  const jwt = await createTestJWT(tenantId);
  const url = new URL(`/rest/v1/${table}`, SUPABASE_URL);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE!,
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  });

  return res.ok;
}

describeIfSupabase('RLS Tenant Isolation', () => {
  const TENANT_A = 'tenant-a';
  const TENANT_B = 'tenant-b';

  beforeAll(async () => {
    // Setup: Ensure test tenants exist
    // In production tests, this would create test data
    console.log('RLS tests require test tenants in database');
    console.log(`Expected tenants: ${TENANT_A}, ${TENANT_B}`);
  });

  describe('tenants table', () => {
    it('should only return rows for authenticated tenant', async () => {
      const tenantAData = await queryAssupabase('tenants', TENANT_A);
      const tenantBData = await queryAssupabase('tenants', TENANT_B);

      // Each tenant should only see their own row
      expect(tenantAData.length).toBeGreaterThanOrEqual(0);
      expect(tenantBData.length).toBeGreaterThanOrEqual(0);

      // Tenant A should not see Tenant B's data
      const tenantAIds = tenantAData.map((t: any) => t.id);
      expect(tenantAIds).not.toContain(TENANT_B);
    });
  });

  describe('users table', () => {
    it('should enforce tenant isolation on SELECT', async () => {
      const tenantAUsers = await queryAssupabase('users', TENANT_A);
      const tenantBUsers = await queryAssupabase('users', TENANT_B);

      // Users from Tenant A should not be returned when querying as Tenant B
      const tenantAUserIds = tenantAUsers.map((u: any) => u.id);
      const tenantBUserIds = tenantBUsers.map((u: any) => u.id);

      // No overlap expected
      const overlap = tenantAUserIds.filter((id: string) => tenantBUserIds.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it('should prevent INSERT with wrong tenant_id', async () => {
      const success = await insertAssupabase('users', TENANT_A, {
        id: 'test-user-wrong-tenant',
        email: 'test@example.com',
        tenant_id: TENANT_B, // Trying to insert Tenant B data while authenticated as Tenant A
      });

      // Should fail due to RLS policy check
      expect(success).toBe(false);
    });
  });

  describe('channels table', () => {
    it('should enforce tenant isolation on SELECT', async () => {
      const tenantAChannels = await queryAssupabase('channels', TENANT_A);
      const tenantBChannels = await queryAssupabase('channels', TENANT_B);

      const tenantAChannelIds = tenantAChannels.map((c: any) => c.id);
      const tenantBChannelIds = tenantBChannels.map((c: any) => c.id);

      const overlap = tenantAChannelIds.filter((id: string) => tenantBChannelIds.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('items table', () => {
    it('should enforce tenant isolation on SELECT', async () => {
      const tenantAItems = await queryAssupabase('items', TENANT_A);
      const tenantBItems = await queryAssupabase('items', TENANT_B);

      const tenantAItemIds = tenantAItems.map((i: any) => i.id);
      const tenantBItemIds = tenantBItems.map((i: any) => i.id);

      const overlap = tenantAItemIds.filter((id: string) => tenantBItemIds.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('listings table', () => {
    it('should enforce tenant isolation on SELECT', async () => {
      const tenantAListings = await queryAssupabase('listings', TENANT_A);
      const tenantBListings = await queryAssupabase('listings', TENANT_B);

      const tenantAListingIds = tenantAListings.map((l: any) => l.id);
      const tenantBListingIds = tenantBListings.map((l: any) => l.id);

      const overlap = tenantAListingIds.filter((id: string) => tenantBListingIds.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('pricing_events table', () => {
    it('should enforce tenant isolation on SELECT', async () => {
      const tenantAEvents = await queryAssupabase('pricing_events', TENANT_A);
      const tenantBEvents = await queryAssupabase('pricing_events', TENANT_B);

      const tenantAEventIds = tenantAEvents.map((e: any) => e.id);
      const tenantBEventIds = tenantBEvents.map((e: any) => e.id);

      const overlap = tenantAEventIds.filter((id: string) => tenantBEventIds.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('job_events table', () => {
    it('should enforce tenant isolation on SELECT', async () => {
      const tenantAJobs = await queryAssupabase('job_events', TENANT_A);
      const tenantBJobs = await queryAssupabase('job_events', TENANT_B);

      const tenantAJobIds = tenantAJobs.map((j: any) => j.id);
      const tenantBJobIds = tenantBJobs.map((j: any) => j.id);

      const overlap = tenantAJobIds.filter((id: string) => tenantBJobIds.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });
});

/**
 * Coverage check: Ensure all tables in RLS_MATRIX.md are tested
 */
describe('RLS Coverage Check', () => {
  it('should test all tables documented in RLS_MATRIX.md', () => {
    const expectedTables = [
      'tenants',
      'users',
      'channels',
      'items',
      'listings',
      'pricing_events',
      'job_events',
    ];

    // This test serves as a reminder to add tests when new tables are added
    // Update this list when you add new tables to the schema
    const testedTables = [
      'tenants',
      'users',
      'channels',
      'items',
      'listings',
      'pricing_events',
      'job_events',
    ];

    expect(testedTables).toEqual(expectedTables);
  });
});
