# Ops Dashboard

Internal operations dashboard for managing bookings, payments, workers, leads, and complaints. Built on Next.js App Router with Google Sheets as the data backend.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the root route `/` is the main overview dashboard.

---

## Required Environment Variables

Create a `.env.local` file in the project root:

```env
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id-from-the-url
```

- `GOOGLE_CLIENT_EMAIL` — the email address of your Google Cloud service account
- `GOOGLE_PRIVATE_KEY` — the private key from the service account JSON file (keep the `\n` newlines, wrap in double quotes)
- `GOOGLE_SHEETS_SPREADSHEET_ID` — the long ID from the Google Sheets URL: `https://docs.google.com/spreadsheets/d/<THIS_PART>/edit`

None of these are exposed to the browser. All Google Sheets calls are server-side only.

---

## Google Sheets Integration

### How it works

1. A Google Cloud service account authenticates using `GOOGLE_CLIENT_EMAIL` + `GOOGLE_PRIVATE_KEY`
2. The Sheets API reads named tab ranges (e.g. `Bookings!A:Z`) returning a 2D string array
3. The first row is treated as column headers; `rowsToObjects()` converts subsequent rows to objects
4. Each row is parsed and validated against a Zod schema — invalid rows are skipped with a console warning, so bad data never crashes the page
5. Mutations (status updates, assignments) call internal API routes (`/api/bookings/[id]`, etc.) which write back to the sheet using `batchUpdate`

### Sheet structure

The spreadsheet must have these tab names exactly:

| Tab | Purpose |
|-----|---------|
| `Bookings` | All booking records |
| `Customers` | Customer profiles |
| `Workers` | Daily worker ops logs |
| `Payments` | Payment records |
| `Leads` | Sales leads |
| `Complaints` | Customer complaints |
| `DashboardMetrics` | Key/value metric pairs |
| `Lists` | Reference data (not yet used) |

Each tab must have a **header row as row 1**. Column names must match the field names in the Zod schemas in `src/lib/sheets/types.ts`.

### Sharing the sheet with the service account

1. Open the Google Sheet
2. Click **Share**
3. Enter the `GOOGLE_CLIENT_EMAIL` address
4. Grant **Editor** access
5. Uncheck "Notify people" and click **Share**

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Overview dashboard — KPIs, today's bookings, pending payments, worker performance, leads funnel, latest complaints |
| `/bookings` | Full bookings table with search + multi-filter + worker assignment + status mutations |
| `/payments` | Payments table with status updates and reference tracking |
| `/leads` | Leads pipeline with status progression actions |
| `/complaints` | Complaints list with resolve/escalate/ignore actions |
| `/workers` | Worker daily ops aggregated by name with completion rates |

---

## Extending Sheet Modules

To add a new data entity (e.g. "Invoices"):

1. **Add a Zod schema** in `src/lib/sheets/types.ts`:
   ```ts
   export const InvoiceSchema = z.object({ id: z.string(), ... })
   export type Invoice = z.infer<typeof InvoiceSchema>
   ```

2. **Add the range** in `src/lib/sheets/config.ts`:
   ```ts
   export const INVOICES_RANGE = "Invoices!A:Z"
   ```

3. **Create a fetch function** in `src/lib/sheets/invoices.ts` following the pattern in `bookings.ts` — call `getSheetsClient()`, read the range, run `rowsToObjects()`, then `InvoiceSchema.safeParse()` each row

4. **Add a mutation file** in `src/lib/sheets/mutations/invoices.ts` if you need write-back, following the pattern in `mutations/bookings.ts`

5. **Add an API route** at `src/app/api/invoices/[id]/route.ts` with Zod-validated input

6. **Add a page** at `src/app/invoices/page.tsx` that `await`s the fetch function and passes data to a client view component

---

## Architecture Notes

- **Server/client split**: Pages are async server components that fetch data. Interactive tables are `"use client"` view components that receive data as props and call API routes for mutations — Google credentials never reach the browser.
- **Resilience**: The root dashboard uses `Promise.allSettled` so one failing sheet tab does not break the whole page. Individual pages use `.catch(() => [])`.
- **Validation**: All API route bodies are validated with Zod before any sheet write occurs.
- **Formatting**: Shared utilities in `src/lib/format.ts` handle INR currency, date display, and percentages. Lead status classification lives in `src/lib/lead-utils.ts`.

---

## Polish Changes (April 2026)

- Extracted `formatCurrency`, `formatDate`, `formatPercent` into `src/lib/format.ts` — removes three separate local `formatAmount` definitions
- Extracted `classifyLeadStatus` and `isLeadPending` into `src/lib/lead-utils.ts` — was duplicated between `leads-summary.tsx` and `leads-view.tsx` with diverging logic
- Fixed variable shadowing bug in `leads-view.tsx` where `isPending` from `useTransition` was shadowed by a local IIFE, causing action buttons to never disable during router refreshes
- All date columns now render as "15 Jan 2024" instead of raw ISO strings
- `leads-summary.tsx` now uses `StatusBadge` consistently instead of a bare `Badge`
- All `loading.tsx` files updated to mirror the actual page structure (filter bar + column-fidelity table skeleton rows)

---

## Risk Areas

- **No authentication**: API routes are unprotected. Anyone with the URL can read and mutate data. Add middleware-based auth before exposing this externally.
- **Sheet ID in env only**: If the sheet is deleted or tabs renamed, all fetches silently return empty arrays. Consider adding a startup health check.
- **Worker complaint attribution**: Linking complaints to workers by searching the description string is best-effort and will miss many cases.
- **`GOOGLE_PRIVATE_KEY` newlines**: The private key must preserve literal `\n` in `.env.local`. Some deployment platforms (Vercel, Railway) require the key to be base64-encoded or set via their secrets UI — test this before deploying.

---

## Future Refactors (post-Sheets)

Once data volume or team size outgrows Google Sheets:

1. **Replace Sheets with a real database** (Postgres via Prisma/Drizzle). The Zod schemas in `types.ts` can become the database schema directly.
2. **Add authentication** — NextAuth or Clerk both integrate cleanly with the App Router pattern here.
3. **Real-time updates** — replace `router.refresh()` with server-sent events or SWR polling.
4. **Worker payout calculation** — the "Payout Due" column in the workers table is currently a placeholder (`—`).
5. **Audit log** — all mutations currently have no history. A simple append-only log sheet (or DB table) would help ops trace changes.
