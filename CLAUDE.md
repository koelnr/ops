# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev           # Start dev server on :3000
bun run build         # Production build
bun run lint          # ESLint check
bun run test          # Run tests (vitest)
bun run test:watch    # Watch mode
bun run test:coverage # Coverage report
```

Tests use Vitest + React Testing Library. Test files live alongside source in `__tests__/` subdirectories and `src/test/` for shared fixtures and mocks.

## Architecture

This is a Next.js App Router internal ops dashboard for a car wash business. **Google Sheets is the sole database** — all reads and writes go through the Google Sheets API v4.

### Data Flow

```
Page (async RSC) → getBookings() / getPayments() / etc.
                   → Google Sheets API → rowsToObjects() → Zod parse → typed array
                   → passed as props to Client View Component ("use client")
                   → user action → mutate() PATCH /api/[entity]/[id]
                   → API route validates Zod → updateBooking() / etc.
                   → findRowIndex() → updateRowCells() → batchUpdate to Sheets
                   → client calls router.refresh() → RSC re-runs → UI updates
```

### Key Directories

- `src/lib/sheets/` — all Google Sheets logic: client singleton, Zod schemas (`types.ts`), per-entity fetch functions, and `mutations/` subfolder for write operations
- `src/app/api/` — REST endpoints per entity: collection routes (`/api/bookings`, `/api/payments`, etc.) with GET + POST, and item routes (`/api/[entity]/[id]`) with PATCH
- `src/components/views/` — "use client" interactive table components receiving server-fetched data as props
- `src/components/dashboard/` — read-only summary components for the root dashboard page
- `src/components/shared/` — reusable UI components (`EmptyState`, `PageHeader`, `SearchInput`, `FilterSelect`)
- `src/lib/format.ts` — all formatting utilities (`formatCurrency`, `formatDate`, `formatPercent`)
- `src/lib/mutate.ts` — thin client-side PATCH fetch wrapper used by all view components
- `src/lib/options.ts` — centralized select option arrays for all form dropdowns; values must match Zod enums in `types.ts`
- `src/proxy.ts` — Clerk middleware (auth guard); Next.js is configured to treat this as the middleware entry point

### Mutation Pattern

Every write follows this chain:

1. View component calls `mutate('/api/[entity]/[id]', payload)`
2. API route validates with Zod `UpdateSchema`, calls `update[Entity](id, fields)`
3. Mutation function: `findRowIndex(sheet, id)` → `updateRowCells(sheet, rowIndex, cellUpdates)`
4. On success: client shows Sonner toast → `router.refresh()`

When adding a new mutation, follow the pattern in `src/lib/sheets/mutations/bookings.ts`.

### Create Pattern

Collection endpoints (`POST /api/[entity]`) follow the same shape but append a new row:

1. View component calls `fetch('/api/[entity]', { method: 'POST', body: ... })`
2. API route validates with Zod `CreateSchema`, calls `create[Entity](data)`
3. Mutation function appends a row via `spreadsheets.values.append`
4. On success: client shows toast → `router.refresh()`

### Adding a New Entity

1. Add Zod schema (`EntitySchema`, `CreateEntitySchema`, `UpdateEntitySchema`) to `src/lib/sheets/types.ts`
2. Add range constant to `src/lib/sheets/config.ts`
3. Create `src/lib/sheets/[entity].ts` with `get[Entity]()` and `create[Entity]()` functions
4. Create `src/lib/sheets/mutations/[entity].ts` with `update[Entity]()`
5. Add any form select options to `src/lib/options.ts`
6. Add page at `src/app/[entity]/page.tsx` (async RSC) + view at `src/components/views/[entity]-view.tsx`
7. Add collection route at `src/app/api/[entity]/route.ts` (GET + POST)
8. Add item route at `src/app/api/[entity]/[id]/route.ts` (PATCH)

## Environment Variables

Required in `.env.local`:

```
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=                        # Full PEM including \n escapes; strip surrounding quotes handled in client.ts
GOOGLE_SHEETS_SPREADSHEET_ID=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=         # Clerk dashboard → API Keys
CLERK_SECRET_KEY=                          # Clerk dashboard → API Keys
```

All Google API calls are server-side only. The service account must have Editor access on the sheet.

## Google Sheets Tab Requirements

Sheet must have tabs named exactly: `Bookings`, `Customers`, `Workers`, `Payments`, `Leads`, `Complaints`, `DashboardMetrics`, `Lists`. Row 1 of each tab must be headers matching Zod schema field names.

## Auth

Clerk is integrated via `ClerkProvider` in the root layout. The middleware guard lives in `src/proxy.ts` — Next.js is configured to use this as the middleware entry point. All routes except `/sign-in` require authentication.

## Notes

- Zod schemas use `.or(z.string())` on enum fields to handle unknown values without crashing — don't tighten these without handling sheet data drift
- `rowsToObjects()` in `src/lib/sheets/utils.ts` converts the raw 2D Sheets API response (header row + data rows) into typed objects — used by all fetch functions
- Select option arrays in `src/lib/options.ts` must stay in sync with Zod enums in `types.ts` — they are not derived automatically
