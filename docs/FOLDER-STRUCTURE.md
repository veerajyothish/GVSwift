# GVSwift — Final Folder Structure

```
gvswift/
├── .env                          # local only, NEVER committed (gitignored)
├── .env.example                  # committed — see docs/ENV-VARS.md for exact content
├── .gitignore
├── .antigravity/
│   ├── CONTEXT.md                # persistent context — load this before any task
│   └── skills/
│       └── security-review/
│           └── SKILL.md          # invoke after completing any auth/checkout/admin ticket
├── package.json
├── tsconfig.json
├── next.config.ts                # security headers configured here — see docs/03-Security-Access.md §7
├── prisma/
│   ├── schema.prisma              # copy verbatim from docs/FINAL-SCHEMA.prisma
│   ├── migrations/
│   └── seed.ts                    # seeds Setting defaults + initial RiskFlag pincode rows
├── sentry.client.config.ts
├── sentry.server.config.ts
├── public/
│   └── robots.txt
└── src/
    ├── app/
    │   ├── (public)/
    │   │   ├── page.tsx
    │   │   ├── products/
    │   │   │   ├── page.tsx
    │   │   │   └── [slug]/page.tsx
    │   │   ├── cart/page.tsx
    │   │   ├── checkout/page.tsx
    │   │   ├── orders/
    │   │   │   ├── page.tsx
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
    │   │   ├── layout.tsx          # requireAdmin() server-side guard lives here
    │   │   ├── page.tsx
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
    │   └── globals.css             # Stitch CSS custom properties defined here
    ├── components/
    │   ├── ui/                     # Button, Input, Card, Modal, Toast
    │   ├── layout/                 # Navbar, Footer
    │   └── product/                # ProductCard, etc.
    ├── features/                   # business logic lives HERE, not in app/
    │   ├── catalog/
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── search.ts           # abstracted search (TICKET-105)
    │   │   ├── validation.ts
    │   │   └── types.ts
    │   ├── cart/
    │   │   └── service.ts          # ownership-scoped per CONTEXT.md §3
    │   ├── checkout/
    │   │   └── service.ts          # atomic transaction per docs/05-Database-Design.md §4
    │   ├── orders/
    │   │   └── state-machine.ts    # exact transition table, no exceptions
    │   ├── users/
    │   │   └── addresses.ts
    │   ├── support/
    │   │   └── service.ts          # plain-text rendering only, no HTML
    │   ├── risk/
    │   │   └── service.ts          # RiskFlag CRUD + pincode lookup (no separate PincodeRules table)
    │   ├── notifications/
    │   │   ├── service.ts          # NotificationService interface + Resend impl
    │   │   └── templates/
    │   ├── settings/
    │   │   └── service.ts
    │   └── admin/
    │       └── audit-log.ts
    ├── lib/
    │   ├── prisma.ts
    │   ├── supabase/
    │   │   ├── server.ts
    │   │   └── client.ts
    │   ├── auth/
    │   │   ├── session.ts
    │   │   └── guards.ts           # requireUser(), requireAdmin() — see CONTEXT.md §3
    │   ├── rate-limit.ts           # Upstash-backed
    │   ├── validation/
    │   │   └── common.ts           # shared Zod primitives (pincode, phone, money)
    │   ├── errors.ts                # AppError classes, safe error formatting
    │   ├── logger.ts
    │   └── analytics.ts             # GA4 helper, consent-aware
    └── middleware.ts                 # HTTPS redirect, security headers, rate-limit hook
```

**Key rule, repeated from CONTEXT.md because it matters:** business logic lives in `src/features/<domain>/`, never directly in `src/app/` route files. Route files compose UI and call into feature services — they don't contain validation logic, Prisma queries, or business rules themselves. This keeps logic testable without spinning up Next.js routing and reusable between customer-facing and admin routes.
