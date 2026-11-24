# Setup and Deployment

## Local setup

Prerequisites: Node.js 24+, npm, Docker (or a free MongoDB Atlas cluster, which always runs as a replica set).

```bash
npm install
cp .env.example .env.local      # then fill in the values
docker compose up -d            # local MongoDB replica set and Mailpit (inbox at http://localhost:8025)
npm run db:indexes              # create the indexes
npm run db:seed                 # offices, settings, first Super Admin
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

Validated by `src/env.ts` and checked on every start and build; the error names the variable and never prints its value. Copy `.env.example` to `.env.local` and never commit it. A variable is added by the phase that first uses it.

| Variable                                  | Purpose                                                                                | Example                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                    | Canonical site URL (metadata, Origin check)                                            | `http://localhost:3000`                         |
| `MONGODB_URI`                             | Connection string; must be a replica set                                               | `mongodb://localhost:27017/oedf?replicaSet=rs0` |
| `BETTER_AUTH_SECRET`                      | Session signing secret, 32+ characters (`openssl rand -base64 32`)                     | (generated)                                     |
| `BETTER_AUTH_URL`                         | Auth base URL, same as the site URL                                                    | `http://localhost:3000`                         |
| `LOG_LEVEL`                               | Optional: `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`; default `info` | `debug`                                         |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | First Super Admin, used only by `npm run db:seed` (password 12+)                       | (set locally)                                   |

Coming in Phase 4: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`; `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_FOLDER`; `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`; `CRON_SECRET`. Secrets are never pasted into chat or committed.

## Testing

A phase is done only when `npm run check`, `npm run build` and `npm run test:e2e` pass.

- **Unit and integration (Vitest):** tests sit next to the code (`*.test.ts`). `tests/global-setup.ts` starts one in-memory MongoDB replica set; `tests/setup.ts` gives each test file its own empty database and stubs `server-only`. Mongoose is never mocked. Tests in one file share its database, so clear collections in `beforeEach` when a test needs a clean state. Test variables are in `vitest.config.ts`. Target: 80% or more of lines in `src/server/services/` and `src/lib/validations/` (`npx vitest run --coverage`). Every service function gets the success path, a permission failure and each business-rule failure.
- **End to end (Playwright):** specs in `tests/e2e/`, run in a desktop and a mobile (Pixel 7) profile, with `@axe-core/playwright` failing on serious or critical issues. `playwright.config.ts` starts `npm run start` (port 3000, or `PORT`; an already-running server on that port is reused), so run `npm run build` first with MongoDB running and the `.env.local` variables set. The public-page tests need `npm run db:seed:sample`. Axe checks every page; the fixed header is checked without the color-contrast rule because axe cannot read the gradient behind its glass background. The signed-in portal test runs only when `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set and the admin is seeded. Locally the tests use the installed Google Chrome; CI installs Playwright's Chromium.
- **CI** (`.github/workflows/ci.yml`): `npm ci`, format check, lint, typecheck, Knip, tests, build and `npm audit --audit-level=high`; then an e2e job that starts a MongoDB replica set and Mailpit and seeds a CI-only admin and the sample content.

## Deployment (planned, Phase 7)

Default host: Vercel with MongoDB Atlas and Cloudinary. To be confirmed with the client and written up step by step in Phase 7. Checklist:

- **MongoDB Atlas:** cluster, database user, network access for the host, backups on; run `npm run db:indexes` on every deploy.
- **Cloudinary:** Strict Transformations on (so private images cannot be requested transformed), PDF delivery allowed, folders per environment (`CLOUDINARY_FOLDER`), personal documents stored as private assets.
- **Upload cleanup:** the host's daily cron calls `POST /api/v1/internal/cleanup-uploads` with `CRON_SECRET` (`vercel.json` when on Vercel).
- **Turnstile and SMTP:** production keys and provider; **domain and SSL**; set every environment variable in the host.
- **After deploy:** health probe on `/api/v1/health`, Super Admin can sign in, apply each monthly Next.js security release.
