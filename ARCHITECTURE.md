# GooOS — Operating System for Your Content & Production Workflow

**Versi:** 0.0.1-alpha  
**Status:** Phase 1 (Auth + Workspace) — Scaffolding Selesai  
**Tech Stack:** Next.js 15 + TypeScript 5.9 + Tailwind 4 + shadcn/ui + Drizzle + PostgreSQL + Better Auth

---

## 📁 Struktur Monorepo

```
gooos/
├── apps/
│   └── studio/                    # Main app: Content Management Platform
│       ├── src/
│       │   └── app/
│       │       ├── layout.tsx      # Root layout + fonts
│       │       ├── globals.css     # Tailwind CSS + brand palette
│       │       ├── page.tsx        # Landing page + workspace cards
│       │       ├── dashboard/      # Dashboard overview
│       │       ├── w/[slug]/       # Workspace overview
│       │       └── auth/login/     # Auth pages
│       ├── next.config.ts
│       ├── tailwind.config.ts      # Brand colors: GooOS + GOOCANAN + KSM
│       ├── tsconfig.json           # Extends @gooos/config/nextjs
│       └── package.json
│
├── packages/
│   ├── config/                     # Shared TypeScript + tools config
│   │   ├── typescript/
│   │   │   ├── base.json          # ES2022, strict, bundler mode
│   │   │   ├── nextjs.json        # +DOM, jsx preserve, @/* alias
│   │   │   └── react-library.json # +jsx react-jsx
│   │   └── package.json
│   │
│   ├── db/                         # Drizzle ORM + PostgreSQL schema
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   └── index.ts       # 18 tables: users, workspaces, brands,
│   │   │   │                      # content, scripts, assets, comments,
│   │   │   │                      # approvals, analytics, ideas, etc.
│   │   │   ├── index.ts           # Drizzle client export
│   │   │   └── seed.ts            # Demo data: James, 3 workspaces
│   │   ├── drizzle.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── auth/                       # Better Auth configuration
│   │   ├── src/
│   │   │   └── index.ts           # Email + OAuth (Google, GitHub)
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── ui/                         # shadcn/ui component library (TODO)
│       ├── src/
│       │   ├── components/        # Button, Card, Dialog, etc.
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── tooling/
│   └── eslint/                     # Shared ESLint config (TODO)
│
├── pnpm-workspace.yaml             # Workspace config
├── turbo.json                      # Turborepo tasks: build, dev, lint, db:*
├── package.json                    # Root, dependencies: turbo, prettier, typescript
├── .pnpmrc                         # pnpm config
├── .npmrc                          # NPM config
└── README.md
```

---

## 🗄️ Database Schema (18 Tabel)

### Core
- **users** — Email, name, OAuth accounts, sessions
- **workspaces** — Workspace per account (GOOCANAN 3D, KSM, Personal)
- **workspace_members** — Multi-role access (owner, admin, manager, creator, reviewer, client)
- **brands** — Brand profile per workspace (logo, colors, guidelines)

### Content Pipeline
- **content** — Main content record (idea → published)
- **content_versions** — Version history + drafts
- **content_platforms** — Multi-platform per content (TikTok, IG Reel, YouTube, etc.)
- **scripts** — Hook, intro, body, scenes, CTA
- **comments** — Collaboration + threaded comments
- **approvals** — Approval workflow per reviewer

### Assets & Media
- **assets** — Images, video, STL, 3MF, documents
- **asset_folders** — Folder hierarchy
- **content_assets** — Link content to assets (role: thumbnail, main, b-roll)

### Planning & Organization
- **ideas** — Ideas → content pipeline
- **campaigns** — Campaign grouping
- **hashtags** — Tag library + reach/engagement stats
- **hashtag_groups** — Grouped hashtag sets

### Automation
- **platform_accounts** — OAuth tokens (TikTok, IG, YouTube, etc.)
- **scheduled_posts** — Scheduled publishing queue
- **analytics** — Daily stats per content (views, likes, engagement, CTR)
- **ai_generations** — AI usage log (idea, hook, script, caption, score)
- **notifications** — Task, approval, schedule alerts
- **activity_logs** — Audit trail

---

## 🎨 Brand Palette

**GooOS Studio** (Primary)
- Goo-600: `#9333ea` (Purple)
- Goo-700: `#7c3aed`

**GOOCANAN 3D**
- Maroon: `#8B1E3F`
- Rose Gold: `#D4AF37`

**KOPER SI MAMI (KSM)**
- Pastel Pink: `#FFB6C1`
- Rose: `#B76E79`

---

## 🚀 Getting Started

### Prerequisites
- Node.js v26.7.0+
- pnpm 12.8.1+
- PostgreSQL 14+ (or use Supabase/Neon for managed)

### Installation

```bash
# 1. Clone & navigate
cd gooos

# 2. Install dependencies (pnpm workspace)
pnpm install

# 3. Setup environment
cp .env.example .env.local
# Edit DATABASE_URL in .env.local

# 4. Run migrations
pnpm db:generate
pnpm db:push

# 5. Seed demo data
pnpm db:seed

# 6. Start dev server
pnpm dev
```

Dev server runs at:
- Studio: http://localhost:3000

---

## 📦 Workspace Scripts

### Root
```bash
pnpm dev          # Start all apps + packages (Turbo watch mode)
pnpm build        # Build all apps/packages
pnpm lint         # Lint all packages
pnpm format       # Format with Prettier
pnpm clean        # Clean build artifacts
```

### Database
```bash
pnpm db:generate  # Generate migrations from schema
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema to DB (dev)
pnpm db:studio    # Open Drizzle Studio (local query tool)
pnpm db:seed      # Seed demo data
```

### Per-Package
```bash
pnpm --filter @gooos/studio dev      # Next.js dev
pnpm --filter @gooos/db typecheck    # DB package typecheck
```

---

## ✅ Phase 1 Roadmap (Complete)

- [x] Monorepo setup (pnpm workspaces + Turbo)
- [x] TypeScript config (base/nextjs/react-library)
- [x] Database schema (Drizzle PostgreSQL, 18 tables)
- [x] Auth package (Better Auth + OAuth)
- [x] Next.js app scaffolding
- [x] Landing page + dashboard
- [x] Workspace overview pages
- [x] Login page
- [x] Tailwind + brand colors
- [ ] Auth implementation (register, login, session)
- [ ] Workspace creation flow
- [ ] Brand management UI
- [ ] Team invite & roles

---

## 📋 Upcoming Phases

**Phase 2:** Content CRUD + Kanban Board  
**Phase 3:** Content Calendar + Scheduling  
**Phase 4:** Asset Management + Upload  
**Phase 5:** Approval Workflow + Comments  
**Phase 6:** AI Assistant (idea, script, caption generation)  
**Phase 7:** Analytics Dashboard  
**Phase 8:** Social API Integration + Monetization  

---

## 🛠️ Development Notes

- **Transpile workspace packages** in Next.js (next.config.ts) untuk dev server
- **Use @/* alias** untuk absolute imports (configured in tsconfig)
- **Build scripts** (esbuild) skipped by pnpm 12 security policy — not blocking (dev + build still work)
- **Tailwind CSS v4** with `@tailwindcss/postcss` (new mode)
- **Drizzle Kit** untuk migrations: `db:generate` → `db:push`

---

## 📚 References

- PRD: `/attachments/pasted_content_2026-10-03_13-03-18-663_5b11ca.txt`
- Next.js: https://nextjs.org/docs
- Drizzle: https://orm.drizzle.team
- Better Auth: https://better-auth.js.org
- Tailwind CSS v4: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com

---

Built with ❤️ by James William Jokanan  
GOOCANAN · KOPER SI MAMI · GooOS  
**Precision in Every Layer • Precision in Every Workflow**
