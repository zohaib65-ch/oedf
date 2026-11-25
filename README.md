# Omar Education Development Foundation (OEDF) Website

The official website, staff portal and REST API of the Omar Education Development Foundation, a non-profit education foundation in Pakistan (SECP Registration No. 0361535). One Next.js application: frontend and backend in the same codebase.

**Status:** Phase 1 (foundation) is complete. Public pages, forms and the portal arrive in the next phases.

## Quick start

Needs Node.js 24+, npm, the project's MongoDB Atlas cluster (with your IP allowed) and Docker for Mailpit.

```bash
npm install
cp .env.example .env            # then fill in the values
docker compose up -d mailpit    # local email inbox
npm run db:indexes
npm run db:seed
npm run dev                     # http://localhost:3000
```

`npm run check` runs lint, typecheck and Knip. All scripts are listed in the setup doc.

## Documentation

| Document                                                     | Covers                                                                             |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)                 | Stack, layers, folder structure, auth and permissions, coding standards, decisions |
| [docs/design-system.md](docs/design-system.md)               | Tokens, section mapping, shared components                                         |
| [docs/api-and-database.md](docs/api-and-database.md)         | Endpoints, collections and indexes, status workflows, emails                       |
| [docs/setup-and-deployment.md](docs/setup-and-deployment.md) | Local setup, environment variables, checks, deployment                             |
| [docs/open-questions.md](docs/open-questions.md)             | Every placeholder and unanswered question                                          |

Rules for working on this codebase (and for AI assistants) are in [CLAUDE.md](CLAUDE.md).
