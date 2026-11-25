# CLAUDE.md

Read [AGENTS.md](AGENTS.md) too: this Next.js version has breaking changes, so read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.

One Next.js 16 app (App Router, Cache Components on): website, staff portal (`/portal`) and REST API (`/api/v1`). Stack: TypeScript, Tailwind CSS v4, shadcn/ui (Radix), MongoDB with Mongoose, Better Auth, Zod 4. Ask before adding any library outside the approved stack. The package manager is **npm**; use `npm run <script>`.

## Commands

```bash
npm run dev            # development server
npm run check          # lint + typecheck + knip (must pass before a phase is done)
npm run build          # production build (must pass)
npm run db:indexes     # sync MongoDB indexes
npm run db:seed        # offices, settings, first Super Admin (asks once)
npm run format         # Prettier
```

## Rules

- **Layers:** route handler → service → repository → model. Only repositories import Mongoose models. Every file under `src/server/` starts with `import "server-only"`. No Server Actions for data changes. Check the session and permission on the server in every protected handler and page.
- **Style:** theme tokens only (no hex in components), icons only from `lucide-react`, Server Components by default, kebab-case files, enums defined once in `src/lib/constants/enums.ts`. No `any`, `@ts-ignore`, `console.log`, `TODO` or unused code. Open items go in `docs/open-questions.md`.
- **Data:** money is whole rupees in `...Pkr` fields; dates are UTC. CNIC numbers and financial details never appear in list queries or logs.
- **Docs:** there are exactly five files in `docs/` (see [README.md](README.md)). **Never add another docs file without asking.** Update the matching doc in the same commit as the code; do not repeat content across docs.
- **Git:** never run a git command that changes the repository: no `git add`, `commit`, `merge`, `rebase`, `reset`, `restore`, `stash`, `checkout`, `switch`, `cherry-pick`, `tag`, `pull` or `push`, and never create or delete branches.
  - Leave every change unstaged in the working tree. Don't unstage or touch anything that is already staged either. The user reviews, stages, commits, merges and pushes everything themselves.
  - Read-only commands are fine: `git status`, `git diff`, `git log`, `git show`, `git branch`.
  - When you finish a task, list the files you changed so the user can review and commit them.
  - `.claude/settings.json` denies the commands above.
- **UI:** use shadcn/ui components for everything (Table, Select, Input, Label, Textarea, Checkbox, Dialog, Button, …). Never use a native `<select>`, `<table>`, `<input>`, `<label>`, `<textarea>` or `<button>` in app code, and add no UI library beside shadcn (no TanStack Table or Query, no rich text editor: long text is a Textarea shown with `FormattedText`).
- **Env:** one file, `.env` (git-ignored); `.env.example` is the committed template. Do not create `.env.local`. Never print values. The database is MongoDB Atlas (the URI in `.env`, the `oedf-dev` database), never a local MongoDB. Email goes through Brevo SMTP everywhere, local development included; never ask for its values. There are no automated tests; never add test files or test packages without asking.
- **Done means:** `npm run check` and `npm run build` pass, Knip reports nothing, and every placeholder is listed in `docs/open-questions.md`. Conventional Commits, one branch per build phase.

Details: [docs/architecture.md](docs/architecture.md) (layers, standards), [docs/design-system.md](docs/design-system.md) (tokens).
