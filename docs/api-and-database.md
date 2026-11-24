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

**Seeding:** `npm run db:seed` is safe to repeat. It creates the five offices (draft mandates, open-questions C25), default settings (letterhead contact details, **unconfirmed**) and the first Super Admin from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`. Existing offices and settings are never overwritten. `npm run db:seed:sample` adds clearly labelled sample programs, institutions, vacancies, research, news, FAQs and impact numbers for development and CI; it refuses to run when `NODE_ENV=production`. Cache tags for public content (`settings`, `departments`, `programs`, `institutions`, `vacancies`, `publications`, `news`, `faqs`) are in `src/lib/constants/cache-tags.ts`; every service that changes content must invalidate its tag. **Filters:** Mongoose `sanitizeFilter` turns query operators into plain values, so server-built operators (`$gte`, `$in`, `$text`) are wrapped in `mongoose.trusted()` and user input never is.

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

## Emails (planned)

React Email templates with the OEDF logo and a plain-text version, sent through Nodemailer (SMTP).

| Email                                                     | To                                       | Phase |
| --------------------------------------------------------- | ---------------------------------------- | ----- |
| Application received, documents missing (lists the items) | Applicant                                | 4, 6  |
| Application approved, application rejected                | Applicant                                | 6     |
| Job application received                                  | Candidate                                | 4     |
| New contact message                                       | The matching office's notification email | 4     |
| Staff invitation (set-password link), password reset      | Staff                                    | 5     |
| Directive issued                                          | Directors of the target offices          | 6     |
| Clarification requested                                   | CEO Office                               | 6     |
