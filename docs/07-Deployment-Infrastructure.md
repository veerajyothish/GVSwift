# GVSwift — Deployment & Infrastructure Document

**Document 7 of 10 | Version 1.0 | Status: Draft for Approval**

---

## 1. Hosting & Environments

| Environment | Purpose | URL pattern |
|---|---|---|
| **Local** | Development | `localhost:3000` |
| **Preview** | Automatic Vercel preview deploy per pull request | `gvswift-git-<branch>.vercel.app` |
| **Production** | Live site | `gvswift.vercel.app` (placeholder, until a custom domain is purchased per your confirmation) |

**Domain note:** You confirmed you'll deploy on Vercel's free subdomain first and purchase a custom domain later. All canonical URLs, sitemap entries, and email "From" addresses are driven by the `NEXT_PUBLIC_SITE_URL` environment variable, so switching to a custom domain later is a one-variable change, not a code change.

---

## 2. CI/CD Pipeline

GitHub repository, with the following automated checks **required to pass before merge to `main`**:

1. **Lint** — ESLint
2. **Type check** — `tsc --noEmit`
3. **Unit + integration tests** — Vitest or Jest (finalized in Testing Strategy doc)
4. **Build verification** — `next build` must succeed
5. **Secret scanning** — GitHub's built-in secret scanning (free for public repos; recommend enabling push protection)
6. **Dependency vulnerability scan** — `npm audit` or GitHub Dependabot alerts

Vercel automatically creates a **preview deployment** for every pull request, giving a live URL to test changes before merging — this is your primary QA step at this team size.

```
git push → GitHub Actions (lint, typecheck, test, build) → 
  if PR: Vercel preview deploy
  if merge to main: Vercel production deploy
```

> Recommended GitHub Actions workflow file and Vercel project settings will be included in the Final Implementation Package (Phase 5).

---

## 3. Supabase Setup (Free Tier)

| Component | Configuration |
|---|---|
| **Database** | Postgres, accessed via Prisma using the pooled connection string (`DATABASE_URL`, via Supabase's PgBouncer on port 6543) for the app, and the direct connection string (`DIRECT_URL`, port 5432) for Prisma migrations |
| **Auth** | Email/password provider enabled; email templates customized to match brand (Resend can take over transactional email later if you want full control, but Supabase's built-in auth emails are fine at MVP) |
| **Storage** | One bucket (e.g., `product-images`), public-read for product photos, with upload restricted to authenticated admin users via Storage policies |
| **Row Level Security (RLS)** | Enabled on any Supabase-queried tables. Since Prisma uses a direct/service connection for business data (bypassing RLS by design, with authorization enforced in the Next.js app layer instead — see Security doc §2), RLS is primarily relevant for **Storage** bucket policies and the `auth.users` table itself, which Supabase manages |

| **Network access** | By default, Supabase Postgres is reachable from the public internet by anyone with valid credentials (connection string). **Action for you:** in the Supabase project's Database settings, review the "Network Restrictions" option — Supabase's free tier supports restricting connections to specific IP ranges. Since Vercel serverless functions use dynamic/non-static outbound IPs by default, a strict IP allowlist isn't straightforward without Vercel's static IP add-on (paid). **Practical MVP posture:** rely on (a) the connection string itself being a strong, never-exposed secret (already covered in §7.1's rotation procedure), (b) Supabase's own connection-level auth, and (c) enabling Supabase's "SSL enforce" setting so connections must be encrypted in transit. True network-level IP restriction is a **post-MVP hardening step**, not a launch blocker, but is being explicitly named here rather than silently assumed — flagged as accepted MVP risk, not an oversight. |

⚠️ **Free tier limits to monitor:** Supabase free tier has a project pause policy after a period of inactivity, and limits on database size, storage, and monthly active users. Verify current limits directly on supabase.com/pricing before committing fully, as these terms can change and I don't want to quote a specific number I'm not certain is current.

---

## 4. Vercel Setup (Free Tier)

- Framework preset: Next.js (auto-detected)
- Environment variables configured in Vercel project settings (Production, Preview, Development scopes separately — never share production secrets into Preview)
- Vercel free tier ("Hobby") limits: bandwidth and serverless function execution caps apply — sufficient for MVP/student-level volume, but commercial use of the Hobby tier has licensing terms worth checking on vercel.com before treating this as a permanent production home for a real business. ⚠️ Recommend reviewing Vercel's current Hobby plan terms of use for commercial projects.

---

## 5. Background Jobs (Future — Not in MVP)

No worker infrastructure exists at MVP. All "async-shaped" work (sending emails, risk pattern scans) runs synchronously inside request handlers, structured as standalone functions in each domain's `service.ts`.

**When volume justifies it, the upgrade path is:**
- Vercel Cron Jobs (free tier includes limited cron triggers) for scheduled tasks (e.g., nightly risk re-scoring, ticket auto-close)
- A lightweight job queue (e.g., a `jobs` table polled by a cron-triggered route, or Supabase Edge Functions with `pg_cron`) for event-driven async work (e.g., retry failed emails)

This is documented as a deliberate MVP simplification, not an oversight — see Document 2, §6.

---

## 6. Monitoring & Observability

| Tool | What it covers |
|---|---|
| **Sentry** | Frontend + backend error tracking, with `beforeSend` PII scrubbing (see Security doc §6) |
| **Vercel Analytics** (optional, free tier available) | Core Web Vitals, page performance |
| **GA4** | Business funnel events: page_view, add_to_cart, begin_checkout, purchase — consent-gated |
| **Supabase Dashboard** | Database size, active connections, slow query log (built into Supabase's dashboard) |

### Logged event classes (security-relevant)

Per your 6th security prompt's requirement to log "authentication attempts, API errors, and unusual traffic patterns," these are the three explicit classes GVSwift produces, and where each lives:

| Event class | Where it's logged | Who sees it |
|---|---|---|
| Authentication attempts (success + failure) | Supabase Auth's own logs (built-in) + a corresponding `AuditLog` row for failed-login patterns that trip the Upstash rate limit | Supabase dashboard; admin can review `AuditLog` |
| API errors | Sentry (full stack trace, PII-scrubbed) | Sentry dashboard |
| Unusual traffic / abuse patterns | Upstash's own rate-limit hit logs (visible in the Upstash dashboard) + risk-flag triggers recorded in `RiskFlag`/`AuditLog` | Upstash dashboard; admin Risk panel |

**Confirmed: Sentry alert rules added at MVP.** Rather than deferring to post-MVP, GVSwift configures Sentry's free-tier alert rules to email the admin when the error rate spikes (e.g., a configurable threshold like ">10 errors in 5 minutes" or "new issue type seen for the first time") — no new vendor, just enabling a built-in Sentry feature already covered by TICKET-903. This closes the "dashboards you have to check" gap for at least the API-error class of monitoring; auth-attempt and traffic-pattern monitoring remain dashboard-only at MVP (Supabase and Upstash dashboards respectively), which is an accepted scope boundary, not an oversight — alerting on every event class would mean standing up real alerting infrastructure beyond what a single free-tier tool offers out of the box.

- Checkout success rate — derivable from GA4 funnel (dashboard, not alerted)
- High-risk order activity — visible in the admin Risk panel (dashboard, not alerted)

---

## 7. Security Headers Configuration Location

Implemented in `next.config.ts` via the `headers()` function, applied to all routes. See Document 3, §7 for the specific header values.

---

*End of Deployment & Infrastructure Document. Proceed to Document 8 — Feature Ticket Breakdown.*
