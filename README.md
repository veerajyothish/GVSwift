# GVSwift — Final Implementation Package

**Start here.** This package is the output of a 5-phase requirements/architecture process (Requirements → Brief → 10 Docs → Architecture Review → this package). It's structured to be dropped directly into an Antigravity project folder.

## What's in this package

```
gvswift-final/
├── README.md                              ← you are here
├── .antigravity/
│   ├── CONTEXT.md                         ← persistent rules, load this first in Antigravity
│   └── skills/security-review/SKILL.md    ← auto-invoke after auth/checkout/admin tickets
└── docs/
    ├── 01-PRD.md                          ← what & why
    ├── 02-Technical-Architecture.md       ← stack, domains, folder structure rationale
    ├── 03-Security-Access.md              ← auth, authorization, threat model (Phase 4-reviewed)
    ├── 04-Frontend-Specification.md       ← Black & Gold "Stitch" design system
    ├── 05-Database-Design.md              ← schema rationale, concurrency, the RiskFlag/pincode design
    ├── 06-Operations-Support.md           ← order state machine, fraud rules, legal page outlines
    ├── 07-Deployment-Infrastructure.md    ← Vercel/Supabase setup, CI/CD, monitoring
    ├── 08-Feature-Tickets.md              ← every build task, in dependency order
    ├── 09-Testing-Strategy.md             ← what to test and how
    ├── 10-Production-Readiness-Checklist.md ← gate before accepting real customers
    ├── 11-Implementation-Roadmap.md       ← milestones, checkpoints, post-MVP priorities
    ├── FINAL-SCHEMA.prisma                ← the actual schema to use — supersedes Doc 5 if they conflict
    ├── ENV-VARS.md                        ← every environment variable + .env.example content
    ├── FOLDER-STRUCTURE.md                ← exact project layout
    ├── CODING-STANDARDS.md                ← conventions the agent should follow
    └── AI-IMPLEMENTATION-INSTRUCTIONS.md  ← the actual build order, sequenced from ticket dependencies
```

## How to use this (for you, the human)

1. **Read `AI-IMPLEMENTATION-INSTRUCTIONS.md` first** — it has the exact build order and how to phase your Antigravity sessions. **Read `11-Implementation-Roadmap.md` alongside it** — it groups those build phases into 5 milestones with manual checkpoints (concurrency tests, IDOR tests, boundary tests) you should run yourself before continuing past each one, especially Milestone 3 (checkout/orders).
2. Copy this whole `gvswift-final/` folder into your actual project root (or use it as the root itself).
3. Before anything else: run `npx prisma validate` on `FINAL-SCHEMA.prisma` yourself. It was structurally checked (brace balance, model count) during generation but **not run through the real Prisma CLI** due to a sandbox restriction — this is a known gap, not an oversight, and it's a 10-second check.
4. Work through the build order phase by phase, in separate Antigravity conversations, with review gates on for anything touching money or auth.
5. Before declaring MVP done, walk `docs/10-Production-Readiness-Checklist.md` line by line — including the ⚠️ items that need a lawyer/CA, which the build itself can't resolve for you.

## What's already locked in (don't relitigate these with the agent)

All of the following were explicitly decided across the requirements and review phases — they're not open questions:

- COD only, ₹10,000 limit, Andhra Pradesh shipping only
- No guest checkout, email-only login (no phone login, no OAuth at MVP)
- Email verification required before checkout, not before browsing
- Wishlist, prepaid payments, Shiprocket, multi-warehouse, multi-seller, background job workers, CAPTCHA — all explicitly post-MVP
- Pincode rules live in `RiskFlag` (`entityType=PINCODE`), no separate table
- `Order.addressId` uses `onDelete: Restrict`
- Out-of-stock between order placement and confirmation → auto-cancel, not manual review
- Manual `trackingReference` text field on orders (no live courier API at MVP)
- Rate limiting via Upstash Redis
- Sentry error-rate alert rules included at MVP

If the agent proposes something that contradicts one of these, that's a flag to stop and check — not a sign the agent found a better idea.

## What this package cannot do

It cannot verify Antigravity actually builds correctly — you still need to review output against each ticket's acceptance criteria, especially anything in Build Order Phase 3-4 (checkout, orders). It cannot replace a lawyer or CA for the legal/tax items flagged throughout. And the schema, while carefully checked, deserves your own `prisma validate` pass before you trust it completely.
