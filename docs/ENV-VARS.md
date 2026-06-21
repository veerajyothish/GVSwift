# GVSwift — Environment Variables

Authoritative list. Every variable here must appear in `.env.example` with a placeholder value and a comment. Never commit real values.

| Variable | Scope | Purpose | Required at MVP? |
|---|---|---|---|
| `DATABASE_URL` | Server | Prisma pooled connection (Supabase PgBouncer, port 6543) | Yes |
| `DIRECT_URL` | Server | Prisma direct connection for migrations (port 5432) | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key (safe to expose — RLS-protected) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only — never client** | Privileged Supabase operations (e.g., admin Storage writes) | Yes |
| `RESEND_API_KEY` | Server | Transactional email sending | Yes |
| `UPSTASH_REDIS_REST_URL` | Server | Rate limiting backing store | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Server | Rate limiting backing store auth | Yes |
| `SENTRY_DSN` | Server | Error monitoring (server-side events) | Yes |
| `NEXT_PUBLIC_SENTRY_DSN` | Public | Error monitoring (client-side events) | Yes |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Public | GA4 property ID (consent-gated before firing) | Yes |
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical URL for SEO/emails/sitemap — placeholder `https://gvswift.vercel.app` until a custom domain is purchased | Yes |
| `GRIEVANCE_OFFICER_EMAIL` | Server or constant | `gvswift.help@gmail.com` — placeholder, used on legal pages | Yes |
| `COD_DEFAULT_LIMIT_PAISE` | Server | Fallback if `Setting` table is empty (seed default: `1000000` = ₹10,000) | Yes |

**Explicitly NOT included** (and why, so nobody re-adds them speculatively):
- `NEXTAUTH_SECRET` — not used; GVSwift uses Supabase Auth exclusively, not Auth.js. Only add this if/when migrating away from Supabase Auth.
- Any payment gateway key (Razorpay, etc.) — prepaid payments are post-MVP.
- Any Shiprocket/courier API key — logistics integration is post-MVP; MVP fulfillment is manual.

---

## `.env.example` (copy this exactly, fill in real values only in your local untracked `.env`)

```bash
# ── Database (Supabase Postgres via Prisma) ──────────────────────────
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres"

# ── Supabase Auth + Storage ───────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"  # SERVER ONLY. Never expose to client.

# ── Email (Resend) ─────────────────────────────────────────────────────
RESEND_API_KEY="re_xxxxxxxxxxxx"  # Scope this key to "Sending access" only in the Resend dashboard

# ── Rate limiting (Upstash Redis) ──────────────────────────────────────
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token-here"

# ── Monitoring (Sentry) ────────────────────────────────────────────────
SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"

# ── Analytics (GA4) ─────────────────────────────────────────────────────
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"

# ── Site config ──────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL="https://gvswift.vercel.app"  # update once a custom domain is purchased
GRIEVANCE_OFFICER_EMAIL="gvswift.help@gmail.com"
COD_DEFAULT_LIMIT_PAISE="1000000"  # = ₹10,000, fallback only if Setting table is empty
```
