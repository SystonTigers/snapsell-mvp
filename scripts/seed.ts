import { readFile } from 'node:fs/promises';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL env var required');
}
if (!SUPABASE_SERVICE_ROLE) {
  throw new Error('SUPABASE_SERVICE_ROLE env var required');
}

function extractStatements(sql: string): string[] {
  const withoutComments = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
  return withoutComments
    .split(/;\s*(?:\r?\n|$)/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((statement) => (statement.endsWith(';') ? statement : `${statement};`));
}

async function execute(statement: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ statement })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to run statement: ${statement} -> ${res.status} ${text}`);
  }
}

async function main() {
  const file = await readFile(new URL('../supabase/seed.sql', import.meta.url));
  const statements = extractStatements(file.toString('utf8'));
  for (const statement of statements) {
    console.log(`Executing: ${statement.slice(0, 80)}${statement.length > 80 ? '…' : ''}`);
    await execute(statement);
  }
  console.log('Seed complete');
}

await main();
