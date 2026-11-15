#!/usr/bin/env node
/**
 * Maps NEXT/Vercel-style NG_APP_* env vars into Angular environment files.
 * Vercel build: node tools/write-env.js && ng build --configuration=production
 * Local with keys: node tools/write-env.js --dev && ng serve
 */
const fs = require('fs');
const path = require('path');

const url = process.env.NG_APP_SUPABASE_URL || '';
const key = process.env.NG_APP_SUPABASE_ANON_KEY || '';
const destDir = path.join(__dirname, '..', 'src', 'environments');

function file(production) {
  return `export const environment = {
  production: ${production ? 'true' : 'false'},
  supabaseUrl: ${JSON.stringify(url)},
  supabaseAnonKey: ${JSON.stringify(key)},
};
`;
}

fs.mkdirSync(destDir, { recursive: true });
fs.writeFileSync(path.join(destDir, 'environment.prod.ts'), file(true));
if (process.argv.includes('--dev')) {
  fs.writeFileSync(path.join(destDir, 'environment.ts'), file(false));
}

console.log(
  url
    ? 'Wrote Supabase URL/anon key into environment files (anon key is public; RLS is the lock).'
    : 'Wrote empty Supabase placeholders — the app will boot on mock data.',
);
