# Ramdam

The social network for youth workers (animateurs): share activities, get inspired, find your next team.

## Structure

```
apps/api        NestJS REST API
apps/mobile     Expo app (iOS, Android, web)
packages/shared Shared types and validation schemas
```

## Getting started

Requirements: Node 24, Docker, pnpm (via `corepack enable`).

```bash
cp .env.example .env   # then edit the secrets
pnpm install
pnpm db:up             # PostgreSQL, Redis, MinIO
pnpm dev:api           # API on http://localhost:3000
pnpm dev:mobile        # Expo dev server
```

## Quality

```bash
pnpm lint
pnpm test
pnpm format:check
```

Every pull request runs lint, tests and build in GitHub Actions.
