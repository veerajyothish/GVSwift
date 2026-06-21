# GVSwift — Feature Ticket Breakdown

**Document 8 of 10 | Version 1.0 | Status: Draft for Approval**

Each ticket is written to be usable directly as a build instruction for an AI coding agent. Tickets are grouped by domain and ordered roughly by dependency. Priority: **M** = must-have for launch, **S** = should-have, **N** = nice-to-have.

---

## Epic 0 — Project Foundation

### TICKET-001: Initialize Next.js project with TypeScript, Prisma, Supabase clients
- **Priority:** M
- **Description:** Scaffold a Next.js 15 App Router project with TypeScript. Install and configure Prisma (pointed at Supabase Postgres via `DATABASE_URL`/`DIRECT_URL`), the Supabase JS client (`@supabase/ssr`), Resend SDK, and Sentry SDK. Set up `.gitignore` and `.env.example` per Technical Architecture Document §5.
- **Acceptance criteria:** `npm run dev` starts cleanly; `npx prisma db push` connects to Supabase successfully; `.env.example` lists every variable from the Technical Architecture Document with comments; no secrets committed.
- **Dependencies:** None.

### TICKET-002: Implement base Prisma schema and run initial migration
- **Priority:** M
- **Description:** Translate the full schema from the Database Design Document into `prisma/schema.prisma`, including all enums, tables, relationships, and indexes. Run the first migration.
- **Acceptance criteria:** `prisma migrate dev` succeeds; Prisma Studio shows all tables matching the Database Design Document; all enums match exactly (`OrderStatus`, `UserRole`, `RiskLevel`, `TicketStatus`, `PaymentMethod`, `RiskEntityType`).
- **Dependencies:** TICKET-001.

### TICKET-003: Configure Supabase Auth integration (server + client helpers)
- **Priority:** M
- **Description:** Build `lib/supabase/server.ts` and `lib/supabase/client.ts`. Build `lib/auth/session.ts` (`getServerSession()`) and `lib/auth/guards.ts` (`requireUser()`, `requireAdmin()`) per Security & Access Document §2.
- **Acceptance criteria:** A protected test route returns 401 when unauthenticated, 403 when authenticated but wrong role, 200 when authorized. Session cookies are HttpOnly/Secure/SameSite=Lax.
- **Dependencies:** TICKET-001, TICKET-002.

### TICKET-004: Build "Stitch" CSS design system
- **Priority:** M
- **Description:** Implement the CSS custom properties, typography scale, and base component classes from the Frontend Specification Document §1–2 in `globals.css` and `components/ui/`.
- **Acceptance criteria:** Button (primary/secondary/disabled/loading), Input, Card, Modal, Toast components exist and visually match the Black & Gold palette with documented contrast ratios. All components keyboard-navigable.
- **Dependencies:** TICKET-001.

---

## Epic 1 — Catalog Domain

### TICKET-101: Product & category Prisma models + repository layer
- **Priority:** M
- **Description:** Implement `features/catalog/repository.ts` with typed Prisma queries: list products (paginated, filtered by category/active status), get product by slug with variants and images, list categories.
- **Acceptance criteria:** All queries paginated (no unbounded `findMany`); soft-deleted products excluded by default; queries covered by integration tests against a test database.
- **Dependencies:** TICKET-002.

### TICKET-102: Public product listing page
- **Priority:** M
- **Description:** Build `/products` page: grid of product cards (per Frontend Spec §2), category filter, pagination. Mobile: 2 columns; desktop: 4 columns.
- **Acceptance criteria:** Page loads with real seeded data; filtering by category updates the URL query param; out-of-stock products show a badge but remain visible.
- **Dependencies:** TICKET-101, TICKET-004.

### TICKET-103: Product detail page
- **Priority:** M
- **Description:** Build `/products/[slug]` page with variant selector (size/color from `attributes` JSON), price (base + variant delta), stock status, COD availability note, and a condensed Shipping & Returns summary above the fold on mobile, with "Learn more" links to full policy pages.
- **Acceptance criteria:** Selecting a variant updates displayed price and stock; "Add to cart" disabled if selected variant is out of stock; COD note and shipping summary visible without scrolling on a 375px-wide viewport.
- **Dependencies:** TICKET-101, TICKET-004.

### TICKET-104: Admin product CRUD
- **Priority:** M
- **Description:** Build `/admin/products` list + create/edit forms, including variant management (add/remove variants with attributes, stock, price delta) and image upload to Supabase Storage with server-side validation: **MIME type allowlist (`image/jpeg`, `image/png`, `image/webp` only — reject everything else including `image/svg+xml`, which can carry embedded scripts), max file size 5MB per image, max 8 images per product.** Alt text is a required field per image.
- **Acceptance criteria:** Only ADMIN role can access; creating/editing a product with invalid data (negative price, missing name) is rejected server-side with field errors; uploaded images appear correctly on the public product page; deactivating a product hides it from `/products` without deleting data; **uploading a file with a disallowed MIME type or over the size limit is rejected server-side with a clear error, even if the client-side file picker was bypassed (test by sending a raw multipart request with a renamed `.exe` or oversized file directly to the API, not just through the UI).**
- **Dependencies:** TICKET-003, TICKET-101.

### TICKET-105: Basic product search
- **Priority:** S
- **Description:** Implement Postgres `ILIKE`/full-text search on product name/description, exposed via a search bar in the navbar, behind a `SearchService` abstraction (per Technical Architecture Document §7 — Search Architecture) so it can be swapped for a dedicated search engine later without touching UI code.
- **Acceptance criteria:** Searching returns relevant results; search logic lives entirely behind `features/catalog/search.ts`, not inline in route handlers or components.
- **Dependencies:** TICKET-101.

---

## Epic 2 — Cart & Checkout Domain

### TICKET-201: Cart service (add/update/remove, persisted per user)
- **Priority:** M
- **Description:** Implement `features/cart/service.ts`: get-or-create cart for logged-in user, add item (validates stock at add-time, non-blocking — real check happens at checkout), update quantity, remove item. **Ownership model:** `Cart.userId` is nullable at the schema level (pre-login browsing is allowed to start a cart), but every cart-mutating server action requires an authenticated session in practice — there is no anonymous-cart API exposed at MVP, since guest checkout is disabled and a cart with no path to checkout serves no purpose unauthenticated. Every cart read/write is scoped by `WHERE userId = session.user.id`, never by `cartId` alone, to prevent one user from accessing another's cart by guessing/enumerating cart IDs (IDOR).
- **Acceptance criteria:** Cart persists across sessions for a logged-in user; quantity cannot go below 1 via update (use remove instead); adding an out-of-stock variant is rejected with a clear message. **A request for a cart by `cartId` that doesn't belong to the session's user returns 404, not the cart's contents — verified by an explicit test using two distinct user sessions.**
- **Dependencies:** TICKET-003, TICKET-101.

### TICKET-202: Cart page UI
- **Priority:** M
- **Description:** Build `/cart` page showing line items, quantity steppers, remove buttons, running subtotal, and a "Proceed to checkout" CTA (disabled if cart is empty).
- **Acceptance criteria:** Updating quantity reflects immediately in subtotal; empty cart shows a friendly empty state with a link to `/products`.
- **Dependencies:** TICKET-201, TICKET-004.

### TICKET-203: Address management (CRUD + default)
- **Priority:** M
- **Description:** Implement `features/users/addresses.ts` and `/account/addresses` UI: add/edit/delete address, mark one as default, pincode validated against `RiskFlag` rows where `entityType = PINCODE` (see Database Design Document §2.2 — absence of a row means not serviceable). Deleting an address used by a past order must fail gracefully (see acceptance criteria), since `Order.addressId` uses `onDelete: Restrict`.
- **Acceptance criteria:** Pincode with no matching `RiskFlag` row shows a clear "not currently serviceable" message at entry time, not just at checkout; pincode with `riskLevel = BLOCKED` shows "COD unavailable for this pincode"; only one address can be default at a time; attempting to delete an address referenced by an existing order shows a friendly message ("This address is used in a past order and can't be deleted") instead of a raw database error. **Every address read/update/delete operation verifies `Address.userId` matches the session user (per Security & Access Document §2's IDOR pattern) — a user requesting another user's address ID by guessing/incrementing receives a 404, identical in shape to "address not found," never a 403 that would confirm the ID's existence.**
- **Dependencies:** TICKET-002, TICKET-003, TICKET-501.

### TICKET-204: Checkout orchestration (atomic order creation)
- **Priority:** M
- **Description:** Implement `features/checkout/service.ts` exactly per Database Design Document §4: row-locked stock check + deduction, Order + OrderItem creation, idempotency key handling, all within a single Prisma transaction. Validates COD eligibility (COD limit, pincode `RiskFlag` lookup, phone/address/user `RiskFlag` lookups) before allowing order creation, per the behavior table in Database Design Document §2.2 and Operations & Support Document §2.
- **Acceptance criteria:** Two simultaneous checkout requests for the last unit of a variant — only one succeeds, the other gets a clear "out of stock" error, no overselling occurs (test with concurrent requests). Resubmitting the same idempotency key returns the original order, not a duplicate. Order total exceeding the configured COD limit is rejected with a clear message. Pincode with `riskLevel = HIGH` creates the order but holds it for manual admin approval before `CONFIRMED`; `BLOCKED` pincode rejects COD at checkout with a clear message.
- **Dependencies:** TICKET-201, TICKET-203, TICKET-002, TICKET-501.

### TICKET-205: Checkout page UI
- **Priority:** M
- **Description:** Build `/checkout` page: address selection/entry, order summary (line items, subtotal, shipping, COD fee [₹0], total — all per Database Design Document money handling), condensed Returns/Shipping summary near the CTA, unticked T&C consent checkbox (required to proceed), COD-only payment section clearly labeled.
- **Acceptance criteria:** "Place order" is disabled until the consent checkbox is checked; the checkbox is never pre-ticked; order summary numbers exactly match what's persisted to the `orders` row after submission.
- **Dependencies:** TICKET-204, TICKET-004.

---

## Epic 3 — Orders Domain

### TICKET-301: Order state machine service
- **Priority:** M
- **Description:** Implement `features/orders/state-machine.ts` enforcing exactly the transition table in Operations & Support Document §1, including the automatic `PLACED` → `CANCELLED` stock re-check on confirmation (Operations & Support Document §1, "Out-of-stock after order"). Every transition writes an `OrderStatusHistory` row, with `changedById = null` for system-triggered transitions.
- **Acceptance criteria:** Attempting an invalid transition (e.g., `PLACED` → `DELIVERED` directly) is rejected with a clear error; every valid transition is unit-tested individually; attempting `PLACED` → `CONFIRMED` on an order whose items now exceed available stock auto-cancels the order instead of confirming it, and records `reason = "Auto-cancelled: insufficient stock at confirmation"`.
- **Dependencies:** TICKET-002.

### TICKET-302: Customer order history & detail/tracking pages
- **Priority:** M
- **Description:** Build `/orders` (list, paginated) and `/orders/[id]` (detail: items, status timeline from `OrderStatusHistory`, `trackingReference` shown once present, cancel/return action buttons where applicable).
- **Acceptance criteria:** A user can only view their own orders (404 on others' order IDs, per Security Doc §2); cancel button only appears when `status` is pre-`SHIPPED`; return button only appears when `status = DELIVERED` and within the return window; `trackingReference` displays as plain text once an admin has entered it, with a note that it's a manually-entered reference (not live courier tracking) to set correct customer expectations.
- **Dependencies:** TICKET-301, TICKET-003.

### TICKET-303: Customer cancellation flow
- **Priority:** M
- **Description:** Implement cancel action: validates current status against cutoff, requires a reason, transitions to `CANCELLED`, releases reserved stock back to `ProductVariant.stock`.
- **Acceptance criteria:** Cancelling a `SHIPPED` order as a customer is rejected; cancelling a valid order restores stock count correctly (verify via test).
- **Dependencies:** TICKET-301.

### TICKET-304: Customer return request flow
- **Priority:** M
- **Description:** Implement return request action on `DELIVERED` orders within `return_window_days`, capturing a reason, transitioning to `RETURN_REQUESTED`.
- **Acceptance criteria:** Requesting a return after the window closes is rejected with a clear message stating the window has passed.
- **Dependencies:** TICKET-301.

### TICKET-305: Admin order management
- **Priority:** M
- **Description:** Build `/admin/orders` list (filterable by status/date/user, filters persisted in URL params per Frontend Spec §6) and detail view with status update controls (restricted to valid transitions only), internal notes field, delivery attempt tracking, risk flag visibility for the order's phone/address/pincode, and a `trackingReference` free-text input shown once the order reaches `SHIPPED`. Auto-cancelled orders (system-triggered, stock-related) must be visually distinguishable from admin- or customer-cancelled orders in the list.
- **Acceptance criteria:** Admin cannot force an invalid transition through the UI or the API (server-side enforcement, not just disabled buttons); every status change by admin requires a reason if it's an override (e.g., cancelling a `SHIPPED` order); attempting to confirm an order with now-insufficient stock surfaces the auto-cancellation outcome clearly rather than silently failing; orders auto-cancelled for stock reasons show a distinct badge/indicator in the order list.
- **Dependencies:** TICKET-301, TICKET-003.

---

## Epic 4 — Support Domain

### TICKET-401: Support ticket service + customer UI
- **Priority:** M
- **Description:** Implement `features/support/service.ts` (create ticket, list own tickets, add customer message) and `/support` + `/support/[ticketId]` pages. **`subject`, `description`, and `TicketMessage.message` are free-text user input that gets stored and later rendered back to both the submitting customer and admin staff — render as plain text only (React's default JSX escaping is sufficient; do not use `dangerouslySetInnerHTML` or any markdown/HTML rendering on these fields under any circumstance), and enforce a reasonable max length server-side (e.g., 5,000 characters) to prevent abuse via oversized payloads.**
- **Acceptance criteria:** Ticket creation is rate-limited (10/hour/user per Security Doc §5); customer sees only non-internal messages on their ticket thread. **Submitting a message containing `<script>` or other HTML tags stores it as literal text and renders it as inert text on screen, verified by an explicit test — it must never execute or render as markup for either the customer or admin viewing it.**
- **Dependencies:** TICKET-003.

### TICKET-402: Admin complaint/ticket management
- **Priority:** M
- **Description:** Build `/admin/complaints` list (filter by status), detail view with reply (customer-visible) and internal note (admin-only) capability, status updates.
- **Acceptance criteria:** Internal notes never appear in the customer-facing ticket view, verified by test; status filter works correctly.
- **Dependencies:** TICKET-401, TICKET-003.

---

## Epic 5 — Risk & Fraud Domain

### TICKET-501: Risk flag CRUD + lookup service
- **Priority:** M
- **Description:** Implement `features/risk/service.ts`: create/update risk flags by entity type (`PHONE`/`ADDRESS`/`PINCODE`/`USER`), lookup function used by both address entry (serviceability) and checkout (COD eligibility) per Operations & Support Document §2 and Database Design Document §2.2. This ticket has no dependency on checkout or address management — it must be built **before** both, since TICKET-203 and TICKET-204 each call into it.
- **Acceptance criteria:** Pincode lookup with no matching row returns "not serviceable"; lookups for `LOW`/`MEDIUM`/`HIGH`/`BLOCKED` each return the correct configured behavior per Database Design Document §2.2's table; lookups are indexed and fast (no full table scan, verified via the existing `risk_entity_idx` composite index).
- **Dependencies:** TICKET-002.

### TICKET-502: Automatic risk flag triggers (failed delivery, cancellation pattern)
- **Priority:** S
- **Description:** Implement the synchronous trigger checks described in Operations & Support Document §2 — on `FAILED_DELIVERY`, check 90-day failure count and auto-flag; on repeated post-confirmation cancellations, flag for manual review.
- **Acceptance criteria:** Triggers fire correctly in tests simulating the threshold conditions; flags created this way are marked with `createdByUserId = null` or a system marker, distinguishable from manually-created flags.
- **Dependencies:** TICKET-501, TICKET-301.

### TICKET-503: Admin risk management UI
- **Priority:** M
- **Description:** Build `/admin/risk` page: search/view risk flags by entity, manually create/edit flags with required reason field.
- **Acceptance criteria:** Only ADMIN can access; every flag change is captured in `audit_logs`.
- **Dependencies:** TICKET-501, TICKET-003.

---

## Epic 6 — Settings/Config Domain

### TICKET-601: Settings service + seed defaults
- **Priority:** M
- **Description:** Implement `features/settings/service.ts` (typed get/set wrapper over the `settings` table) and a seed script populating the defaults from Operations & Support Document §2.
- **Acceptance criteria:** All business rule reads (COD limit, return window, cancellation cutoff, delivery attempts) go through this service, never hardcoded constants elsewhere in the codebase (verify via code search during review).
- **Dependencies:** TICKET-002.

### TICKET-602: Admin settings UI
- **Priority:** M
- **Description:** Build `/admin/settings` page exposing all configurable values with appropriate input types (currency for paise values, number for windows/limits), validated server-side before saving.
- **Acceptance criteria:** Changing a setting takes effect immediately for new requests without a redeploy; invalid values (e.g., negative limit) are rejected.
- **Dependencies:** TICKET-601, TICKET-003.

---

## Epic 7 — Notifications Domain

### TICKET-701: NotificationService + Resend implementation
- **Priority:** S
- **Description:** Implement the `NotificationService` interface and a Resend-backed implementation per Operations & Support Document §5. Build at minimum: order confirmation and order status change templates.
- **Acceptance criteria:** Sending failure is logged but never throws/rolls back the calling transaction; templates render correctly with real order data; emails sent from an address using `NEXT_PUBLIC_SITE_URL`-derived domain or a configured sender.
- **Dependencies:** TICKET-204, TICKET-301.

---

## Epic 8 — Legal & Trust Pages

### TICKET-801: Static legal pages (Privacy, Terms, Returns, Shipping, Cookies, Disclaimer, FAQ, Grievance)
- **Priority:** M
- **Description:** Build all pages listed in Operations & Support Document §4, using the placeholder grievance contact (`gvswift.help@gmail.com`, name and address marked `[TO BE FILLED]`), linked from footer.
- **Acceptance criteria:** All pages reachable from footer on every page; checkout links to Returns + Shipping; signup links to Privacy + Terms; placeholders clearly marked in a way that's easy to find-and-replace later.
- **Dependencies:** TICKET-004.

### TICKET-802: Cookie consent banner
- **Priority:** M
- **Description:** Build a consent banner shown on first visit; GA4 script only loads after consent is granted (per Security/Frontend specs); choice persisted (cookie or localStorage).
- **Acceptance criteria:** GA4 network requests are verifiably absent before consent is given; declining consent doesn't break core site functionality.
- **Dependencies:** TICKET-004.

---

## Epic 9 — Platform / Cross-Cutting

### TICKET-901: Rate limiting middleware
- **Priority:** M
- **Description:** Implement rate limiting per Security & Access Document §5 on login, signup, checkout, and ticket creation endpoints.
- **Acceptance criteria:** Exceeding the limit returns a 429 with a clear retry-after message; legitimate traffic under the limit is unaffected.
- **Dependencies:** TICKET-003, TICKET-204, TICKET-401.

### TICKET-902: Security headers configuration
- **Priority:** M
- **Description:** Configure all headers from Security & Access Document §7 in `next.config.ts`.
- **Acceptance criteria:** Headers verified present via browser dev tools / `curl -I` against a deployed preview; CSP doesn't break Supabase Auth, GA4, or Sentry (test all three after applying).
- **Dependencies:** TICKET-001.

### TICKET-903: Sentry integration with PII scrubbing + alert rules
- **Priority:** M
- **Description:** Wire up Sentry client + server configs with a `beforeSend` hook stripping email/phone from events, per Security & Access Document §6. **Additionally, configure a Sentry alert rule** (in the Sentry dashboard, not code — e.g., "notify via email when more than 10 events occur in 5 minutes" or "notify on first occurrence of a new issue") per Deployment & Infrastructure Document §6, so the founder is proactively emailed on error spikes rather than relying solely on manually checking the dashboard.
- **Acceptance criteria:** A deliberately triggered test error appears in Sentry without PII in the payload. A deliberately triggered burst of test errors (e.g., 15 errors in under 5 minutes in a staging/preview environment) results in an actual alert email being received, confirming the rule is live and correctly configured — not just present in settings.
- **Dependencies:** TICKET-001.

### TICKET-904: Audit logging utility
- **Priority:** M
- **Description:** Implement `features/admin/audit-log.ts`, called from every admin mutation (product edits, order status changes, risk flag changes, settings changes).
- **Acceptance criteria:** Every admin action listed above produces exactly one `audit_logs` row with correct actor, action, target.
- **Dependencies:** TICKET-002.

### TICKET-905: SEO basics (sitemap, robots.txt, metadata, structured data)
- **Priority:** S
- **Description:** Implement per Technical Architecture/PRD: dynamic `app/sitemap.ts`, `public/robots.txt`, per-product metadata (title/description/OG tags), Schema.org Product structured data.
- **Acceptance criteria:** `/sitemap.xml` lists all active products and static pages; product pages pass Google's Rich Results structured data test.
- **Dependencies:** TICKET-103.

---

*End of Feature Ticket Breakdown. Proceed to Document 9 — Testing Strategy.*
