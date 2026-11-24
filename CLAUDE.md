# CLAUDE.md

Read [AGENTS.md](AGENTS.md) too: this Next.js version has breaking changes, so read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.

One Next.js 16 app (App Router, Cache Components on): website, staff portal (`/portal`) and REST API (`/api/v1`). Stack: TypeScript, Tailwind CSS v4, shadcn/ui (Radix), MongoDB with Mongoose, Better Auth, Zod 4. Ask before adding any library outside the approved stack. The package manager is **npm**; use `npm run <script>`.

## Commands

```bash
npm run dev            # development server
npm run check          # lint + typecheck + knip + test (must pass before a phase is done)
npm run build          # production build (must pass)
npm run test:e2e       # Playwright (needs MongoDB; run `npm run build` first)
npm run db:indexes     # sync MongoDB indexes
npm run db:seed        # offices, settings, first Super Admin (asks once)
npm run format         # Prettier
```

## Rules

- **Layers:** route handler → service → repository → model. Only repositories import Mongoose models. Every file under `src/server/` starts with `import "server-only"`. No Server Actions for data changes. Check the session and permission on the server in every protected handler and page.
- **Style:** theme tokens only (no hex in components), icons only from `lucide-react`, Server Components by default, kebab-case files, enums defined once in `src/lib/constants/enums.ts`. No `any`, `@ts-ignore`, `console.log`, `TODO` or unused code. Open items go in `docs/open-questions.md`.
- **Data:** money is whole rupees in `...Pkr` fields; dates are UTC. CNIC numbers and financial details never appear in list queries or logs.
- **Docs:** there are exactly five files in `docs/` (see [README.md](README.md)). **Never add another docs file without asking.** Update the matching doc in the same commit as the code; do not repeat content across docs.
- **Git:** never run `git push`, force-push, or change git remotes without the user's explicit permission (`.claude/settings.json` denies `git push`). The user pushes.
- **Env:** one file, `.env` (git-ignored); `.env.example` is the committed template. Do not create `.env.local`. Never print values.
- **Done means:** `npm run check`, `npm run build` and `npm run test:e2e` pass, Knip reports nothing, and every placeholder is listed in `docs/open-questions.md`. Conventional Commits, one branch per build phase.

Details: [docs/architecture.md](docs/architecture.md) (layers, standards), [docs/design-system.md](docs/design-system.md) (tokens).
