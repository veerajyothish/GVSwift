# GVSwift — Changelog

All notable changes to GVSwift are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### In Progress
- Checkout email notification via Resend (`sendOrderStatusEmail`)
- Smoke test of full checkout → email flow in production

---

## [0.9.0] — July 2026 — Pre-Launch Build

### Added — Infrastructure & Tooling
- Next.js 15 App Router project scaffolded with TypeScript
- Prisma ORM connected to Supabase PostgreSQL (`relationMode = "prisma"`)
- Supabase Auth integration (email + password, no OAuth at MVP)
- Supabase Storage wired for product images
- Upstash Redis rate limiting (`@upstash/ratelimit`) on login, signup, checkout, complaint creation
- Sentry error monitoring — client, server, and edge configs (`instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`)
- GA4 analytics integration — consent-gated, only initialises after cookie banner acceptance
- Vercel deployment configuration
- `robots.ts` and `sitemap.ts` — dynamic sitemap generation
- OpenGraph image generation (`opengraph-image.tsx`)
- Cookie consent banner — persistent preference stored server-side
- `.env.example` fully documented with all required variables
- ESLint config (`eslint.config.mjs`)
- `CONTEXT.md` — persistent AI agent context file
- Full `docs/` documentation suite (PRD through Testing Strategy)

### Added — Authentication & Accounts
- Supabase Auth signup / login / password reset flow
- Email verification required at checkout (not browsing)
- Protected route middleware (`src/middleware.ts`) — auth check + role check
- Admin role enforcement server-side on every `/admin/*` page and `/api/v1/admin/*` route
- Session-derived user ID on all server actions — client-reported IDs never trusted

### Added — Customer-Facing
- Home page with hero, featured products, category grid
- Category listing pages with filtering
- Product detail page with variant selection and image gallery
- Basic PostgreSQL full-text search
- Cart — add / update / remove, persisted per user in DB
- Checkout — address selection, COD-only, T&C consent checkbox (unticked by default), idempotency key
- Pincode serviceability check at checkout against `RiskFlag` table
- COD limit enforcement (₹10,000 max)
- My Orders — order history and order detail / tracking view
- Order cancellation (until SHIPPED)
- Return request (within 7 days of DELIVERED)
- Address book — add / edit / delete / mark default
- Support ticket creation (general and order-linked) and tracking
- All legal pages: Privacy Policy, Terms & Conditions, Returns, Shipping, Cookie Policy, Grievance Officer
- 404 page (`not-found.tsx`)
- Global error boundary (`global-error.tsx`)
- Skeleton loading states (`loading.tsx`)

### Added — Admin Panel (`/admin`)
- Admin authentication — role-gated, server-enforced, independent re-check on every route
- Product CRUD — variants, images (Supabase Storage), stock, categories
- Order management — list / filter / view / status updates / internal notes / delivery attempt tracking
- Complaint / ticket management — list / filter / status updates / internal notes
- Risk flag management — pincode / address / phone flags (NORMAL / LOW / MEDIUM / HIGH / BLOCKED)
- Settings panel — COD limit, return window, cancellation cutoff, shipping charge (no-redeploy config changes)

### Added — Transactional Email
- Resend integration scaffolded
- Email templates under `src/emails/`
- `sendOrderStatusEmail` function built and wired into checkout flow

### Added — Security
- All money stored and computed as integer paise (never float)
- Checkout atomic transaction — `SELECT ... FOR UPDATE` row locking on `ProductVariant`
- Ownership mismatch returns 404 (not 403) on all user-owned resources
- Server-side Zod validation on all inputs
- Free-text user content rendered as plain text only — no `dangerouslySetInnerHTML`
- Product image upload: MIME allowlist (jpeg/png/webp, no SVG), 5MB max, 8 images max
- `SUPABASE_SERVICE_ROLE_KEY` never exposed to client
- Audit log for all admin actions on orders and risk flags

### Added — Design System
- Stitch design system — full custom CSS with CSS custom properties (no Tailwind, no CSS-in-JS)
- `src/app/globals.css` — 66KB comprehensive design token and component stylesheet
- Brand: Wine Red `#6B1E2E` / Cream `#FDFAF5`, EB Garamond + Inter typography, pill-shaped buttons
- Full accessibility — WCAG AA contrast, 44px touch targets, focus rings, `prefers-reduced-motion`
- `GVSwift_Brand_Guidelines.md` committed to repo root
- `docs/12-Brand-Guidelines.md` developer quick-reference added

### Added — Documentation
- `docs/legal/TERMS-AND-CONDITIONS.md`
- `docs/legal/PRIVACY-POLICY.md`
- `docs/legal/REFUND-RETURN-POLICY.md`
- `docs/legal/SHIPPING-POLICY.md`
- `docs/legal/COOKIE-POLICY.md`
- `docs/legal/GRIEVANCE-OFFICER.md`
- `docs/12-Brand-Guidelines.md`
- `CHANGELOG.md` (this file)
- `audit-report.md` — full codebase security and quality audit
- `design.md` — detailed design decisions and rationale

### Order State Machine
Valid transitions implemented and enforced server-side:
```
PLACED → CONFIRMED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
PLACED → CANCELLED (customer or admin)
CONFIRMED → CANCELLED (admin only after confirmation)
OUT_FOR_DELIVERY → FAILED_DELIVERY → RTO
DELIVERED → RETURN_REQUESTED → RETURNED / REFUNDED
```
Every transition writes an `OrderStatusHistory` row.

### Database Migrations
- All schema changes managed via `prisma migrate dev` / `prisma migrate deploy`
- Authoritative schema: `docs/FINAL-SCHEMA.prisma`
- Primary keys: UUID on all tables
- `Order.addressId` — `onDelete: Restrict` (cannot delete address linked to a past order)

---

## [0.1.0] — Project Initiation

### Added
- Repository created: `veerajyothish/GVSwift`
- Initial Next.js 15 scaffolding
- First commit with project structure

---

*Maintained by the GVSwift team. Update this file on every meaningful push.*
