# Setup and Deployment

## Local setup

Prerequisites: Node.js 24+, npm, Docker (or a free MongoDB Atlas cluster, which always runs as a replica set).

```bash
npm install
cp .env.example .env.local      # then fill in the four values
docker compose up -d            # local MongoDB replica set and Mailpit (inbox at http://localhost:8025)
npm run db:indexes              # create the indexes
npm run db:seed                 # offices, settings; asks once for the first Super Admin's email and password
npm run db:seed:sample          # optional: labelled sample content so public pages have data
npm run dev                     # http://localhost:3000
```

| Script                                | What it does                                                   |
| ------------------------------------- | -------------------------------------------------------------- |
| `npm run dev` / `build` / `start`     | Next.js                                                        |
| `npm run lint` / `typecheck` / `knip` | ESLint, `tsc --noEmit`, unused files, exports and dependencies |
| `npm run format` / `format:check`     | Prettier write / check                                         |
| `npm run test` / `test:watch`         | Vitest with an in-memory MongoDB replica set                   |
| `npm run test:e2e`                    | Playwright (needs MongoDB and a built app)                     |
| `npm run db:indexes` / `db:seed`      | Sync indexes from the schemas / seed (both read `.env.local`)  |
| `npm run db:seed:sample`              | Development sample content (never in production)               |
| `npm run check`                       | `lint`, `typecheck`, `knip` and `test` in sequence             |

## Environment variables

Validated by `src/env.ts` and checked on every start and build; the error names the variable and never prints its value. Copy `.env.example` to `.env.local` and never commit it. **Local development needs three lines** (a fourth, `CLOUDINARY_URL`, to try uploads). Everything else has a development default and becomes required only on a real deployment (a site URL that is not `localhost`).

| Variable                                                 | Where                                                     | Purpose                                                                                                   |
| -------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                   | Always                                                    | The site's address (links, metadata, same-origin check). Auth uses it too                                 |
| `MONGODB_URI`                                            | Always                                                    | Connection string; must be a replica set (`docker compose up -d` provides one)                            |
| `BETTER_AUTH_SECRET`                                     | Always                                                    | Session signing secret, 32+ characters (`openssl rand -base64 32`)                                        |
| `CLOUDINARY_URL`                                         | Deployment (dev: uploads say "not configured" until set)  | `cloudinary://<key>:<secret>@<cloud>`; Cloudinary console, Settings, API Keys, "API environment variable" |
| `SMTP_URL`                                               | Deployment (dev default: Mailpit `smtp://localhost:1025`) | Mail server, for example `smtps://user:password@host:465`                                                 |
| `EMAIL_FROM`                                             | Deployment (dev default: `OEDF <no-reply@localhost>`)     | The "from" address on every email                                                                         |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Deployment (dev: the spam check is skipped)               | Spam check keys, from the Cloudflare Turnstile dashboard                                                  |
| `CRON_SECRET`                                            | Deployment (dev: the cleanup endpoint refuses every call) | Protects the daily upload cleanup call; 32+ characters                                                    |

Derived, so not variables: the log level (debug in development, info in production, silent in tests), the Cloudinary cloud name and folder (from `CLOUDINARY_URL` and `NODE_ENV`: `oedf` in production, `oedf-dev` otherwise), and the auth base URL (the site URL). The first Super Admin's email and password are **not** configuration: `npm run db:seed` asks for them once (or takes `--email` and `--password`) and stores the account in the database. Secrets are never pasted into chat or committed.

## Testing

A phase is done only when `npm run check`, `npm run build` and `npm run test:e2e` pass.

- **Unit and integration (Vitest):** tests sit next to the code (`*.test.ts`). `tests/global-setup.ts` starts one in-memory MongoDB replica set; `tests/setup.ts` gives each test file its own empty database and stubs `server-only`. Mongoose is never mocked. Tests in one file share its database, so clear collections in `beforeEach` when a test needs a clean state. Test variables are in `vitest.config.ts`. Target: 80% or more of lines in `src/server/services/` and `src/lib/validations/` (`npx vitest run --coverage`). Every service function gets the success path, a permission failure and each business-rule failure.
- **End to end (Playwright):** specs in `tests/e2e/`, run in a desktop and a mobile (Pixel 7) profile, with `@axe-core/playwright` failing on serious or critical issues. `playwright.config.ts` starts `npm run start` (port 3000, or `PORT`; an already-running server on that port is reused), so run `npm run build` first with MongoDB running and the `.env.local` variables set. The public-page tests need `npm run db:seed:sample`. Axe checks every page; the fixed header is checked without the color-contrast rule because axe cannot read the gradient behind its glass background. The signed-in portal test runs only when `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` are set in the shell to the Super Admin you created with `db:seed`. Locally the tests use the installed Google Chrome; CI installs Playwright's Chromium.
- **CI** (`.github/workflows/ci.yml`): `npm ci`, format check, lint, typecheck, Knip, tests, build and `npm audit --audit-level=high`; then an e2e job that starts a MongoDB replica set and Mailpit and seeds a CI-only admin (`--email`/`--password` flags) and the sample content.

## Deployment (planned, Phase 7)

Default host: Vercel with MongoDB Atlas and Cloudinary. To be confirmed with the client and written up step by step in Phase 7. Checklist:

- **MongoDB Atlas:** cluster, database user, network access for the host, backups on; run `npm run db:indexes` on every deploy.
- **Cloudinary:** PDF and ZIP delivery on; **no unsigned upload preset** (every upload is signed); **Strict Transformations off, on purpose** (see architecture.md, "Files"); one folder per environment, derived from `NODE_ENV` (`oedf` in production, `oedf-dev` otherwise); personal documents stored as authenticated assets.
- **Upload cleanup:** the host's daily cron calls `POST /api/v1/internal/cleanup-uploads` with `CRON_SECRET` (`vercel.json` when on Vercel).
- **Turnstile and SMTP:** production keys and provider; **domain and SSL**; set every environment variable in the host.
- **After deploy:** health probe on `/api/v1/health`, Super Admin can sign in, apply each monthly Next.js security release.
