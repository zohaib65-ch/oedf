# API and Database

## API

Base path `/api/v1`. Every route handler is wrapped in `withApiHandler()`; formats and error codes are in [architecture.md](architecture.md).

**Conventions:** plural kebab-case resources; `{id}` maps to an `[id]` folder; `PATCH` for partial updates; `DELETE` returns 204; status changes always use `POST /{resource}/{id}/status` with `{ "status", "reason" }`; lists accept `page`, `pageSize` (default 20, max 100), `sort` (for example `-createdAt`), `q` and named filters. `POST`, `PUT`, `PATCH`, `DELETE` need an `Origin` header equal to the site's own origin, otherwise `403`. Public endpoints will require a Turnstile token and per-IP rate limits (Phase 4). Public pages read through services, so there are no public GET endpoints for content.

Endpoints are added, with request and response examples, in the phase that builds their screen. Today:

| Method | Path                      | Access  | Purpose                                               |
| ------ | ------------------------- | ------- | ----------------------------------------------------- |
| GET    | `/api/v1/health`          | Public  | Database check for the hosting health probe           |
| POST   | `/api/auth/sign-in/email` | Public  | Body `{ "email", "password" }`. 5 attempts per minute |
| POST   | `/api/auth/sign-out`      | Session | Clears the session                                    |
| GET    | `/api/auth/get-session`   | Public  | Current session and user, or `null`                   |
| POST   | `/api/auth/sign-up/email` | n/a     | Always refused (`EMAIL_PASSWORD_SIGN_UP_DISABLED`)    |

**Public forms and files (Phase 4).** Every `POST` needs the site's `Origin` (else `403`). Public submissions send `turnstileToken` (checked by Cloudflare; skipped when no secret key is set locally) and the honeypot field `faxNumber` (any value gives `400`), and are limited to 5 per 10 minutes per IP per form (`429`). Field errors come back by dotted path, for example `applicant.email`.

| Method | Path                                     | Access                              | Purpose                                                                                                                             |
| ------ | ---------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/v1/uploads`                        | Public, 30 per 10 min per IP        | Body `{ purpose, fileName, bytes }`. Checks format and 5 MB, returns signed Cloudinary parameters and a random public ID            |
| POST   | `/api/v1/applications`                   | Public                              | Admission or scholarship application. `201 { referenceNumber }` such as `OEDF-ADM-2026-000123`. `409` while closed in Settings      |
| POST   | `/api/v1/applications/status-lookup`     | Public, 10 per 10 min per IP        | `{ referenceNumber, email }`. Returns status, label, next step and (only when Incomplete) the missing items. `404` for any mismatch |
| POST   | `/api/v1/applications/missing-documents` | Public                              | Uploads the requested documents; Incomplete returns to Under review. `409` otherwise                                                |
| POST   | `/api/v1/job-applications`               | Public                              | `{ vacancySlug, …, cv }`. `201 { referenceNumber }` such as `OEDF-JOB-2026-000045`. `409` after the deadline                        |
| POST   | `/api/v1/contact-messages`               | Public                              | Saved to the inbox of the office its subject belongs to; emailed to that office                                                     |
| GET    | `/api/v1/files/{id}`                     | Staff session                       | `302` to a link that expires after 5 minutes; audit-logged. Interim rule below                                                      |
| POST   | `/api/v1/internal/cleanup-uploads`       | `Authorization: Bearer CRON_SECRET` | Deletes uploads still `pending` after 24 hours. Also answers `GET`, for hosts whose cron can only send GET                          |

**Upload flow.** (1) The browser asks `/uploads`; the server checks purpose, extension and size and signs the upload with a random public ID in `oedf/<applications or cv>/` (`oedf-dev/` unless the site URL is not localhost), type `authenticated`, tag `pending`. (2) The browser uploads straight to Cloudinary with progress. (3) The form submits the public IDs; the server looks each file up again (folder, private, still pending, format, size), saves `fileAssets` and the record in one transaction, and only then removes the `pending` tag. (4) A file is deleted only when it is ours, still pending and fails the format or size check; a file that is saved or not ours is refused untouched. (5) The cleanup job never deletes a file the database has saved. Reference numbers come from the `counters` collection (`ADM-2026`, `SCH-2026`, `JOB-2026`) inside the same transaction.

**Interim file access (until the Phase 5 permission map):** Super Admin and CEO Office open any file; Director and Staff open files of their own office's records (Admissions & Scholarships for applications, HR for CVs). Everyone else gets `403`.

`GET /api/v1/health` returns `200 { "data": { "status": "ok" } }`, or `500 INTERNAL_ERROR` when MongoDB cannot be reached. Better Auth also serves password reset and change and session management under `/api/auth/*`; it is not part of `/api/v1`.

## Database

MongoDB 8+ with Mongoose 9, as a replica set (Atlas always is; `compose.yaml` runs a single-node set locally). One model per collection in `src/server/db/models/`; every schema is `strict` with `timestamps: true`, and collection names are set explicitly to match this table.

| Collection                                   | Embedded inside                                                                                             | Notes                                                            |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `user`, `session`, `account`, `verification` | n/a                                                                                                         | Better Auth. Extra user fields `role`, `departmentId` (a string) |
| `rateLimit`                                  | n/a                                                                                                         | Better Auth sign-in buckets (not `rateLimits`)                   |
| `departments`                                | n/a                                                                                                         | The five offices, seeded                                         |
| `programs`                                   | `image`                                                                                                     |                                                                  |
| `institutions`                               | `image`, `agreements[]`, `reviews[]`                                                                        | Public site shows Active and public only                         |
| `applications`                               | `applicant`, `education`, `financial`, `documents[]`, `checklist`, `decision`, `notes[]`, `statusHistory[]` | Admission and scholarship                                        |
| `scholarshipAwards`                          | `notes[]`                                                                                                   | Records only, no payments                                        |
| `vacancies`                                  | n/a                                                                                                         |                                                                  |
| `jobApplications`                            | `candidate`, `notes[]`, `statusHistory[]`                                                                   |                                                                  |
| `publications`                               | `cover`                                                                                                     |                                                                  |
| `newsPosts`                                  | `cover`, `seo`                                                                                              |                                                                  |
| `faqs`                                       | n/a                                                                                                         |                                                                  |
| `contactMessages`                            | n/a                                                                                                         | Routed to an office by subject                                   |
| `directives`                                 | `assignments[]` (with `clarification`, `updates[]`)                                                         | One assignment per target office                                 |
| `fileAssets`                                 | `owner`                                                                                                     | One per confirmed Cloudinary upload                              |
| `siteSettings`                               | `contact`, `social`, `impactNumbers[]`, `announcement`                                                      | Exactly one document (fixed unique `key`)                        |
| `auditLogs`                                  | n/a                                                                                                         | Every change                                                     |
| `counters`                                   | n/a                                                                                                         | `_id` = counter name (for example `ADM-2026`), `seq`             |
| `rateLimits`                                 | n/a                                                                                                         | Public form limits, TTL on `expiresAt`                           |

**Indexes** are declared in each schema. Unique: `referenceNumber` (applications, job applications, directives), `slug` (departments, programs, institutions, vacancies, publications, news posts), `publicId` (file assets), `applicationId` (awards), `key` (settings, rate limits). Applications: `status + type + createdAt`, `applicant.email`, `applicant.cnic`, text on applicant name and reference number. Publications: text on title and summary. Directives: `assignments.departmentId + assignments.status`, `dueDate`. Vacancies: `status + deadline`. Contact messages: `departmentId + status + createdAt`. Audit logs: `entityType + entityId + createdAt`, `actorId + createdAt`. Awards: `renewalDate + status`. Rate limits: TTL index on `expiresAt`. `autoIndex` is off in production: run `npm run db:indexes` on every deploy (it creates missing indexes and drops removed ones).

**Rules**

- Enums are strings defined once in `src/lib/constants/enums.ts` and used by Mongoose and Zod. Money is whole rupees in `...Pkr` fields; dates are UTC.
- Embed small data always read with its parent; reference anything shared or unbounded. Save the actor's name beside their ID in notes, history and audit entries.
- CNIC numbers and financial details are excluded from list queries by projection, lists show only the last four CNIC digits, and neither is ever logged.
- `sanitizeFilter` is on, so an object such as `{ "$ne": "x" }` in a request cannot act as a query operator.
- References to staff are `ObjectId`; Better Auth's own `user.departmentId` is a string, so convert when comparing with an office `_id`.

**Seeding:** `npm run db:seed` is safe to repeat. It creates the five offices (draft mandates, open-questions C25), default settings (letterhead contact details, **unconfirmed**) and, if no Super Admin exists, asks for the first one's email and password (or takes `--email` and `--password`) and stores the account in the database. Existing offices and settings are never overwritten. `npm run db:seed:sample` adds clearly labelled sample programs, institutions, vacancies, research, news, FAQs and impact numbers for development and CI; it refuses to run when `NODE_ENV=production`. Cache tags for public content (`settings`, `departments`, `programs`, `institutions`, `vacancies`, `publications`, `news`, `faqs`) are in `src/lib/constants/cache-tags.ts`; every service that changes content must call `revalidateTag(tag, { expire: 0 })` for its tag after the write (see architecture.md). **Filters:** Mongoose `sanitizeFilter` turns query operators into plain values, so server-built operators (`$gte`, `$in`, `$text`) are wrapped in `mongoose.trusted()` and user input never is.

**Changing a schema safely:** add fields as optional or with defaults; run `npm run db:indexes` if an index changed; when existing documents must change, write a one-off script in `scripts/migrations/`, run it once and note it here; never remove a field in the same release that stops writing it.

## Status workflows (planned, Phase 6)

Every status change records who, when and why. Applications, job applications and directives are archived, never deleted.

| Record            | Flow                                                                                                                                                                                                                                                                                                         | Who                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Application       | Submitted → Under review → Verified → Recommended → Approved or Rejected. Under review ↔ Incomplete (applicant uploads missing items from `/application-status`, which returns it to Under review). Withdrawn before a decision. Verified needs a complete checklist                                         | Staff review, verify, recommend; Director and CEO Office decide                                                |
| Scholarship award | Created when a scholarship application is approved. Active, On hold, Ended; amount per period, start and renewal dates, progress notes                                                                                                                                                                       | Admissions & Scholarships                                                                                      |
| Vacancy           | Draft → Published → Closed (closes automatically after the deadline)                                                                                                                                                                                                                                         | Staff draft; only a Director publishes                                                                         |
| Job application   | Received, Shortlisted, Interview, Selected, Rejected, On hold. Selection records a recommendation only                                                                                                                                                                                                       | HR & Teacher Management                                                                                        |
| Directive         | Per target office: Pending acknowledgement → Acknowledged → In progress → Completed. An office may request clarification with a reason (law, constitutional documents, Board resolution, donor restriction, operational impossibility), which escalates to the CEO Office, who resolves it (reopen or close) | Research & Policy Institute issues; each office's Director acknowledges, assigns, responds; Staff post updates |

## Emails

React Email templates with the OEDF logo and a plain-text version, sent through Nodemailer (SMTP, `SMTP_URL`). A failed send is logged (subject only, never the address) and never fails the submission. A contact message goes to the office's `notificationEmail`, else the general email in Settings; with neither it is only saved to the inbox.

| Email                                                | To                                       | Phase |
| ---------------------------------------------------- | ---------------------------------------- | ----- |
| Application received (reference number, status link) | Applicant                                | 4     |
| Documents missing (lists the items)                  | Applicant                                | 6     |
| Application approved, application rejected           | Applicant                                | 6     |
| Job application received                             | Candidate                                | 4     |
| New contact message                                  | The matching office's notification email | 4     |
| Staff invitation (set-password link), password reset | Staff                                    | 5     |
| Directive issued                                     | Directors of the target offices          | 6     |
| Clarification requested                              | CEO Office                               | 6     |
