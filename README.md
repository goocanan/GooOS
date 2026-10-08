# GooOS

Content operations platform for Indonesian creators, UMKM, brands and agencies —
idea → planning → production → review → scheduling → publishing → analytics.

Built from the GooOS v1.0 PRD. This repository contains the full MVP: a
React SPA, a Fastify API, and a PostgreSQL schema.

---

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Vite 7 + React 19 + TypeScript + Tailwind v4 | Fast dev loop, no component-library dependency |
| Backend | Fastify 5 | Small surface, schema-first, good streaming/multipart support |
| Database | PostgreSQL via Drizzle ORM | PRD §36 is Postgres; Drizzle keeps the SQL portable |
| Auth | Better Auth | PRD §38; email + password with httpOnly session cookies |
| Validation | Zod, in `@gooos/shared` | One contract used by the API *and* the client |
| AI | Mock by default, OpenAI when configured | Works offline; no key required to run the app |
| Storage | Local filesystem | Stands in for S3/Supabase Storage (PRD §16) |

**No Docker or Postgres install is required.** With no `DATABASE_URL` set the API
runs an embedded PGlite database (real Postgres compiled to WASM) in-process. Point
`DATABASE_URL` at Neon/Supabase and the same schema and queries run unchanged.

---

## Layout

```
gooos/
├── apps/
│   ├── api/                  Fastify API + Drizzle schema + Better Auth
│   │   ├── src/
│   │   │   ├── config/env.ts     Zod-validated configuration, fails fast
│   │   │   ├── db/
│   │   │   │   ├── schema.ts     Drizzle tables for PRD §36 (30 tables)
│   │   │   │   ├── ddl.ts        Idempotent Postgres DDL, applied on boot
│   │   │   │   ├── client.ts     PGlite or node-postgres behind one type
│   │   │   │   └── seed.ts       Demo fixtures (PRD §46)
│   │   │   ├── plugins/
│   │   │   │   ├── auth.ts       Better Auth instance + /api/auth/* mount
│   │   │   │   └── context.ts    Session resolution, workspace scoping, RBAC
│   │   │   ├── routes/           core · content · library · analytics
│   │   │   ├── services/ai.ts    Mock and OpenAI providers behind one function
│   │   │   ├── lib/              errors, ids, serialize, storage, activity…
│   │   │   ├── smoke.ts          84 end-to-end API assertions
│   │   │   └── verify-boot.mjs   42 assertions on the SPA's boot contract
│   │   └── .env.example
│   └── web/                  React SPA
│       └── src/
│           ├── lib/api.ts       Typed fetch client (cookies + workspace header)
│           ├── lib/store.tsx    Reducer + async command surface
│           ├── components/       ui · charts · shell · modals
│           └── pages/            14 screens
└── packages/shared/         Enums, Zod schemas and DTO types used by both sides
```

`packages/shared` is the reason the two halves cannot drift: the SPA's state types
*are* the API's response types, and both validate writes with the same Zod schemas.

---

## Getting started

```bash
npm install
npm run dev
```

That starts both apps and seeds the demo data on first boot:

- SPA → <http://localhost:5180>
- API → <http://localhost:4000>

Sign in with the seeded account (pre-filled on the login screen):

```
james@goocanan3d.com  /  gooos123
```

> **Changing the demo password?** `DEMO_PASSWORD` in `apps/api/src/db/seed.ts`
> only applies when the demo account is *created*. The seeder treats "account
> exists" as up-to-date, so editing the constant on an existing database changes
> nothing and sign-in fails with `INVALID_EMAIL_OR_PASSWORD`. Run
> `npm run db:reset --workspace=@gooos/api` (or delete `apps/api/.data/`) and
> restart to re-seed.

### Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run the API and SPA together |
| `npm run dev:api` / `npm run dev:web` | Run one side only |
| `npm run seed` | Create demo fixtures (idempotent) |
| `npm run typecheck` | Typecheck every workspace |
| `npm run lint` | ESLint the SPA |
| `npm run build` | Production build of the SPA |
| `npm run verify` | 84 API assertions + 42 SPA boot-contract assertions |
| `npm run smoke --workspace=@gooos/api` | API suite only (needs the API running) |

### Deploying

`render.yaml` in the repo root is a Render blueprint. One **web service** serves
both the API and the SPA on a single origin:

| Setting | Value |
| --- | --- |
| Build command | `npm install --no-audit --no-fund && npm run build` |
| Start command | `node --import tsx apps/api/src/server.ts` |
| Health check path | `/api/health` |

### Why `npm install` and not `npm ci`

Vite, Rollup, esbuild and Tailwind v4 ship **platform-specific native binaries**
as optional dependencies. `package-lock.json` records only the binaries for the
platform it was generated on, so a lockfile produced on Windows contains no Linux
entries — and `npm ci` installs exactly what the lockfile says. The Linux build
then fails with:

```
Error: Cannot find module @rollup/rollup-linux-x64-gnu.
npm has a bug related to optional dependencies (npm/cli#4828)
```

`npm install` re-resolves optional dependencies for the platform it is running
on, so the deploy is correct no matter which machine produced the lockfile. The
committed lockfile does include every platform's binaries, so `npm ci` works too;
this is belt and braces rather than a dependency on it.

If you regenerate the lockfile and want `npm ci` to keep working, generate it
for the target platform as well:

```bash
npm install --package-lock-only --os=linux --cpu=x64
```

Two design points in the deployment are deliberate:

- **One service, one origin.** A split deployment (static site on one host, API
  on another) makes every session cookie cross-site, and Better Auth defaults to
  `SameSite=Lax`, which browsers refuse to send on cross-origin `fetch`. When the
  SPA is served by the API, cookies stay first-party and CORS is irrelevant.
- **`API_PUBLIC_URL` must equal the service URL.** It is auto-added to the CORS
  allowlist, because browsers send an `Origin` header even on same-origin POSTs.

Set these in the Render dashboard (all are `sync: false` in the blueprint):

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Supabase connection string. Empty falls back to embedded PGlite, which **loses data on every redeploy** — fine for a demo, not otherwise. Use the session pooler on the free tier so IPv6 resolves. |
| `BETTER_AUTH_SECRET` | Session signing key. Rotating it invalidates every session. |
| `BETTER_AUTH_URL` | The service's public URL, e.g. `https://gooos.onrender.com`. |
| `API_PUBLIC_URL` | Same URL. |

Two known production limitations, both documented in the blueprint:

- **Uploaded assets are ephemeral.** `LocalStorage` writes to the container
  filesystem, which Render wipes on every deploy. Implement an S3 driver
  (`apps/api/src/lib/storage.ts`) before relying on uploads.
- **The demo account is not seeded** in production (`NODE_ENV=production` turns
  `SEED_DEMO_USER` off). Create the first account through `/register`, or run
  `npm run seed` against the production database once.

The previous Next.js deployment config is preserved on the `legacy-v1` branch.

### Configuration

Every setting has a working default; copy `apps/api/.env.example` to
`apps/api/.env` to override. The values worth changing before deploying:

| Variable | Why |
| --- | --- |
| `BETTER_AUTH_SECRET` | Session signing key. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DATABASE_URL` | Switches from embedded PGlite to real Postgres |
| `CORS_ORIGINS` | Origins allowed to send credentialed requests |
| `AI_PROVIDER` / `OPENAI_API_KEY` | Real LLM instead of the local generator |
| `SEED_DEMO_USER` | Leave off outside development |

> Note: Node's `--env-file` silently skips a file that starts with a BOM. If you
> create `.env` with PowerShell, use `-Encoding utf8NoBOM`.

---

## API

Base URL `/api`. All routes except `/api/health` and `/api/auth/*` require a
session cookie. Workspace-scoped routes read the active tenant from the
`x-workspace-id` header and **validate it against a real membership row**, so a
client cannot reach another workspace by forging a header.

<details>
<summary><b>Session and workspace</b></summary>

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/session` | User, workspaces, active workspace, members |
| `POST` | `/api/session/workspace` | Switch active workspace |
| `POST` | `/api/auth/register` | Sign up, optionally with a first workspace |
| `GET` `POST` | `/api/workspaces` · `PATCH /api/workspaces/:id` | Workspace CRUD (admin+) |
| `GET` | `/api/team` | Members with workspace roles |
| `POST` | `/api/team/invite` | Add an existing account to the workspace (manager+) |
| `PATCH` `DELETE` | `/api/team/:userId` | Change role, deactivate, remove (manager+) |

</details>

<details>
<summary><b>Content, board and calendar</b></summary>

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/content` | Filters: `q`, `status`, `platform`, `brandId`, `campaignId`, `creatorId`, `priority`, `archived`, `sort`, `limit`, `offset` |
| `POST` | `/api/content` | Allocates the next `#NNNN` ref and creates platform variants |
| `GET` | `/api/content/:id` | Content + comments, approvals, analytics, versions, script, assets |
| `PATCH` | `/api/content/:id` | Writes a version snapshot of the previous state |
| `POST` | `/api/content/:id/move` | Board transition; stamps `publishedAt`, notifies reviewers, writes the activity log |
| `POST` | `/api/content/:id/duplicate` · `/api/content/bulk` · `DELETE /api/content/:id` | |
| `POST` | `/api/content/:id/schedule` | Queues a `scheduled_posts` row and returns a copy-and-publish payload (PRD §26) |
| `GET` | `/api/content/board` | Counts per status |
| `GET` | `/api/content/calendar` | Scheduled/published events in a date window |
| `POST` | `/api/content/:id/comments` | Timestamped comments; a `change_request` returns content to production |
| `POST` | `/api/content/:id/approve` | Records the approval row and moves status |
| `GET` `POST` `PATCH` | `/api/scripts` · `/api/scripts/:id` | `bumpVersion` snapshots into `script_versions` |

</details>

<details>
<summary><b>Library, analytics and cross-cutting</b></summary>

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/brands` · `/api/campaigns` | Campaign list includes a content rollup |
| `GET` `POST` | `/api/assets` | Multipart upload; `GET /api/assets/file/*` streams a blob |
| `PATCH` `DELETE` | `/api/assets/:id` · `/api/assets/:id/attach` | |
| `GET` `POST` `PATCH` `DELETE` | `/api/ideas` · `/api/ideas/:id/vote` · `/api/ideas/:id/convert` | Conversion creates the content server-side in one transaction |
| `GET` `PUT` | `/api/analytics` · `/api/content/:id/analytics` | Manual metric capture |
| `GET` | `/api/dashboard` · `/api/reports/monthly` | Aggregates for the dashboard and reports screens |
| `GET` | `/api/search` | Cross-entity search with `href` results |
| `GET` `PATCH` | `/api/notifications` · `/api/notifications/read-all` | |
| `GET` | `/api/activity` | Audit trail (PRD §39) |
| `POST` `GET` | `/api/ai/generate` · `/api/ai/runs` | Every run is persisted |
| `GET` | `/api/hashtags` | |

</details>

Errors always use one envelope:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed", "details": [...] } }
```

---

## Roles

PRD §5 scopes roles to a **workspace**, so they live in `workspace_members` and
not on the user record — one person can be Owner in one workspace and Client in
another. Authorisation compares tier, so a creator can never outrank a manager.

| Role | Tier | Can |
| --- | --- | --- |
| `owner` | 100 | Everything |
| `admin` | 90 | Manage users, delete brands |
| `manager` | 60 | Create content, schedule, publish, invite members, bulk actions |
| `creator` | 30 | Create and edit own content, comment |
| `reviewer` | 40 | Approve content |
| `client` | 10 | View and comment |

Creators and clients see only their own content unless they manage the workspace.

---

## Deliberate decisions

Things that look like omissions but are choices:

- **Better Auth's `admin` plugin is not enabled.** Its roles are account-global;
  PRD §5 scopes roles per workspace. Keeping both would mean two competing
  sources of truth for authorisation, so GooOS authorises exclusively
  through `workspace_members`.
- **No identity switching.** The prototype let you swap the signed-in user to
  preview RBAC. With real sessions that is impersonation, so the account menu now
  shows the actual account and links to Team for role management.
- **Notifications and the activity log are server-written.** Board moves,
  approvals and uploads log themselves via the API rather than the client
  fabricating entries, which keeps the audit trail trustworthy.
- **Publishing returns a payload, it does not post.** Real platform APIs are not
  connected; `POST /api/content/:id/schedule` returns a ready-to-paste
  copy-and-publish payload (PRD §26) and queues a `scheduled_posts` row for a
  future worker.
- **Analytics are captured manually.** No platform OAuth, so metrics are entered
  or seeded and `analytics_daily` provides the dashboard's daily rollup.
- **Avatar colours are derived, not stored.** `userById()` hashes the user id, so
  the same person looks the same on every surface without a DB column.
- **Local storage stands in for S3.** `LocalStorage` is a three-method class
  (`put`/`get`/`delete`); swapping in S3 means implementing it and changing one
  import. Object keys already follow the S3 convention.

---

## PRD coverage

| PRD area | Status |
| --- | --- |
| §5 Roles and permissions | Implemented (workspace-scoped) |
| §6 Workspaces | Implemented |
| §7 Brand and guidelines | Implemented |
| §8–12 Content, list, board, calendar, detail | Implemented |
| §13 Idea board and conversion | Implemented |
| §15 Scripts with versioning | Implemented |
| §16–18 Assets, folders, content linking | Implemented (local storage) |
| §19–20 Comments and approvals | Implemented |
| §21–22 Campaigns and hashtags | Implemented |
| §25–26 Scheduling and publishing | Partial — queue + copy-and-publish payload, no platform API calls |
| §27–28 AI assistant and Content Score | Implemented behind a provider interface (mock by default) |
| §29–30 Analytics | Implemented (manual capture) |
| §31 Reports | Implemented |
| §32 Notifications | Implemented (in-app; no email/WhatsApp delivery) |
| §33 Search | Implemented |
| §34 Dashboard | Implemented |
| §36 Database schema | Implemented — 30 tables, real Postgres enums |
| §38 Authentication | Implemented |
| §39 Audit log | Implemented |
| §43 Billing | Prices are static UI; no payment provider |
| §44 Next.js recommendation | Not used — a standalone Fastify API keeps the SPA deployable on any static host |

---

## Verification

```bash
npm run dev            # terminal 1
npm run verify         # terminal 2
```

`smoke.ts` walks the PRD flows against a live server: auth, content CRUD, board
transitions, approvals, scheduling, calendar, analytics input, duplication, bulk
actions, assets upload and retrieval, idea conversion, scripts, search, AI, audit
log, and cross-tenant isolation.

`verify-boot.mjs` reproduces the SPA's boot sequence request-for-request and
asserts that every field each page reads is actually present on the wire — the
check `tsc` cannot make, because the DTO types are shared rather than inferred
from responses.

Last run: **84/84** API assertions and **42/42** boot-contract assertions pass;
`tsc` is clean in all three workspaces; the SPA builds with 0 ESLint errors.

---

## Previous implementation

This repository replaced an earlier Next.js implementation of the same PRD.
That code is preserved on the **`legacy-v1`** branch. See
[MIGRATION.md](MIGRATION.md) for a feature-by-feature comparison and a suggested
order for porting the automation, webhook and publishing-OAuth work back.
