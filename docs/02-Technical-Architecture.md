# GVSwift — Technical Architecture Document

**Document 2 of 10 | Version 1.0 | Status: Draft for Approval**

---

## 1. Architecture Overview

GVSwift is a server-rendered Next.js application using the App Router, deployed on Vercel, backed by Supabase (PostgreSQL + Auth + Storage), with Prisma as the typed data access layer for all business data.

```
Customer / Admin (browser)
        │ HTTPS
        ▼
Next.js 15 (App Router, TypeScript) — Vercel
        │
        ├── Supabase Auth (session/JWT validation)
        ├── Prisma → Supabase PostgreSQL (business data)
        ├── Supabase Storage (product images)
        ├── Resend (transactional email)
        ├── Sentry (error monitoring)
        └── GA4 (client-side analytics, consent-gated)

Future (explicitly NOT in MVP):
        ├── Shiprocket API (logistics)
        ├── Razorpay/payment gateway (prepaid)
        └── Background job worker (queue-based async tasks)
```

### Why this stack (justification)

| Choice | Reasoning |
|---|---|
| Next.js App Router | Single codebase for frontend + API routes; React Server Components reduce client JS; strong Vercel integration |
| Supabase (DB + Auth + Storage) | One vendor for three needs on a generous free tier; Postgres underneath avoids lock-in at the data layer |
| Prisma (not raw Supabase client for business data) | Type safety, migration tooling, and an abstraction so business logic isn't tied to Supabase's query builder — reduces lock-in. Supabase JS client is used **only** for Auth and Storage, never for querying business tables |
| Resend | Simple API, good free tier, designed for transactional email with Next.js |
| Custom CSS ("Stitch") | Full design control matching Black & Gold brand without framework override fights |

**Known tradeoff (documented technical debt):** Using both Supabase Auth (its own `auth.users` table) and Prisma (a separate `public.users` table) means two systems must stay in sync via a `supabaseId` foreign key. This is more moving parts than a single-ORM approach, but it lets us use Supabase's battle-tested auth (password hashing, session/JWT handling, email verification) without re-implementing it, while keeping all business data — and the ability to query/join it — fully under Prisma's type-safe control. Migration path if this becomes painful: move to Auth.js with a Prisma adapter, consolidating both into one schema.

---

## 2. Domain Boundaries

The codebase is organized around business domains, not technical layers. Each domain owns its own business rules, validation, and (where applicable) database models.

| Domain | Owns |
|---|---|
| **Catalog** | Products, variants, categories, search |
| **Cart** | Cart items, persistence, totals calculation |
| **Checkout** | Order creation orchestration, address capture, pricing snapshot, idempotency |
| **Orders** | Order entity, status state machine, cancellation, returns, delivery attempts |
| **Users** | User profiles, addresses, roles |
| **Support** | Complaints/tickets, grievance handling |
| **Risk & Fraud** | Risk flags (phone/address/pincode), COD eligibility checks, abuse pattern detection |
| **Notifications** | Abstracted notification sending (email now, SMS/push later); templates |
| **Settings/Config** | DB-backed configuration: COD limits, return windows, cancellation cutoffs, risk thresholds, shipping charges |
| **Admin** | Cross-cutting backoffice UI; calls into other domains' service layers, owns nothing of its own except audit logging |

**Future domain (not built in MVP, but reserved):** Background Jobs — a queue/worker boundary for async email sending, scheduled risk scoring, and data cleanup. In MVP, these run synchronously inside request handlers via callable service functions, structured so they can be lifted into a real queue (e.g., Vercel Cron + a queue table, or Supabase Edge Functions) without rewriting business logic.

---

## 3. Folder Structure

```
gvswift/
├── .env                          # local only, NEVER committed
├── .env.example                  # committed, documents all keys
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── sentry.client.config.ts
├── sentry.server.config.ts
├── public/
│   └── robots.txt
└── src/
    ├── app/
    │   ├── (public)/
    │   │   ├── page.tsx                  # home
    │   │   ├── products/
    │   │   │   ├── page.tsx              # listing
    │   │   │   └── [slug]/page.tsx       # detail
    │   │   ├── cart/page.tsx
    │   │   ├── checkout/page.tsx
    │   │   ├── orders/
    │   │   │   ├── page.tsx              # order history
    │   │   │   └── [id]/page.tsx
    │   │   ├── support/
    │   │   │   ├── page.tsx
    │   │   │   └── [ticketId]/page.tsx
    │   │   ├── account/
    │   │   │   ├── page.tsx
    │   │   │   └── addresses/page.tsx
    │   │   ├── login/page.tsx
    │   │   ├── signup/page.tsx
    │   │   ├── privacy/page.tsx
    │   │   ├── terms/page.tsx
    │   │   ├── returns/page.tsx
    │   │   ├── shipping/page.tsx
    │   │   ├── cookies/page.tsx
    │   │   ├── disclaimer/page.tsx
    │   │   ├── faq/page.tsx
    │   │   └── grievance/page.tsx
    │   ├── admin/
    │   │   ├── layout.tsx                # server-side admin guard
    │   │   ├── page.tsx                  # dashboard
    │   │   ├── products/
    │   │   ├── orders/
    │   │   ├── complaints/
    │   │   ├── risk/
    │   │   └── settings/
    │   ├── api/
    │   │   └── v1/
    │   │       ├── auth/
    │   │       ├── products/
    │   │       ├── cart/
    │   │       ├── checkout/
    │   │       ├── orders/
    │   │       ├── support/
    │   │       └── admin/
    │   ├── sitemap.ts
    │   ├── layout.tsx
    │   └── globals.css
    ├── components/
    │   ├── ui/                           # Button, Input, Card, Modal, Toast...
    │   ├── layout/                       # Navbar, Footer
    │   └── product/                      # ProductCard, etc.
    ├── features/
    │   ├── catalog/
    │   │   ├── service.ts                # business logic
    │   │   ├── repository.ts             # Prisma queries
    │   │   ├── validation.ts             # Zod schemas
    │   │   └── types.ts
    │   ├── cart/
    │   ├── checkout/
    │   ├── orders/
    │   ├── users/
    │   ├── support/
    │   ├── risk/
    │   ├── notifications/
    │   │   ├── service.ts                # NotificationService interface + Resend impl
    │   │   └── templates/
    │   ├── settings/
    │   └── admin/
    │       └── audit-log.ts
    ├── lib/
    │   ├── prisma.ts                     # Prisma client singleton
    │   ├── supabase/
    │   │   ├── server.ts                 # server-side Supabase client (auth)
    │   │   └── client.ts                 # browser Supabase client (auth)
    │   ├── auth/
    │   │   ├── session.ts                # getServerSession helper
    │   │   └── guards.ts                 # requireUser(), requireAdmin()
    │   ├── rate-limit.ts
    │   ├── validation/
    │   │   └── common.ts                 # shared Zod primitives (pincode, phone, etc.)
    │   ├── errors.ts                     # AppError classes, safe error formatting
    │   ├── logger.ts
    │   └── analytics.ts                  # GA4 event helper, consent-aware
    └── middleware.ts                     # HTTPS redirect, security headers, basic rate limit hook
```

**Rationale:** `src/features/<domain>` holds business logic (service + repository + validation), separate from `src/app` which holds only route/page composition. This means business rules are testable without spinning up Next.js routing, and the same service functions are reused by both customer-facing and admin routes.

---

## 4. Database Schema

> Full Prisma schema will be generated in Document 5 (Database Design Document) and the Final Implementation Package. This section lists tables and relationships at a conceptual level for architecture review.

| Table | Purpose | Key relationships |
|---|---|---|
| `users` | Business profile, extends Supabase auth user | 1:N addresses, orders, tickets |
| `addresses` | Saved shipping addresses | N:1 users |
| `products` | Product catalog entries | N:1 category, 1:N variants |
| `product_variants` | Size/color/etc. variants with own SKU, stock, price delta | N:1 products |
| `categories` | Hierarchical product categories | self-referential parent_id |
| `product_images` | Image URLs/metadata (Supabase Storage) | N:1 products |
| `carts` | One active cart per user | 1:1 users |
| `cart_items` | Items in a cart, references variant | N:1 carts, N:1 product_variants |
| `orders` | Order header | N:1 users, 1:N order_items, 1:N order_status_history |
| `order_items` | Snapshot of product/price/qty at order time | N:1 orders |
| `order_status_history` | Audit trail of every status change | N:1 orders |
| `support_tickets` | Complaints/support requests | N:1 users, N:1 orders (optional) |
| `ticket_messages` | Thread of messages on a ticket (customer + admin) | N:1 support_tickets |
| `risk_flags` | Risk status for phone/address/pincode | polymorphic by `entity_type` |
| `pincode_rules` | COD eligibility + risk level per pincode | standalone lookup |
| `settings` | Key-value config (COD limit, return window, etc.) | standalone |
| `audit_logs` | Admin action audit trail | N:1 users (actor) |
| `business_events` | Structured event log (order placed, complaint opened, etc.) | polymorphic |

Indexing, constraints, and full column definitions are specified in Document 5.

---

## 5. Environment & Configuration

All environment variables are defined server-side. None of the values below are committed; `.env.example` documents names and purpose only.

| Variable | Purpose | Used in |
|---|---|---|
| `DATABASE_URL` | Prisma connection string (pooled, via Supabase PgBouncer) | `lib/prisma.ts` |
| `DIRECT_URL` | Direct DB connection for Prisma migrations | `prisma/schema.prisma` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public, safe to expose) | `lib/supabase/client.ts`, `server.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (safe to expose; RLS enforces security) | `lib/supabase/client.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged key (bypasses RLS) | Admin-only server operations, never sent to client |
| `RESEND_API_KEY` | Transactional email sending | `features/notifications/service.ts` |
| `SENTRY_DSN` | Error monitoring (server) | `sentry.server.config.ts` |
| `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring (client) | `sentry.client.config.ts` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 property ID | `lib/analytics.ts` |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEO, emails, sitemap (placeholder until domain purchased) | `app/sitemap.ts`, email templates |
| `UPSTASH_REDIS_REST_URL` | Rate limiting backing store (confirmed choice — see Security & Access Document §5) | `lib/rate-limit.ts` |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting backing store auth token | `lib/rate-limit.ts` |
| `GRIEVANCE_OFFICER_EMAIL` | `gvswift.help@gmail.com` — used in legal pages | legal page content (or hardcoded constant, see note) |
| `COD_DEFAULT_LIMIT_PAISE` | Fallback COD limit if `settings` table is empty (seed default) | `features/settings/service.ts` |

> ~~`NEXTAUTH_SECRET`~~ — removed. GVSwift uses Supabase Auth exclusively, not Auth.js, so no session-signing secret of this kind is needed. **If Auth.js is ever introduced later** (e.g., as part of a migration away from Supabase Auth — see §1's documented tradeoff), reintroduce `NEXTAUTH_SECRET` at that time. Don't add it speculatively now — an unused secret is one more value to leak, rotate, and document for no current benefit.

> Note: `GRIEVANCE_OFFICER_EMAIL` and similar non-secret display values may alternatively live in a `lib/constants.ts` file rather than `.env`, since they aren't secrets. This will be finalized in the Final Implementation Package — flagged here as a minor open design choice, not a security concern either way.

---

## 6. Future Expansion Seams (Designed for for, Not Built)

| Future capability | How today's architecture avoids blocking it |
|---|---|
| Prepaid payments | `orders.payment_method` is an enum (`COD` only today); `PaymentService` interface reserved; no payment-specific logic baked into checkout core |
| Multi-state shipping | `pincode_rules` table is not state-scoped; `Settings` domain holds shipping rules generically, not hardcoded to AP |
| Multi-warehouse | `product_variants.stock` is a single integer today (documented MVP simplification); schema reserves room for a future `warehouse_stock` join table without breaking the variant model |
| Multi-seller | `products.sellerId` is reserved conceptually — MVP hardcodes a single internal seller, but product ownership is not assumed to be "the platform" in business logic |
| Shiprocket / logistics API | `ShippingService` interface abstracts fulfillment; MVP implementation is "manual" (admin enters tracking as text) |
| Background jobs | `NotificationService`, risk scoring, and cleanup are written as standalone callable functions today (invoked synchronously), so they can be moved behind a queue later |

---

*End of Technical Architecture Document. Proceed to Document 3 — Security & Access.*
