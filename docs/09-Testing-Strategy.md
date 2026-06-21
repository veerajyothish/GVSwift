# GVSwift — Testing Strategy Document

**Document 9 of 10 | Version 1.0 | Status: Draft for Approval**

---

## 1. Testing Philosophy

Test business logic thoroughly (it's where money and fraud risk live); test UI behavior at key flows only (full E2E coverage of every screen isn't justified at this scale). Security-sensitive code gets the most coverage of any category.

**Tooling:** Vitest for unit/integration (fast, native ESM/TS support, good Next.js compatibility), Playwright for end-to-end (handles real browser flows, good free CI support).

---

## 2. Unit Tests (Vitest)

| Area | What to test |
|---|---|
| `features/checkout/service.ts` | Pricing calculation (subtotal + shipping + COD fee = total, in paise, no floating point drift); COD limit rejection at exactly the boundary value and one paisa over |
| `features/orders/state-machine.ts` | Every valid transition succeeds; every invalid transition is rejected — table-driven test covering the full matrix from Operations & Support Document §1 |
| `lib/validation/*` (Zod schemas) | Valid input passes; each invalid case (missing field, wrong type, out-of-range, malformed pincode/phone) is rejected with the expected error |
| `features/risk/service.ts` | COD eligibility logic for NORMAL/HIGH_RISK/BLACKLISTED combinations matches the configured behavior exactly |
| `features/settings/service.ts` | Get/set round-trips correctly; invalid values rejected |

---

## 3. Integration Tests (Vitest + test database)

| Area | What to test |
|---|---|
| API routes (`/api/v1/...`) | Each route: 401 if unauthenticated, 403 if wrong role, 400 on invalid input, 200/201 on success, response shape matches contract |
| Checkout concurrency | Simulate two simultaneous checkout requests for the last unit of stock; assert exactly one succeeds and stock never goes negative |
| Idempotency | Submitting the same idempotency key twice returns the same order, not a duplicate |
| Auth flows | Signup → email verification gate → login → protected route access, using Supabase's test/local auth setup |
| Order ownership (IDOR) | User A cannot fetch User B's order by ID (expect 404, not data leak) |
| Audit logging | Every admin mutation produces exactly one correctly-populated `audit_logs` row |

> Use a dedicated test database (separate Supabase project or local Postgres via Docker) — never run integration tests against production or shared dev data.

---

## 4. End-to-End Tests (Playwright)

| Flow | Steps covered |
|---|---|
| Signup → verify → login | Full account creation through to authenticated session |
| Browse → cart → checkout | Add to cart, adjust quantity, checkout with COD, see order confirmation |
| Order cancellation | Place order → cancel while `PLACED` → verify status and stock release |
| Return request | (Requires seeded `DELIVERED` order) → request return → verify status |
| Admin product CRUD | Login as admin → create product with variant and image → verify it appears on storefront |
| Admin order status update | Login as admin → move an order through PLACED → CONFIRMED → SHIPPED → verify history log |
| Complaint flow | Submit ticket as customer → admin replies → customer sees reply, not any internal note |
| Legal page accessibility | Footer links to all 7 legal pages resolve without error |

---

## 5. Security-Sensitive Feature — Additional Coverage

Per the master spec's requirement for extra rigor here:

- **Auth:** brute-force rate limiting actually triggers at the configured threshold; session cookies carry correct flags; password reset tokens expire and are single-use
- **Admin access:** every `/admin/*` route and every `/api/v1/admin/*` route individually tested for the 403-on-non-admin case — not just one route assumed to represent all of them
- **Order creation:** COD limit boundary, pincode serviceability boundary, risk flag boundary — each tested as a distinct case, not just the happy path
- **Risk flagging:** flagging an entity actually blocks/restricts COD at checkout in the next request — test the full loop, not just the flag's existence in the DB

---

## 6. CI Integration

All test suites run in GitHub Actions on every pull request (see Deployment & Infrastructure Document §2). A PR cannot merge if:
- Lint fails
- Type check fails
- Any unit or integration test fails
- Build fails

E2E tests run against the Vercel preview deployment URL for that PR (Playwright pointed at the preview URL), catching environment-specific issues that local/CI-only testing might miss.

---

## 7. What's Explicitly Not Covered at MVP

- Load/performance testing — deferred until real traffic patterns exist; premature at 10–20 products and low volume
- Visual regression testing — deferred; manual review via Vercel previews is sufficient at this team size
- Accessibility automated scanning (e.g., axe-core in CI) — **recommended as a should-have**, not blocking MVP, but cheap to add and worth doing early since retrofitting accessibility is harder than building it in

---

*End of Testing Strategy Document. Proceed to Document 10 — Production Readiness Checklist.*
