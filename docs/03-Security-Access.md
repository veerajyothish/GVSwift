# GVSwift — Security & Access Document

**Document 3 of 10 | Version 1.0 | Status: Draft for Approval**

---

## 1. Authentication

**Provider:** Supabase Auth, email + password at launch.

**Flows:**
- **Signup:** email + password → Supabase sends verification email → **confirmed: verification required before checkout, not before browsing.** A user can browse, add to cart, and reach the checkout page unverified, but submitting an order (TICKET-204) requires `email_confirmed_at` to be set on the Supabase auth user — checked server-side at the checkout API, not just hidden in the UI. Browsing/cart access remains open to unverified accounts to reduce signup friction, consistent with your "registered accounts required, but don't lose easy browsers" balance.
- **Login:** **email + password only.** Phone number is collected as a profile/shipping field (used for delivery contact and risk flagging), not as a login credential — confirmed explicitly to avoid ambiguity, since phone-or-email login was considered and intentionally not adopted for MVP. Supabase issues a JWT session, stored in HttpOnly cookies via `@supabase/ssr`.
- **Password reset:** Supabase's built-in token-based reset flow (time-limited token emailed to user)
- **Logout:** clears session cookie server-side
- **Future:** Google OAuth — Supabase supports this natively; adding it later is a config change, not an architecture change

**Session security:**
- Cookies: `HttpOnly`, `Secure` (production), `SameSite=Lax`
- Session refresh handled by Supabase SSR helpers
- No custom session/token logic is implemented — Supabase Auth is the single source of truth for "who is logged in"

---

## 2. Authorization

### Roles

| Role | Description |
|---|---|
| `USER` | Default role for any registered customer |
| `ADMIN` | Founder + up to 1–2 trusted staff; full backoffice access |

> No `GUEST` role exists as a data concept — guest checkout is disabled, so every order is tied to a `USER`. Unauthenticated visitors can browse but cannot reach any data-mutating endpoint.

### Permission matrix

| Action | USER | ADMIN |
|---|---|---|
| Browse products | ✅ | ✅ |
| Add to cart, checkout | ✅ (own cart only) | ✅ |
| View own orders | ✅ | ✅ (all orders) |
| Cancel own order (pre-SHIPPED) | ✅ | ✅ (any order, any stage, with override reason logged) |
| Request return on own order | ✅ | n/a |
| Create support ticket | ✅ | ✅ |
| View own support tickets | ✅ | ✅ (all tickets) |
| Update order status | ❌ | ✅ |
| Create/edit/deactivate products | ❌ | ✅ |
| View/edit risk flags | ❌ | ✅ |
| Edit settings/config | ❌ | ✅ |
| View audit logs | ❌ | ✅ |

### Enforcement pattern

Every protected server action / API route follows this sequence, in order, and **fails closed** (deny by default) at each step:

1. **Authenticate** — verify a valid Supabase session exists. No session → 401.
2. **Authorize (role)** — for admin routes, verify `user.role === 'ADMIN'`. Wrong role → 403.
3. **Authorize (ownership)** — for resource-specific actions (e.g., "cancel my order"), verify the resource's `userId` matches the session's user ID, **unless** the actor is ADMIN. Mismatch → 403 (not 404 — but see note below on information leakage).
4. **Validate input** — Zod schema validation on every request body/params. Invalid → 400 with field-level errors, no stack traces.
5. **Execute** — business logic runs only after all above pass.

> Note on 403 vs 404: returning 403 confirms a resource exists but isn't yours; 404 hides existence entirely. For order/ticket lookups by ID, GVSwift returns **404** (not 403) when a USER requests a resource they don't own, to avoid leaking which order IDs are valid. ADMIN routes use 403 for role failures since admin existence isn't sensitive.

This logic lives in `lib/auth/guards.ts` as reusable `requireUser()` and `requireAdmin()` helpers, called at the top of every route handler and server action — never assumed from UI state alone. **The admin UI being hidden from non-admins is a UX nicety, not a security control.** All admin routes independently re-check role server-side.

---

## 3. Threat Model & Mitigations

| Threat | Mitigation |
|---|---|
| Auth bypass | Supabase Auth (battle-tested) + server-side guard on every route; never trust client-reported role |
| SQL injection | Prisma parameterized queries exclusively; no raw SQL string concatenation |
| XSS | React's default escaping; no `dangerouslySetInnerHTML` for user-generated content; sanitize any rich text inputs (e.g., complaint descriptions) before storage and rendering |
| CSRF | SameSite cookies + Next.js Server Actions' built-in origin checks; state-changing API routes additionally verify `Origin`/`Referer` headers |
| Rate abuse / brute force | Rate limiting (see §5) on login, signup, checkout, ticket creation |
| Data exposure via verbose errors | Centralized error handler (`lib/errors.ts`) returns generic messages to clients; full details only to Sentry/server logs |
| Privilege escalation via client tampering | Role checks always server-side; client never sends its own role, server reads it from the DB on each request |
| IDOR (Insecure Direct Object Reference) | Every resource fetch scoped by `WHERE userId = session.user.id` (or admin bypass), never by ID alone |
| File upload abuse | Server-side MIME + size validation on product image uploads; stored in Supabase Storage (non-executable), filenames sanitized/randomized |
| Session hijacking | HttpOnly + Secure cookies; HTTPS enforced; short session lifetimes with refresh |

> **Phase 4 review note:** `RiskFlag.entityValue`/`Setting.value` (admin-entered free text) and the product search query string were specifically reviewed for injection risk during the architecture review. Both are protected by Prisma's parameterized queries regardless of input content, so classic SQL injection isn't possible even without extra validation layered on top. They're lower severity than the image-upload and support-ticket-message gaps closed in Document 8 (TICKET-104, TICKET-401) — admin-only input in one case, read-only search with no stored/re-rendered output in the other — so no new ticket was created for them. Noted here as a conscious "reviewed, accepted" decision, not an oversight.

---

## 4. Error Handling Policy

| Information | Shown to user | Logged server-side / Sentry |
|---|---|---|
| Validation errors (e.g., "phone number invalid") | ✅ Specific, field-level | ✅ |
| "Resource not found" / "Not authorized" | ✅ Generic message | ✅ with full context |
| Database errors, stack traces | ❌ Never | ✅ Full detail |
| Third-party API failures (Resend, Supabase) | ❌ Generic "something went wrong" | ✅ Full detail incl. provider response |
| Rate limit exceeded | ✅ "Too many attempts, try again in X" | ✅ |

All API routes wrap logic in a try/catch that routes unexpected errors through a single `handleApiError()` utility, ensuring no accidental leakage of internals.

---

## 5. Rate Limiting

| Endpoint | Limit (suggested default, configurable) |
|---|---|
| `POST /api/v1/auth/login` | 5 attempts / 15 min / IP |
| `POST /api/v1/auth/signup` | 5 attempts / hour / IP |
| `POST /api/v1/checkout` | 10 attempts / hour / user |
| `POST /api/v1/support` (ticket creation) | 10 / hour / user |
| Admin routes | Not rate-limited by default (trusted, low-volume users), but failed-login tracking still applies |

**Confirmed implementation:** Upstash Redis (free tier), accessed via `@upstash/ratelimit` + `@upstash/redis`. Chosen over a DB-backed counter because it's purpose-built for this (atomic increment/expiry primitives, no risk of adding load or lock contention to the primary Postgres database under brute-force conditions), and Upstash's free tier is generous enough for GVSwift's expected volume. Requires two new environment variables: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (added to Document 2 §5 and `.env.example`).

### 5.1 Bot & Abuse Review (Phase 4)

| Concern | Outcome |
|---|---|
| Login/signup/checkout/ticket rate limiting | Covered above via Upstash |
| Admin login brute-force | Already covered — `/admin` login uses the same rate-limited Supabase login endpoint as customer login. Only post-login admin *dashboard* routes are unthrottled, which is correct (normal authenticated usage, not a guessable attack surface). |
| **CAPTCHA on signup** | **Confirmed: not added at MVP.** Signup is already rate-limited (5/hour/IP) and real account activity (checkout) is gated behind email verification — sufficient friction at launch scale. Revisit only if real bot signups are actually observed post-launch; not added preemptively. |
| **Product listing/search scraping** | **Confirmed: accepted, no mitigation.** At 10–20 products with no proprietary pricing logic, a bot copying the catalog causes no meaningful harm. Reviewed and consciously accepted, consistent with the lower-severity input-validation items in §3. |

---

## 6. Data Privacy & PII Handling

- **Minimization:** only data needed for order fulfillment and support is collected (name, phone, address, email).
- **No PII in logs:** application logs reference user IDs, not names/emails/phones, except where strictly necessary for a support investigation (and even then, redacted where possible).
- **No PII in Sentry breadcrumbs** beyond user ID — Sentry's `beforeSend` hook strips email/phone if accidentally included.
- **At-rest protection:** Supabase Postgres provides encryption at rest by default (managed by Supabase infrastructure).
- **Data retention:** see Document 6 (Operations & Support) and Document 7 for full retention policy.

---

## 7. Security Headers (Production)

Configured via `next.config.ts` headers and/or `middleware.ts`:

| Header | Value (suggested) |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | Restrictive default-src 'self', explicit allowlist for Sentry/GA4/Supabase/Resend script/connect sources |

> ⚠️ CSP needs careful testing against GA4 and Supabase's script requirements before production deploy — an overly strict CSP will silently break analytics or auth redirects. This is called out as a pre-launch checklist item.

---

## 7.1 Secret Rotation Procedure

Not previously documented — added during Phase 4 review. If any secret is suspected leaked (accidentally committed, exposed in a screenshot, a contributor's machine compromised, etc.):

1. **Rotate immediately in the provider dashboard** — Supabase service role key, Resend API key, Sentry DSN (DSNs are semi-public by design but can be regenerated), Upstash token — each provider's dashboard has a "regenerate key" action.
2. **Update Vercel environment variables** for the affected scope (Production/Preview/Development) with the new value.
3. **Redeploy** — Vercel env var changes require a redeploy to take effect for already-running serverless functions.
4. **If the leak was via git history** (not just a runtime exposure), the old commit(s) must be scrubbed from history (e.g., `git filter-repo`) in addition to rotation — rotation alone doesn't remove the leaked value from a public repo's history, it just makes the leaked value useless going forward.
5. **Check provider logs** (Supabase, Resend) for any usage during the suspected exposure window before rotation, to assess whether the leak was actually exploited.

**Resend API key scope:** confirm in the Resend dashboard that the key is scoped to "Sending access" only (not full account/domain management access) — Resend supports restricted API key permissions, and a sending-only key limits blast radius if leaked. This is a one-time dashboard setting, not a code change — added to Document 10's checklist.

---

## 8. Known Gaps / Items Requiring Your Confirmation

~~1. Rate limiting backing store~~ — **Resolved:** Upstash Redis. See §5.
~~2. Email verification enforcement point~~ — **Resolved:** before checkout, not before browsing. See §1.
3. CSP header will need iterative tuning once third-party script domains (Supabase, GA4, Sentry) are finalized — this can only be fully nailed down once those integrations exist to test against, so it remains open by nature, not by oversight. Tracked in Document 10's checklist.

---

*End of Security & Access Document. Proceed to Document 4 — Frontend Specification.*
