# GooOS — Operating System for Your Content & Production Workflow

> Precision in Every Workflow.

Umbrella monorepo untuk ekosistem GOOCANAN:

```
GOOCANAN
├── GooOS Studio  → Content Management (ContentFlow PRD)
├── GooOS Flow    → 3D Printing Operations
├── GooOS Print   → Slicer integration (rencana)
└── GooOS Market  → Marketplace / catalog (rencana)
```

## Struktur

```
gooos/
├── apps/
│   └── studio/          # GooOS Studio (Next.js)
├── packages/
│   ├── db/              # Drizzle schema + migrations (PostgreSQL)
│   ├── ui/              # shadcn/ui shared
│   ├── auth/            # Better Auth config (multi-workspace)
│   ├── ai/              # AI assistant layer
│   └── config/          # Shared TS/ESLint config
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Quickstart

```bash
pnpm install
pnpm dev        # semua apps
# atau
pnpm --filter @gooos/studio dev
```

## Tech

- Frontend: Next.js + TypeScript + Tailwind + shadcn/ui
- Backend: Next.js API / Node.js
- DB: PostgreSQL + Drizzle ORM
- Auth: Better Auth
- Storage: S3 / Supabase Storage
- Queue: Redis + BullMQ (V2)
- AI: OpenAI API / LLM lain
