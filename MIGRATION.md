# Migration notes: legacy Next.js `main` → GooOS SPA + API

The previous `main` branch is preserved on **`legacy-v1`**. This document records
what that implementation had that the current one does not, and vice versa, so
nothing valuable is lost and porting decisions can be made deliberately.

```powershell
git checkout legacy-v1      # inspect the old Next.js app
git checkout main           # back to the current implementation
```

View it on GitHub without checking out: <https://github.com/goocanan/GooOS/tree/legacy-v1>

---

## Why the change

The brief was to replace the UI. The previous app was a working Next.js
implementation of the same ContentFlow PRD, so this was not a prototype being
discarded — it was one architecture being swapped for another.

| | `legacy-v1` | `main` (now) |
| --- | --- | --- |
| Frontend | Next.js App Router, React Server Components | Vite 7 SPA, React 19 |
| Backend | Next.js route handlers | Standalone Fastify 5 server |
| Styling | shadcn/ui + Tailwind | Hand-rolled components + Tailwind v4 |
| Package manager | pnpm workspaces + Turborepo | npm workspaces |
| Database | Postgres via Drizzle, versioned migrations | Postgres via Drizzle, idempotent DDL applied on boot |
| Local database | Docker Compose Postgres | Embedded PGlite — no install required |
| Deploy | `render.yaml`, `docker-compose.yml`, `setup-dev.sh` | none yet |
| Database tables | 32 | 30 |
| Verification | none found | 84 API + 42 boot-contract assertions |

Both are Drizzle + Postgres + Better Auth, and both follow PRD §36, so the domain
model is largely shared — which is what makes porting tractable.

---

## In `legacy-v1`, not yet in `main`

These are the features worth porting back. Ordered by how much they matter.

### 1. Automation rules — *not ported*

`apps/studio/src/app/api/workspaces/[slug]/automation/route.ts`
`apps/studio/src/app/api/workspaces/[slug]/automation/[ruleId]/route.ts`

Trigger → action rules (for example "when a content enters review, notify the
reviewer"). PRD §12 mentions automation, so this is a real gap.

To port: add `automation_rules` to `apps/api/src/db/schema.ts` and
`src/db/ddl.ts`, add a matching Zod schema in `packages/shared/src/schemas.ts`,
then a `src/routes/automation.ts`. The evaluator would slot into
`plugins/context.ts`, which already resolves the actor on every request.

### 2. Webhooks — *not ported*

`apps/studio/src/app/api/workspaces/[slug]/webhooks/route.ts`
`apps/studio/src/app/api/workspaces/[slug]/webhooks/[webhookId]/route.ts`

Outbound HTTP notifications on domain events. PRD §37 lists integrations.

To port: `webhooks` table plus a signing helper (HMAC over the body, timestamp
in the header to prevent replay) and a small dispatch queue. `lib/activity.ts`
is the natural place to trigger it, since every mutating route already logs there.

### 3. Publishing account connections — *partially ported*

`apps/studio/src/app/api/workspaces/[slug]/publishing/accounts/route.ts`

`main` has the `platform_accounts` table and seeds rows for it, but **no OAuth
flow** — connecting a TikTok or Instagram account is not implemented, so
`connected` is always `false` for real use. Publishing returns a
copy-and-publish payload instead (PRD §26).

This is the largest remaining functional gap and the one that most affects
whether GooOS can publish unattended.

### 4. Onboarding flow — *not ported*

`apps/studio/src/app/auth/onboarding/page.tsx`

`main` provisions a first workspace automatically inside
`plugins/context.ts` → `createDefaultWorkspace()` when a signed-in user has none.
That works, but there is no guided onboarding UI.

### 5. Deployment configuration — *not ported*

`render.yaml`, `docker-compose.yml`, `setup-dev.sh`, `.node-version`, `turbo.json`

`main` ships no deployment setup. Copying `render.yaml` across needs one change:
it must build and run `apps/api` with `DATABASE_URL` pointing at real Postgres,
because the embedded PGlite store is a single-node local file.

### 6. Shared UI and config packages — *not ported*

`packages/ui` (shadcn/ui), `packages/config/typescript/*.json`,
`packages/auth`, `packages/ai`

`main` keeps UI primitives in `apps/web/src/components/ui.tsx` and the shared
contract in `packages/shared`. Extract a `packages/ui` only if a second app
(the planned GooOS Flow / Print / Market in the old README) actually needs it.

---

## In `main`, not in `legacy-v1`

Worth keeping in mind when deciding how much to port back.

| Feature | Where |
| --- | --- |
| **Campaigns** screen and API | `apps/api/src/routes/core.ts`, `apps/web/src/pages/Campaigns.tsx` |
| **Ideas** board with idea → content conversion | `apps/api/src/routes/library.ts`, `apps/web/src/pages/Ideas.tsx` |
| **Scripts** with block editing and version snapshots | `apps/api/src/routes/content.ts`, `apps/web/src/pages/Scripts.tsx` |
| **Monthly reports** with CSV / Markdown export | `apps/api/src/routes/analytics.ts`, `apps/web/src/pages/Reports.tsx` |
| **Bulk actions** on the content list | `apps/api/src/routes/content.ts` → `POST /api/content/bulk` |
| **Workspace-scoped RBAC** with tier checks | `apps/api/src/plugins/context.ts` |
| **Audit log** on every mutation | `apps/api/src/lib/activity.ts` |
| **Version history** for content and scripts | `content_versions`, `script_versions` |
| **Test suites** (126 assertions) | `apps/api/src/smoke.ts`, `apps/api/verify-boot.mjs` |
| **Zero-install database** | `apps/api/src/db/client.ts` (PGlite) |
| **Server-owned notifications and audit trail** | clients cannot fabricate log entries |

The old `legacy-v1` app had no automated tests, which is the main reason a
refactor of this size stayed safe here.

---

## Suggested order if you port features back

1. **Publishing account OAuth** — without it, scheduling is manual by design.
2. **Automation rules** — the largest workflow win, and PRD §12 expects it.
3. **Webhooks** — only useful once 1 and 2 exist to emit events.
4. **Deployment config** — do this before you need it, not after.
5. **Onboarding** — polish, not function.

Each is additive: add the table to `schema.ts` **and** `ddl.ts` (the boot-time
DDL is separate from the Drizzle schema — both must be updated), add the Zod
schema to `packages/shared`, then the route. The migration is idempotent, so
adding a table and restarting is enough; no manual migration step is needed.
