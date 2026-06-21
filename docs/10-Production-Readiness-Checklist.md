# GVSwift — Production Readiness Checklist

**Document 10 of 10 | Version 1.0 | Status: Draft for Approval**

This checklist gates the move from "code complete" to "real customers can order." Nothing here should be skipped without an explicit, documented decision.

---

## Security

- [ ] No secrets in source control (verified via `git log -p | grep` sweep and GitHub secret scanning)
- [ ] `.env.example` matches every variable actually used in code
- [ ] All admin routes verified to 403 for non-admin users (every route individually tested, per Testing Strategy §5)
- [ ] All user-resource routes verified to 404 (not leak existence) for non-owners
- [ ] Rate limiting active and tested on login, signup, checkout, ticket creation
- [ ] Security headers (CSP, HSTS, X-Frame-Options, etc.) present on production responses — verified with `curl -I`
- [ ] CSP confirmed not to break Supabase Auth redirect flow, GA4, or Sentry
- [ ] Sentry `beforeSend` PII scrubbing verified with a real test error
- [ ] Sentry alert rule configured and confirmed working (test alert actually received by email, not just configured in settings)
- [ ] Dependency vulnerability scan clean (or known issues explicitly accepted/documented)
- [ ] Cookie consent banner blocks GA4 until consent given (verified via network tab)
- [ ] Resend API key confirmed scoped to "Sending access" only in the Resend dashboard (not full account access) — limits blast radius if leaked

## Data Integrity

- [ ] Checkout concurrency test passes (no overselling under simulated simultaneous requests)
- [ ] Idempotency key prevents duplicate orders on resubmission
- [ ] Order state machine rejects every invalid transition (full matrix tested)
- [ ] Every order status change produces an `order_status_history` row
- [ ] Every admin mutation produces an `audit_logs` row

## Legal / Compliance (⚠️ items below require human legal/CA review before real launch)

- [ ] Privacy Policy, Terms, Returns, Shipping, Cookies, Disclaimer, FAQ, Grievance pages all live and linked from footer
- [ ] Grievance Officer contact present (placeholder acceptable for soft-launch, **must be replaced with real name/address before accepting real customer orders**)
- [ ] T&C consent checkbox present at checkout, unticked by default
- [ ] COD fee (₹0) shown as an explicit line item, not hidden
- [ ] Business registered address present on legal pages (placeholder acceptable for soft-launch only)
- [ ] ⚠️ A lawyer or CA has reviewed the legal pages before the site accepts real paying customers
- [ ] ⚠️ GST/tax obligations confirmed with a CA based on actual/projected turnover
- [ ] ⚠️ **Data retention periods confirmed with a CA** — specifically: minimum retention for orders/financial records (GST/income tax), and any maximum retention limit on customer PII under DPDPA after account closure. See Document 6, §6 for the placeholder defaults currently in place (not legally validated).

## Infrastructure

- [ ] Production environment variables set correctly in Vercel (separate from Preview/Development)
- [ ] Supabase free-tier limits understood and being monitored (storage, DB size, MAU) — confirmed directly against current Supabase docs, not assumed from this document
- [ ] Database backup confirmed active; a test restore has been attempted at least once
- [ ] HTTPS enforced (no mixed content warnings)
- [ ] Supabase "SSL enforce" setting enabled (encrypted DB connections required, not just optional) — see Deployment & Infrastructure Document §3
- [ ] Custom domain plan understood — placeholder `vercel.app` URL acceptable for soft-launch, with `NEXT_PUBLIC_SITE_URL` confirmed as the single source of truth for canonical URLs

## Testing

- [ ] All CI gates green on `main` (lint, typecheck, unit, integration, build)
- [ ] E2E suite passes against a Vercel preview deployment
- [ ] Manual smoke test of full purchase flow performed by a human, on a real mobile device, immediately before go-live

## Operations Readiness

- [ ] Admin (you) has logged into `/admin` and confirmed product, order, complaint, risk, and settings panels all function
- [ ] At least one real product is live with correct stock, price, and images
- [ ] Pincode serviceability list seeded for your intended AP launch area
- [ ] COD limit, return window, cancellation cutoff, and risk thresholds reviewed and confirmed as the values you actually want live (not just the suggested defaults)
- [ ] You know how to manually mark an order's status through its lifecycle (since Shiprocket isn't integrated yet)

## Known, Accepted MVP Limitations (documented, not hidden)

- No automated stock reservation/hold on "add to cart" — stock deducted only at order placement (Database Design Doc §5)
- No background job infrastructure — all async-shaped work runs synchronously (Deployment Doc §5)
- No multi-warehouse, multi-seller, or prepaid payment support (explicitly deferred, schema reserves room)
- No Shiprocket integration — order fulfillment and tracking updates are manual admin entry
- Risk scoring is mostly manual + a few simple automatic triggers, not continuous background analysis

---

*End of Document 10. All 10 documents are now drafted. Proceeding to your review (Phase 3 approval gate) before Phase 4 — Architecture Review.*
