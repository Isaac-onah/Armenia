/cursor/stores/self/malta-quest

# Malta Quest

Angular 22 static SPA: a MapQuest-style board of Malta. Click a pin, do the job in that building, come back to the island. Empty Supabase keys boot the game on mock data so you can open it immediately.

## Run locally

```bash
cd /cursor/stores/self/malta-quest
npm install
npx ng serve
```

Open http://localhost:4200

1. Harbour name + jersey → **Set sail** (room `DEMO` is pre-seeded).
2. Click the five fat pins: Media house, Civic hall, People's Party HQ, Democratic Party HQ, Playground.
3. Party HQ writes only if your jersey matches. Media: upload a story, then **Stamp as intern** (or open a second browser as `press`) so you don't approve yourself.
4. Civic hall: poll + ballot of whoever the HQs actually filed. Playground: walkers + speech bubbles.

Host desk: http://localhost:4200/host  
Projector: http://localhost:4200/map/DEMO/screen

Optional live backend — copy `.env.example` to `.env`, fill the **anon** key only, then:

```bash
export $(grep -v '^#' .env | xargs)
node tools/write-env.js --dev
npx ng serve
```

`NG_APP_SUPABASE_URL` and `NG_APP_SUPABASE_ANON_KEY` are the same names you set on Vercel. Never put the service role in this app.

## Vercel

- Root directory: this folder.
- Framework: Angular, or Other.
- Build command: `node tools/write-env.js && npx ng build --configuration=production`
- Output: `dist/malta-quest/browser` (confirm after a local `npm run build`).
- Env: `NG_APP_SUPABASE_URL`, `NG_APP_SUPABASE_ANON_KEY` (anon public key only).
- `vercel.json` already rewrites SPA routes to `index.html`.

`tools/write-env.js` writes `src/environments/environment.prod.ts` from those env vars at build time.

## Supabase

1. New project, closest EU region.
2. Auth → enable **Anonymous** sign-ins. Enable **Email magic link** for the host. Add `http://localhost:4200` and your Vercel URL to redirect URLs.
3. SQL editor: run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`.
4. Database → Replication: tables in the migration are added to `supabase_realtime` (rooms, players, parties, candidates, stories, bubbles, polls).
5. Storage (later): bucket `story-images`. MVP uses `src/assets/stickers/`.
6. Copy Project URL + **anon public** key into the env vars above. Service role stays in the dashboard.

If those keys are empty, the client is not created and every screen still runs against the in-memory DEMO room.

## Stack lock

Angular 22 (`--ssr=false`), TypeScript, Tailwind CSS, `@supabase/supabase-js`. No Material, no Mapbox / Google / MapQuest tiles, no live news APIs.
# Armenia
