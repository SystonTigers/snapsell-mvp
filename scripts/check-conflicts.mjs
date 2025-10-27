#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  '.turbo',
  '.next',
  'dist',
  'build'
]);

const CONFLICT_PATTERNS = [
  /^<{7}\s.*/,
  /^={7}$/,
  /^>{7}\s.*/
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRECTORIES.has(entry)) continue;
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walk(full, files);
    } else if (stats.isFile()) {
      files.push(full);
    }
  }
  return files;
}

const repoRoot = process.cwd();
const offenders = [];

for (const file of walk(repoRoot)) {
  const contents = readFileSync(file, 'utf8');
  const lines = contents.split(/\r?\n/);
  if (lines.some((line) => CONFLICT_PATTERNS.some((pattern) => pattern.test(line)))) {
    offenders.push(relative(repoRoot, file));
  }
}

if (offenders.length) {
  console.error('Merge conflict markers detected in the following files:');
  for (const file of offenders) {
    console.error(` - ${file}`);
  }
  process.exit(1);
}

console.log('No merge conflict markers found.');
