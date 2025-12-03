# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application for managing Sunday league football/soccer matches. The app handles player management, matchday scheduling, RSVP tracking, match statistics, voting for Man of the Match, and team balancing. It supports two locales (English and Slovenian) and includes both user and admin roles.

## Development Commands

### Basic Development

```bash
npm run dev              # Start development server on port 3000
npm run build            # Build for production
npm run start            # Start production server
```

### Database

The project uses Prisma with SQLite (configurable to PostgreSQL via DATABASE_URL):

```bash
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations in development
npx prisma studio        # Open Prisma Studio GUI
```

### Testing

```bash
npm test                 # Run Jest unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:e2e         # Run Playwright E2E tests (on port 3001)
```

To run a single test file:

```bash
npm test -- path/to/test.test.ts
```

### Code Quality

```bash
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without changes
```

### CI Pipeline

The project includes a Makefile for local CI/CD:

```bash
make ci                  # Run full pipeline: lint, format-check, test, e2e, build
make install             # Install dependencies with npm ci
```

Note: The build command in Makefile uses a dummy DATABASE_URL to allow builds without a real database connection.

### Pre-commit Hooks

Husky runs lint, format-check, and tests on every commit. To bypass (not recommended):

```bash
git commit --no-verify
```

## Architecture

### Authentication & Authorization

- **NextAuth.js** with credentials provider (username/password)
- Passwords hashed with bcryptjs
- JWT-based sessions
- Two roles: `USER` and `ADMIN`
- Auth helpers in `src/lib/auth-helpers.ts`:
  - `requireAuth()`: Validates authenticated user
  - `requireAdmin()`: Validates admin role
  - `getPlayerFromSession()`: Gets player profile for authenticated user
  - `errorResponse()` / `successResponse()`: Standardized API responses

### API Routes Structure

All API routes follow Next.js App Router conventions (`src/app/api/`):

- `/api/auth/[...nextauth]` - NextAuth endpoints
- `/api/register` - User registration
- `/api/admin/*` - Admin-only endpoints (players, seasons, matchdays)
- `/api/rsvp` - Player RSVP to matchdays
- `/api/matchdays/[id]/vote` - Voting for Man of the Match
- `/api/matches/[id]/balance` - Team balancing algorithm
- `/api/matches/[id]/finish` - Finalize match results

API routes use the auth helpers for consistent authentication/authorization checks.

### Database Schema (Prisma)

Core models and their relationships:

- **User** → has one **Player** (optional, for registered users)
- **Season** → has many **Matchdays**
- **Matchday** → has many **Matches**, **RSVPs**, and **Votes**
- **Match** → has many **MatchStats** (one per player per match)
- **Player** → has many **MatchStats**, **RSVPs**, **Votes** (as voter and target)

Key cascade deletions: Deleting a Matchday cascades to Matches, RSVPs, and Votes.

### Internationalization (i18n)

- Locale configuration in `src/i18n/config.ts`
- Supported locales: `en`, `sl`
- Locale set via `NEXT_PUBLIC_LOCALE` environment variable
- Translation files in `src/i18n/locales/[locale]/`
- Server-side: Use `src/i18n/server.ts`
- Client-side: Use `src/i18n/client.ts`

### PWA Configuration

- Progressive Web App enabled via `next-pwa`
- Disabled in development mode
- Service worker registered for offline support
- Manifest in `public/manifest.json`

### Testing Strategy

- **Unit tests**: Jest with React Testing Library for API routes and utilities
- **E2E tests**: Playwright for user flows
- **Test coverage threshold**: 70% (branches, functions, lines, statements)
- Test files co-located with source code: `*.test.ts` or `*.test.tsx`
- E2E tests in `e2e/` directory
- Mocking: Use `jest-mock-extended` for Prisma client mocks
- Test utilities in `src/lib/test-utils.ts`

### Path Aliases

TypeScript path alias configured:

```typescript
@/* → src/*
```

### Build Configuration

- **Webpack externals**: `@node-rs/argon2`, `@node-rs/bcrypt` excluded
- **Turbopack**: Enabled (silences warnings)
- **PWA**: Service worker generated in `public/` directory

## Key Patterns

### API Route Pattern

```typescript
import { requireAuth, requireAdmin, errorResponse, successResponse } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  // Auth check
  const authResult = await requireAuth(); // or requireAdmin()
  if (!authResult.success) return authResult.response;

  const { user } = authResult;

  // Validation
  const body = await request.json();
  // ... validate with Zod schemas from @/lib/validation

  // Business logic with Prisma
  const result = await prisma.model.create({ ... });

  return successResponse(result);
}
```

### Component Organization

- Server components by default (Next.js 13+ App Router)
- Client components marked with `'use client'` directive
- Admin UI components in `src/app/admin/`
- User dashboard components in `src/app/dashboard/`
- Shared utilities in `src/lib/`

### Environment Variables

Required (see `.env.example`):

- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - NextAuth secret for JWT signing
- `NEXTAUTH_URL` - Base URL for NextAuth
- `NEXT_PUBLIC_LOCALE` - App locale (en or sl)
- `NEXT_PUBLIC_APP_NAME` - Application branding name
