# Setup and Deployment

## Local setup

Prerequisites: Node.js 24+, npm, access to the project's MongoDB Atlas cluster (your IP address added under Atlas → Network Access), and Docker for Mailpit, the local email inbox.

```bash
npm install
cp .env.example .env            # then fill in the four values
docker compose up -d mailpit    # Mailpit, the local email inbox (http://localhost:8025)
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
| `npm run db:indexes` / `db:seed`      | Sync indexes from the schemas / seed (both read `.env`)        |
| `npm run db:seed:sample`              | Development sample content (never in production)               |
| `npm run check`                       | `lint`, `typecheck`, `knip` and `test` in sequence             |

## Environment variables

Validated by `src/env.ts` and checked on every start and build; the error names the variable and never prints its value. Copy `.env.example` to `.env` and never commit it. **Local development needs four lines** (`NEXT_PUBLIC_SITE_URL`, `MONGODB_URI`, `BETTER_AUTH_SECRET`, `CLOUDINARY_FOLDER`; add `CLOUDINARY_URL` to try uploads). Everything else has a development default and becomes required only on a real deployment (a site URL that is not `localhost`).

| Variable                                                 | Where                                                     | Purpose                                                                                                                                                                   |
| -------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                   | Always                                                    | The site's address (links, metadata, same-origin check). Auth uses it too                                                                                                 |
| `MONGODB_URI`                                            | Always                                                    | Connection string; must be a replica set (`docker compose up -d` provides one)                                                                                            |
| `BETTER_AUTH_SECRET`                                     | Always                                                    | Session signing secret, 32+ characters (`openssl rand -base64 32`)                                                                                                        |
| `CLOUDINARY_FOLDER`                                      | Always                                                    | Folder for every upload: `oedf-dev` locally, `oedf-preview` on previews, `oedf` in production. Never derived from the site URL, so a preview cannot write into production |
| `CLOUDINARY_URL`                                         | Deployment (dev: uploads say "not configured" until set)  | `cloudinary://<key>:<secret>@<cloud>`; Cloudinary console, Settings, API Keys, "API environment variable"                                                                 |
| `SMTP_URL`                                               | Deployment (dev default: Mailpit `smtp://localhost:1025`) | Mail server, for example `smtps://user:password@host:465`                                                                                                                 |
| `EMAIL_FROM`                                             | Deployment (dev default: `OEDF <no-reply@localhost>`)     | The "from" address on every email                                                                                                                                         |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Deployment (dev: the spam check is skipped)               | Spam check keys, from the Cloudflare Turnstile dashboard                                                                                                                  |
| `CRON_SECRET`                                            | Deployment (dev: the cleanup endpoint refuses every call) | Protects the daily upload cleanup call; 32+ characters                                                                                                                    |

Derived, so not variables: the log level (debug in development, info in production, silent in tests), the Cloudinary cloud name (from `CLOUDINARY_URL`), and the auth base URL (the site URL). The first Super Admin's email and password are **not** configuration: `npm run db:seed` asks for them once (or takes `--email` and `--password`) and stores the account in the database. Secrets are never pasted into chat or committed.

## Testing

**Database: MongoDB Atlas, never a local MongoDB** (the client's decision). Locally `.env` points at the development database `oedf-dev`; production's `oedf` is set only on the host. `npm run dev`, the `db:*` scripts and the e2e tests use `oedf-dev`. The seeds are safe to repeat; `db:seed:sample` adds content labelled as sample. **Tests never touch production or a real account:** the e2e global setup refuses any database whose name does not end in `-dev` or `-test` (a local one is allowed, for CI), creates a throwaway Super Admin for the run (`tests/e2e/test-accounts.ts`), and the global teardown removes it with everything the tests made: invited Staff accounts, their sessions and audit entries, contact messages, and records with year-2099 reference numbers. Vitest uses an in-memory database. CI uses its own MongoDB service container.

A phase is done only when `npm run check`, `npm run build` and `npm run test:e2e` pass.

- **Unit and integration (Vitest):** tests sit next to the code (`*.test.ts`). `tests/global-setup.ts` starts one in-memory MongoDB replica set; `tests/setup.ts` gives each test file its own empty database and stubs `server-only`. Mongoose is never mocked. Tests in one file share its database, so clear collections in `beforeEach` when a test needs a clean state. Test variables are in `vitest.config.ts`. Target: 80% or more of lines in `src/server/services/` and `src/lib/validations/` (`npx vitest run --coverage`). Every service function gets the success path, a permission failure and each business-rule failure.
- **End to end (Playwright):** specs in `tests/e2e/`, run in a desktop and a mobile (Pixel 7) profile, with `@axe-core/playwright` failing on serious or critical issues. `playwright.config.ts` starts `npm run start` (port 3000, or `PORT`; an already-running server on that port is reused), so run `npm run build` first with MongoDB running and the `.env` variables set. The public-page tests need `npm run db:seed:sample`. Axe checks every page; the fixed header is checked without the color-contrast rule because axe cannot read the gradient behind its glass background. The signed-in portal tests use the throwaway Super Admin from the global setup, so no account details are needed; the invitation test also needs `MAILPIT_URL`. Sign-in is limited to 5 a minute per address, so wait a minute between two full runs. Locally the tests use the installed Google Chrome; CI installs Playwright's Chromium.
- **CI** (`.github/workflows/ci.yml`): `npm ci`, format check, lint, typecheck, Knip, tests, build and `npm audit --audit-level=high`; then an e2e job that starts a MongoDB replica set and Mailpit and seeds a CI-only admin (`--email`/`--password` flags) and the sample content.

## Uploads, email and the cleanup job

- **Mailpit** (`docker compose up -d`) catches every email locally: http://localhost:8025.
- **Cleanup job:** the host's daily cron calls `POST /api/v1/internal/cleanup-uploads` with `Authorization: Bearer <CRON_SECRET>` (a `GET` works too, for Vercel cron). It deletes uploads still `pending` after 24 hours and never touches saved files. Without `CRON_SECRET` the endpoint refuses everyone.
- **Test records:** some e2e tests insert their own records straight into MongoDB (`tests/e2e/db.ts`, reference numbers in the year 2099) and delete them afterwards. `playwright.config.ts` loads `.env` for this, and the app server it starts inherits the same `MONGODB_URI`, so a `.env.local` cannot point the tests at another database.
- **Real-upload tests:** `E2E_REAL_UPLOADS=1 MAILPIT_URL=<Mailpit web address> npm run test:e2e` uploads real files to the Cloudinary account in `.env` (folder `oedf-dev`). The applicant flow reads the emails from Mailpit; its files stay until you delete that folder. The staff test (`real-uploads-staff.spec.ts`) publishes a program with a photo, checks it on the public page and card, adds a signed agreement PDF and opens it through the 5-minute staff link; the global teardown deletes those files from Cloudinary.
- **Screenshots:** every page the accessibility check visits, and a few finished states (`capture()` in `tests/e2e/screenshots.ts`), are saved per device in `test-results/screenshots/` during the run, before the teardown removes the test records. Every review includes them.
- **After fixing a failure, run the whole suite again**, not only the fixed spec, before reporting.
- **Public forms in tests:** each test sends its own `x-forwarded-for` to `/api/v1`, so the 5-per-10-minutes limit never trips.

## Deployment (planned, Phase 7)

Default host: Vercel with MongoDB Atlas and Cloudinary. To be confirmed with the client and written up step by step in Phase 7. Checklist:

- **MongoDB Atlas:** cluster, database user, network access for the host, backups on; run `npm run db:indexes` on every deploy.
- **Cloudinary:** PDF and ZIP delivery on; **no unsigned upload preset** (every upload is signed); **Strict Transformations off, on purpose** (see architecture.md, "Files"); one folder per environment, derived from `NODE_ENV` (`oedf` in production, `oedf-dev` otherwise); personal documents and signed agreements stored as authenticated assets; photos for the public site are ordinary (public) uploads, resized on delivery.
- **Upload cleanup:** the host's daily cron calls `POST /api/v1/internal/cleanup-uploads` with `CRON_SECRET` (`vercel.json` when on Vercel).
- **Turnstile and SMTP:** production keys and provider; **domain and SSL**; set every environment variable in the host.
- **After deploy:** health probe on `/api/v1/health`, Super Admin can sign in, apply each monthly Next.js security release.
