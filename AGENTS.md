# AGENTS.md

Cycle Green: a React 19 + Vite 8 single-page app (plain JSX, **no TypeScript**) for a Zambia tree-planting / carbon-credit platform. All state lives in a remote Supabase project.

## Repo layout quirk

The git root is the nested `cycle-green-main/` folder (i.e. `C:\Users\Najma\Desktop\cycle-green-main\cycle-green-main`), not the parent directory. Keep edits and new files inside that folder.

## Commands

```sh
npm install
npm run dev       # Vite dev server
npm run build     # production build
npm run lint      # ESLint (flat config, ignores dist/)
```

There is **no test framework and no typecheck script** — do not invent one. The only verification step is `npm run lint`.

## Backend / Supabase

- The database schema is **not in this repo** — it lives entirely in the remote Supabase project. `.env` (gitignored, currently present locally) provides `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, read via `import.meta.env`. Dev server won't work without it.
- Code depends on these remote objects (don't "fix" code if they're missing — they're infra-side): tables `user_roles`, `planting_records`, `credit_ledger`, and storage bucket `planting-evidence` (`src/lib/records.js`).
- Two DB triggers do work the app does not: `user_roles` row is created automatically on signup (from user metadata), and a `credit_ledger` row is created automatically when a record is verified. Comments in `src/lib/auth.js` / `records.js` mark these.
- All Supabase access goes through `src/lib/` modules (`supabaseClient.js`, `auth.js`, `records.js`) — pages should not import `@supabase/supabase-js` directly.

## Auth & routing flow

- `src/App.jsx:23-26` gates the whole app: until a session is confirmed (`getCurrentUser`), it renders `AuthForm` and no router. `BrowserRouter`/`Routes` only mount inside `AppShell` after auth.
- Roles: signup stores the chosen role in user metadata, but the `user_roles` table is the source of truth (`src/lib/auth.js` `getCurrentUserRole`, `src/lib/useUserRole.js`). Role string is `'admin'`.
- The Admin Review nav link and route (`/admin`, `src/components/ProtectedRoute.jsx`) only show for `role === 'admin'`.
- Routes: `/` Submission, `/my-records` MyRecords, `/admin` AdminReview (admin-only), `/ledger` Ledger.

## Quirks

- `leaflet/dist/leaflet.css` must be imported for the map to render correctly — it is imported in `src/App.jsx`.
- Styling is plain CSS in `src/index.css` / `src/App.css` (no CSS framework). `dist/` and `node_modules/` are gitignored.
- `src/me` is an empty leftover file — ignore it.
- Note: this is a client-side-only app; the anon key in `.env` is public, but avoid committing secrets.
