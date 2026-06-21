# GVSwift — Implementation Roadmap

**Document 11 | Phase 6 of the Master Prompt Process | Version 1.0**

This document sits one level above `docs/AI-IMPLEMENTATION-INSTRUCTIONS.md`'s 8-phase build order (Document 8's tickets). That file tells the agent *what to build next*; this file tells **you** when to stop, what "done" actually means at each stage, and what to manually verify before letting the agent continue. Use the milestone diagram above as the at-a-glance view; this document is the detail behind it.

---

## How to use this roadmap

Each milestone below maps to one or more Build Order phases from `AI-IMPLEMENTATION-INSTRUCTIONS.md`. At the end of each milestone there's a **checkpoint** — a short list of things only a human can actually verify (the agent can claim a ticket is "done," but you decide whether it's *actually* done). Don't start the next milestone until the checkpoint passes. This isn't bureaucracy for its own sake — it's specifically because a wrong assumption in Milestone 1 (e.g., a broken auth guard) gets built on top of by every later milestone, and is far more expensive to unwind after Milestone 3 than to catch now.

---

## Milestone 1 — Foundation Ready

**Covers:** Build Order Phase 0 (TICKET-001 through 004)

**Exit criteria (what "ready" means):**
- `npm run dev` runs with no errors
- `npx prisma migrate dev` succeeds against your actual Supabase instance, not just a dummy connection string
- A test protected route correctly returns 401 (no session), 403 (wrong role), and 200 (authorized) — all three cases, not just the happy path
- Signing up and logging in via Supabase Auth works end-to-end, including the verification email actually arriving
- The Stitch design system renders: Button (all 4 states), Input, Card, Modal, Toast all visually match Black & Gold per Document 4

**Checkpoint (do this yourself before continuing):**
- [ ] Open the deployed Vercel preview on an actual mobile device, not just a resized browser window — confirm nothing is broken at real mobile width
- [ ] Confirm `.env` is in `.gitignore` and was never committed — check `git log` for it, don't just trust the file exists
- [ ] Run `npx prisma validate` yourself if you haven't already (this was flagged as unverified when the schema was generated)

**If this checkpoint fails:** stop. Do not proceed to Milestone 2 with broken auth or a schema that doesn't migrate cleanly — every subsequent milestone assumes this foundation is solid.

---

## Milestone 2 — Storefront Ready

**Covers:** Build Order Phase 1 (Risk & Settings) + Phase 2 (Catalog)

**Exit criteria:**
- `Setting` table seeded with the defaults from Document 6 §2 (COD limit ₹10,000, return window 7 days, cancellation cutoff `SHIPPED`, etc.)
- At least a handful of real `RiskFlag` rows seeded for pincodes you actually intend to serve in Vizag/AP (per Document 5 §2.2 — no row means "not serviceable," so this seeding step is not optional, the storefront will look broken without it)
- Admin can create a product with variants, images, and stock through `/admin/products` — and that product correctly appears on `/products` and `/products/[slug]`
- Search returns relevant results for a real query

**Checkpoint:**
- [ ] As a non-admin user, confirm `/admin` and all `/admin/*` routes correctly redirect/403 — don't just trust the nav link is hidden
- [ ] Manually try to delete a category that has products in it — confirm it behaves sensibly (this was flagged in Document 5 as an open design question; verify whatever the agent actually built handles it without an ugly error)
- [ ] Load `/products` with throttled/slow network simulation (browser dev tools) — confirm it doesn't break or show a blank page

---

## Milestone 3 — First Real Order

**Covers:** Build Order Phase 3 (Cart, Address, Checkout) + Phase 4 (Orders)

**This is the highest-scrutiny milestone.** Everything here touches money, inventory, and customer data — treat this checkpoint as non-negotiable, even if it feels slow.

**Exit criteria:**
- A logged-in, email-verified user can browse → add to cart → check out with COD → see an order confirmation
- The order's `subtotalPaise`/`totalPaise` exactly match what was shown at checkout — no silent rounding or mismatch
- Cancelling a `PLACED` order correctly restores stock
- An order moved from `PLACED` → `CONFIRMED` with now-insufficient stock auto-cancels (per the confirmed Phase 4 decision) — this is easy to forget to test since it's an edge case, but it's a real behavior the agent must implement, not just describe

**Checkpoint (don't skip any of these):**
- [ ] **Concurrency test:** open two browser sessions (or use a script), attempt to buy the last unit of the same variant simultaneously. Exactly one should succeed. If both succeed, you have an overselling bug — stop and fix before continuing.
- [ ] **Idempotency test:** submit checkout, then resubmit with the same idempotency key (e.g., double-click the button, or replay the request). Confirm only one order was created.
- [ ] **IDOR test:** log in as User A, note an order ID. Log in as User B, attempt to fetch User A's order by URL. Confirm 404, not the order's data.
- [ ] **Address deletion test:** place an order, then try to delete the address used for it. Confirm it's blocked with a friendly message, not a raw database error (per `onDelete: Restrict`).
- [ ] **Boundary test:** place an order at exactly ₹10,000 (should succeed) and ₹10,000.01-equivalent in paise (should be rejected). Off-by-one errors on money boundaries are a classic source of real bugs.

**If any of these fail:** this is the most consequential milestone to get wrong — a customer who gets overcharged, double-charged, or has their order leaked to another user is a real trust and legal problem, not just a bug. Do not move to Milestone 4 until every item above passes.

---

## Milestone 4 — Support & Trust Layer

**Covers:** Build Order Phase 5 (Support) + Phase 6 (Notifications & Legal)

**Exit criteria:**
- A customer can submit a support ticket and see admin replies (but not internal notes)
- Order confirmation and at least one status-change email actually arrive (test with a real email address, not just check the Resend dashboard logs)
- All 7 legal pages are live and linked from the footer, with `[TO BE FILLED]` placeholders still clearly marked (these get replaced before real launch, not before this milestone)
- Cookie consent banner blocks GA4 from firing until accepted — verify in the browser's network tab, not by assumption

**Checkpoint:**
- [ ] Submit a ticket message containing `<script>alert(1)</script>` as literal text — confirm it renders as inert text, not executed, for both the customer and admin view (per the XSS-safe rendering requirement)
- [ ] Confirm an admin's internal note on a ticket never appears in the customer's view, under any circumstance
- [ ] Click every footer legal link and confirm none 404

---

## Milestone 5 — MVP Launch Candidate

**Covers:** Build Order Phase 7 (Platform hardening)

**Exit criteria:**
- Rate limiting actually triggers at the configured thresholds (test by exceeding them, don't just trust the code exists)
- Security headers present on production responses (`curl -I` your deployed URL)
- A deliberately triggered test error appears in Sentry without PII, and a deliberately triggered burst of errors actually produces an alert email
- `sitemap.xml` and `robots.txt` are correct and reachable

**Checkpoint — this is `docs/10-Production-Readiness-Checklist.md` in full, not a subset.** Walk every box in that document, including the ⚠️ legal/CA items. This milestone is the actual launch gate — everything before it was building toward this point.

**Do not accept real customer orders until:**
- A lawyer has reviewed the legal pages (or you've made a conscious, informed decision to soft-launch with placeholders and accept that risk briefly)
- The Grievance Officer name/email/address are real, not `[TO BE FILLED]`
- A CA has weighed in on GST obligations and data retention periods

These three are explicitly **not** things Antigravity or this build process can resolve for you — they're called out repeatedly throughout this package for that reason.

---

## Post-MVP (not built yet — reference only)

Once Milestone 5 ships and you have real order data, the natural next priorities, in rough order of likely value:

1. **Tune the risk thresholds** (Document 6 §2's defaults were explicitly provisional — "no validated industry benchmark exists" — revisit with real RTO/cancellation data after a few weeks of live orders)
2. **Wishlist** (explicitly deferred from MVP scope per your confirmed decision)
3. **Shiprocket integration** (replaces the manual `trackingReference` field with real tracking — the `ShippingService` abstraction in Document 2 §6 exists specifically so this swap doesn't require rewriting checkout/order logic)
4. **Prepaid payments** (UPI/cards — `PaymentMethod.PREPAID` already exists as a reserved enum value, unused, waiting for this)
5. **Multi-state expansion** (per your stated 1-2 year goal — the `RiskFlag`-based pincode system already generalizes beyond Andhra Pradesh without a schema change, you'd just be adding rows)

None of these should be started speculatively — start the next one when the previous one is stable and you have a real reason (actual customer demand, actual operational pain) to build it, consistent with the "prefer maintainability over premature feature completion" principle that ran through every phase of this process.

---

*This is Document 11, completing all 6 phases of the master prompt process: Requirements Discovery → Brief → 10 Documents → Architecture Review → Final Implementation Package → Implementation Roadmap.*
