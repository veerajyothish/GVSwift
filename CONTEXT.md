# GVSwift — Project Context (Persistent)

**Read this file before starting any task. This is standing context, not a one-time brief — every coding decision in this project must be consistent with it.**

---

## 0. What this project is

GVSwift is a B2C e-commerce platform for Visakhapatnam / Andhra Pradesh, India. COD-only at launch (₹10,000 limit), registered-accounts-only (no guest checkout), Black & Gold brand ("Stitch" design system). Full requirements live in `docs/01-PRD.md`. This file is the condensed, load-bearing summary of rules that must never be silently violated.

**Build order matters.** Tickets are numbered with explicit dependencies in `docs/08-Feature-Tickets.md`. Do not build TICKET-204 (checkout) before TICKET-501 (risk flags) exists — it will fail, since checkout calls into the risk lookup service. Always check a ticket's `Dependencies:` line before starting it.

---

## 1. Tech stack (do not substitute without asking)

- Next.js 15, App Router, TypeScript — no Pages Router, no JavaScript files
- Prisma ORM → Supabase PostgreSQL (`relationMode = "prisma"`)
- Supabase Auth for authentication (NOT Auth.js, NOT custom auth) — email + password only, no phone login, no OAuth at MVP
- Supabase Storage for product images
- Resend for transactional email
- Upstash Redis for rate limiting (`@upstash/ratelimit` + `@upstash/redis`)
- Sentry for error monitoring
- GA4 for analytics (consent-gated, only loads after cookie banner acceptance)
- Custom CSS ("Stitch" design system, CSS custom properties) — **no Tailwind, no CSS-in-JS, no component library** unless a ticket explicitly says otherwise
- Vercel hosting

## 2. Money handling — non-negotiable

**All money is stored and computed as integer paise (₹1 = 100 paise). Never use floating point for currency.** `subtotalPaise`, `totalPaise`, etc. Convert to ₹ display format only at the UI layer (`(paise / 100).toFixed(2)`), never store or compute in rupees-as-float.

## 3. Authentication & Authorization — non-negotiable

- Every protected route/server action follows this exact order, fails closed at each step: **(1) authenticate session exists → (2) authorize role if admin-only → (3) authorize ownership (`WHERE userId = session.user.id`) → (4) validate input (Zod) → (5) execute.**
- **Never trust client-reported role or user ID.** Always re-derive from the server-side session.
- The UI hiding admin links from non-admins is cosmetic only. Every `/admin/*` page and every `/api/v1/admin/*` route independently re-checks `role === 'ADMIN'` server-side, no exceptions.
- **Ownership mismatch on a user-owned resource (order, address, ticket, cart) returns 404, not 403** — this avoids confirming the resource ID exists to someone who doesn't own it. Role mismatch on an admin route returns 403 (admin existence isn't sensitive).
- Email verification (`email_confirmed_at` on the Supabase auth user) is required **only at checkout submission**, not for browsing, cart, or account pages.

## 4. Database rules

- All schema changes go through `prisma migrate dev` → `prisma migrate deploy`. **Never hand-edit the production database.**
- All primary keys are `uuid`. All tables have `createdAt`/`updatedAt`.
- `Order.addressId` uses `onDelete: Restrict` — a customer cannot delete an address referenced by a past order. Handle this gracefully in the UI (friendly message), not as a raw DB error.
- See `docs/FINAL-SCHEMA.prisma` for the authoritative schema — this supersedes anything in `docs/05-Database-Design.md` if they ever conflict (the final schema file is newer).
- Checkout is atomic: stock check + deduction + order creation happens inside one Prisma transaction using `SELECT ... FOR UPDATE` row locking on `ProductVariant`. See `docs/05-Database-Design.md` §4 for the exact pattern.
- Checkout requires a client-generated `idempotencyKey`; resubmission with the same key returns the original order, never creates a duplicate.

## 5. Risk & pincode rules

Pincode serviceability and COD risk both live in the `RiskFlag` table (`entityType = PINCODE`), **not** a separate table. No `RiskFlag` row for a pincode = not serviceable. See `docs/05-Database-Design.md` §2.2 for the full behavior table (`LOW`/`MEDIUM`/`HIGH`/`BLOCKED` → checkout behavior).

## 6. Order state machine

Only the transitions listed in `docs/06-Operations-Support.md` §1 are valid. Reject everything else server-side, regardless of what the client sends. Every transition writes an `OrderStatusHistory` row (`changedById = null` for system-triggered transitions, e.g., the automatic out-of-stock cancellation).

## 7. Input validation & rendering

- All user input validated server-side with Zod, regardless of frontend validation. Frontend validation is UX only, never the security boundary.
- Free-text user content (support ticket messages, complaint descriptions) renders as **plain text only** — never `dangerouslySetInnerHTML`, never markdown rendering. React's default JSX escaping is the mechanism; do not bypass it.
- Product image uploads: MIME allowlist `image/jpeg`, `image/png`, `image/webp` only (explicitly reject `image/svg+xml`), max 5MB, max 8 images per product, validated server-side regardless of client-side file picker restrictions.

## 8. Secrets

- Never hardcode any value from `docs/ENV-VARS.md`. All of them come from `process.env`, server-side only, except those explicitly prefixed `NEXT_PUBLIC_`.
- `SUPABASE_SERVICE_ROLE_KEY` must never reach client-side code or be referenced in any file under a `'use client'` boundary.
- If you (the agent) ever generate a `.env` file with real values during scaffolding, it must be in `.gitignore` before the first commit. `.env.example` gets committed with placeholder values and comments only.

## 9. Testing expectations

Every ticket's acceptance criteria includes specific test scenarios — treat them as required test cases, not optional suggestions. Security-sensitive tickets (auth, admin, checkout, risk flags) need the extra coverage specified in `docs/09-Testing-Strategy.md` §5: every admin route tested individually for 403, every user-resource route tested individually for 404-on-non-owner, COD/pincode/stock boundary values tested as distinct cases, not just happy path.

## 10. What NOT to build (explicitly out of scope at MVP)

Do not implement, even if it seems like a natural extension: Shiprocket/courier API integration, prepaid payments (UPI/cards), wishlist, multi-warehouse, multi-seller, background job workers/queues, product reviews, coupons/discount codes, phone-based login, CAPTCHA. These are documented as deliberate, confirmed exclusions — not gaps to fill in proactively. If a ticket's acceptance criteria doesn't mention it, don't build it.

## 11. When a ticket is ambiguous

Stop and ask, don't guess. If a ticket references a decision not covered in `docs/`, flag it rather than inventing business logic — this is a real COD business with real legal/financial exposure, not a prototype where "close enough" is acceptable.

---

*Full detail for everything summarized above lives in `docs/`. This file is the fast-reference layer; the numbered documents are the source of truth when more detail is needed.*
