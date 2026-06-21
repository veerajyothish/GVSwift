# GVSwift — AI Implementation Instructions

**Read `.antigravity/CONTEXT.md` first. This file is the execution plan; CONTEXT.md is the standing rules.**

---

## How to use this package in Antigravity

1. Put this entire folder structure into your project root (see `FOLDER-STRUCTURE.md`).
2. Confirm Antigravity has loaded `.antigravity/CONTEXT.md` as persistent context (check Antigravity's settings for context/knowledge-base file recognition — verify this in-app, as exact mechanics may have changed since this package was written).
3. Run schema validation yourself first: `npx prisma validate` then `npx prisma format` on `prisma/schema.prisma` (copied from `docs/FINAL-SCHEMA.prisma`) — do this before the agent touches anything, since this file was structurally checked but not run through the real Prisma CLI when generated.
4. Work through the build order below, **one phase at a time**, in a fresh Antigravity conversation per phase (or per 2-3 tickets within a phase). Reference the relevant `docs/` files by name in your prompt to the agent — don't assume it will infer which document is relevant.
5. Use Agent-Assisted mode with review gates on for anything in Build Order Phase 3+ (checkout, orders, risk) — these touch money and customer data. Phases 0-2 (foundation, catalog) are lower-stakes and can be reviewed more loosely.
6. Commit after each ticket, not after each phase. If something goes wrong, you want to revert one ticket's worth of change, not three.

---

## Build Order (sequenced from Document 8's dependency graph)

### Phase 0 — Foundation (build first, nothing else works without this)
1. TICKET-001 — Project init (Next.js, Prisma, Supabase clients, Resend, Sentry)
2. TICKET-002 — Prisma schema + initial migration (use `docs/FINAL-SCHEMA.prisma`, not the original draft)
3. TICKET-003 — Supabase Auth integration + `requireUser()`/`requireAdmin()` guards
4. TICKET-004 — Stitch CSS design system + base UI components

**Example first prompt to the agent:**
> "Implement TICKET-001 and TICKET-002 from `docs/08-Feature-Tickets.md`. Use `docs/FINAL-SCHEMA.prisma` as the exact schema — copy it to `prisma/schema.prisma` verbatim, do not regenerate it from scratch. Follow the environment variable list in `docs/ENV-VARS.md` for `.env.example`. Follow the folder structure in `docs/FOLDER-STRUCTURE.md`."

### Phase 1 — Risk & Settings (build before catalog/checkout depend on them)
5. TICKET-501 — Risk flag CRUD + lookup service (**no dependency on checkout — must come before TICKET-203/204**)
6. TICKET-601 — Settings service + seed defaults (COD limit, return window, cancellation cutoff, etc. — see `docs/06-Operations-Support.md` §2 for exact default values to seed)
7. TICKET-502 — Automatic risk flag triggers
8. TICKET-503 — Admin risk management UI
9. TICKET-602 — Admin settings UI

### Phase 2 — Catalog
10. TICKET-101 — Product/category repository layer
11. TICKET-102 — Public product listing page
12. TICKET-103 — Product detail page
13. TICKET-104 — Admin product CRUD (remember: MIME allowlist, 5MB/8-image limits, required alt text at form layer)
14. TICKET-105 — Basic search

### Phase 3 — Cart, Address, Checkout (money-handling — highest scrutiny)
15. TICKET-201 — Cart service (note the ownership/IDOR requirements added in Phase 4 review)
16. TICKET-202 — Cart page UI
17. TICKET-203 — Address management (pincode validation via `RiskFlag`, `onDelete: Restrict` graceful handling, address ownership checks)
18. TICKET-204 — Checkout orchestration (atomic transaction, idempotency, COD/pincode/risk validation — see `docs/05-Database-Design.md` §4 for the exact transaction pattern)
19. TICKET-205 — Checkout page UI

### Phase 4 — Orders
20. TICKET-301 — Order state machine (including the auto-cancel-on-out-of-stock rule)
21. TICKET-302 — Customer order history/detail/tracking pages
22. TICKET-303 — Customer cancellation flow
23. TICKET-304 — Customer return request flow
24. TICKET-305 — Admin order management (including manual `trackingReference` entry)

### Phase 5 — Support
25. TICKET-401 — Support ticket service + customer UI (plain-text rendering only — no HTML/markdown)
26. TICKET-402 — Admin complaint management

### Phase 6 — Notifications & Legal
27. TICKET-701 — NotificationService + Resend implementation
28. TICKET-801 — Static legal pages
29. TICKET-802 — Cookie consent banner

### Phase 7 — Platform hardening (do this before considering MVP "done," not as an afterthought)
30. TICKET-901 — Rate limiting middleware (Upstash)
31. TICKET-902 — Security headers
32. TICKET-903 — Sentry integration + alert rules
33. TICKET-904 — Audit logging utility
34. TICKET-905 — SEO basics

---

## After every phase: run the relevant section of the Testing Strategy

Don't wait until the end to write tests. After each phase above, have the agent write and run the unit/integration tests specified in `docs/09-Testing-Strategy.md` for the tickets just completed — especially the security-sensitive coverage in §5 for Phases 1, 3, and 4.

## Before calling MVP done

Walk through `docs/10-Production-Readiness-Checklist.md` literally, line by line, in Antigravity or manually. Don't skip the ⚠️ legal/CA items — they're not blocking the *build*, but they block *real customers*.

---

## A note on what this package cannot do for you

This package gives Antigravity precise specs to build against. It cannot:
- Verify Antigravity actually follows them — review its output against the relevant ticket's acceptance criteria yourself, especially for Phase 3/4 (money/data integrity).
- Replace the CA/lawyer review flagged throughout the docs — those are real legal exposure items for a real COD business, not implementation details.
- Guarantee the `FINAL-SCHEMA.prisma` file is byte-perfect — it was structurally validated (brace balance, model count) but not run through the real Prisma CLI due to a sandbox network restriction when this package was generated. Run `npx prisma validate` yourself as the very first step.
