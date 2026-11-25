# Setup and Deployment

## Local setup

Prerequisites: Node.js 24+, npm, access to the project's MongoDB Atlas cluster (your IP address added under Atlas → Network Access), and a Brevo SMTP login and key for outgoing email (Brevo is used locally too).

```bash
npm install
cp .env.example .env            # then fill in the empty values
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
| `npm run db:indexes` / `db:seed`      | Sync indexes from the schemas / seed (both read `.env`)        |
| `npm run db:seed:sample`              | Development sample content (never in production)               |
| `npm run check`                       | `lint`, `typecheck` and `knip` in sequence                     |

## Environment variables

Validated by `src/env.ts` and checked on every start and build; the error names the variable and never prints its value. Copy `.env.example` to `.env` and never commit it. **Local development needs six lines** (`NEXT_PUBLIC_SITE_URL`, `MONGODB_URI`, `BETTER_AUTH_SECRET`, `CLOUDINARY_FOLDER`, `SMTP_URL`, `EMAIL_FROM`; `.env.example` shows the Brevo format for the last two; add `CLOUDINARY_URL` to try uploads). Nothing has a built-in default. The rest become required only on a real deployment (a site URL that is not `localhost`).

| Variable               | Where                                                     | Purpose                                                                                                                                                                   |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | Always                                                    | The site's address (links, metadata, same-origin check). Auth uses it too                                                                                                 |
| `MONGODB_URI`          | Always                                                    | Connection string; must be a replica set (Atlas clusters are)                                                                                                             |
| `BETTER_AUTH_SECRET`   | Always                                                    | Session signing secret, 32+ characters (`openssl rand -base64 32`)                                                                                                        |
| `CLOUDINARY_FOLDER`    | Always                                                    | Folder for every upload: `oedf-dev` locally, `oedf-preview` on previews, `oedf` in production. Never derived from the site URL, so a preview cannot write into production |
| `CLOUDINARY_URL`       | Deployment (dev: uploads say "not configured" until set)  | `cloudinary://<key>:<secret>@<cloud>`; Cloudinary console, Settings, API Keys, "API environment variable"                                                                 |
| `SMTP_URL`             | Always                                                    | Brevo: `smtps://<SMTP login>:<SMTP key>@smtp-relay.brevo.com:465`, from Brevo, SMTP & API. An `@` in the login is written `%40`                                           |
| `EMAIL_FROM`           | Always                                                    | The "from" address on every email, for example `OEDF <contact@oed-foundation.org>`; must be a sender or domain verified in Brevo                                          |
| `CRON_SECRET`          | Deployment (dev: the cleanup endpoint refuses every call) | Protects the daily upload cleanup call; 32+ characters                                                                                                                    |

Derived, so not variables: the log level (debug in development, info in production), the Cloudinary cloud name (from `CLOUDINARY_URL`), and the auth base URL (the site URL). The first Super Admin's email and password are **not** configuration: `npm run db:seed` asks for them once (or takes `--email` and `--password`) and stores the account in the database. Secrets are never pasted into chat or committed.

## Database and checks

**Database: MongoDB Atlas, never a local MongoDB** (the client's decision). Locally `.env` points at the development database `oedf-dev`; production's `oedf` is set only on the host. `npm run dev` and the `db:*` scripts use `oedf-dev`. The seeds are safe to repeat; `db:seed:sample` adds content labelled as sample.

A phase is done when `npm run check` (lint, typecheck, Knip) and `npm run build` pass. The project has no automated tests; changes are checked by hand in the browser, and each deploy by the go-live smoke test below. **CI** (`.github/workflows/ci.yml`) runs `npm ci`, the format check, lint, typecheck, Knip, the build and `npm audit --audit-level=high`.

## Uploads, email and the cleanup job

- **Email** goes through Brevo everywhere, including local development, so every email really arrives: use your own address when you try a form locally.
- **Cleanup job:** the host's daily cron calls `POST /api/v1/internal/cleanup-uploads` with `Authorization: Bearer <CRON_SECRET>` (a `GET` works too, for Vercel cron). It deletes uploads still `pending` after 24 hours and never touches saved files. Without `CRON_SECRET` the endpoint refuses everyone.

## Deployment (Vercel, MongoDB Atlas, Cloudinary)

The owner connects the GitHub repository to Vercel and pushes; nothing is deployed from a developer machine. Production deploys from `main`; the `staging` branch deploys to `https://staging.oed-foundation.org` (D50). The domain and sending address are placeholders until the client confirms them (C1).

**Environment variables** (Vercel, Settings, Environment Variables). The owner enters every secret there directly; secrets are never pasted into chat, email or a ticket. The app refuses to build when one is missing or malformed, and names it without printing the value.

| Variable               | Production                                                                                   | Preview                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | `https://www.oed-foundation.org` (C1)                                                        | `https://staging.oed-foundation.org` (the same-origin check compares against it) |
| `MONGODB_URI`          | Atlas string ending `/oedf`                                                                  | Same cluster, ending `/oedf-preview` (never `/oedf`)                             |
| `BETTER_AUTH_SECRET`   | 32+ random characters (`openssl rand -base64 32`)                                            | A different value                                                                |
| `CLOUDINARY_URL`       | `cloudinary://<key>:<secret>@<cloud>`                                                        | Same account                                                                     |
| `CLOUDINARY_FOLDER`    | `oedf`                                                                                       | `oedf-preview`                                                                   |
| `SMTP_URL`             | Brevo `smtps://<SMTP login>:<SMTP key>@smtp-relay.brevo.com:465` (`@` in the login as `%40`) | Same                                                                             |
| `EMAIL_FROM`           | `OEDF <contact@oed-foundation.org>`                                                          | Same                                                                             |
| `CRON_SECRET`          | 32+ random characters; Vercel sends it to the cron job                                       | A different value                                                                |

**Atlas:** Network Access must allow Vercel's functions. Their addresses change, so this is `0.0.0.0/0` with a long database password, unless the Vercel plan has static outbound IPs. Turn on backups. The production database starts empty except for the offices, settings and Super Admin: `npm run db:reset-for-launch -- --database=oedf` shows what it would remove, and `--confirm` removes it. Run `npm run db:indexes` against each database after a deploy that changes a schema.

**DNS** (at the domain's registrar): the apex `A` record and the `www` `CNAME` that Vercel's Domains page shows (usually `A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com`), with the apex redirecting to `www`, and `CNAME staging cname.vercel-dns.com` for the preview. In Vercel, Domains, add `staging.oed-foundation.org` and assign it to the `staging` Git branch, so only that branch uses it; other preview deployments get a per-commit address, where forms fail the same-origin check. For email, the SPF, DKIM and DMARC records the mail provider gives for the sending domain. Vercel issues the HTTPS certificate.

**Cloudinary:** PDF delivery on; no unsigned upload preset; Strict Transformations off on purpose (see architecture.md, "Files").

**Cron:** `vercel.json` runs `/api/v1/internal/cleanup-uploads` daily at 02:00 Pakistan time; it removes uploads never saved with a form.

**Security headers** come from `src/lib/security-headers.ts` (see architecture.md). After a deploy, `curl -I https://www.oed-foundation.org` shows them.

**Go-live smoke test** (after each deploy to production or staging, about 10 minutes). Use an email inbox you can read; on staging, the same steps check the preview setup.

1. `https://<domain>/api/v1/health` answers `ok`, and `curl -I https://<domain>` shows the security headers.
2. Sign in at `/portal` as the Super Admin. In Settings, check that "Scholarships are open" is on (turn it on for the test if needed, and back off afterwards).
3. Submit a test scholarship application at `/scholarships/apply`: the name "Smoke Test", your own email, any CNIC, and one small PDF as a document. The page shows a reference such as `OEDF-SCH-2026-000001`. Note it.
4. The confirmation email with that reference reaches your inbox within a few minutes (check spam too; if it never comes, check `SMTP_URL`, that `EMAIL_FROM` is verified in Brevo, and the domain's SPF and DKIM records from Brevo).
5. At `/application-status`, enter the reference and your email: the status shows "Submitted".
6. In the portal, open Applications, find the reference, and open the document: it opens in a new tab through the 5-minute link. The audit log shows the opening.
7. Delete the test data:
   - **Before launch** (no real records yet): `npm run db:reset-for-launch -- --database=oedf` shows what it would remove (only the test application, its file record, the audit entries and the sessions), then add `--confirm`. On staging, use `--database=oedf-preview`. It signs everyone out.
   - **After launch** (real records exist): do **not** run the reset. Archive the test application in the portal instead; applications are never deleted.
   - Either way, delete the uploaded PDF in the Cloudinary console, under `oedf/applications` (`oedf-preview/applications` on staging).

Apply each monthly Next.js security release.

**Lighthouse:** `npx lighthouse <url>` (mobile by default) against `npm run build && npm run start`. The simulated LCP is a pessimistic estimate for a Next.js page (it counts every script fetched before the first paint); `--throttling-method=devtools` measures with throttling actually applied.
