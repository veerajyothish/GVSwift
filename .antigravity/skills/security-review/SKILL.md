# Skill: Security Review

**When to use this skill:** after completing any ticket touching authentication, authorization, checkout, payments, admin routes, or risk flags (TICKET-003, 201-205, 301-305, 501-503, 601-602, 901-904). Also invoke any time a new API route or server action is created, regardless of ticket number.

**How to use it:** before considering the ticket done, walk through every check below against the code just written. Don't skip checks because the ticket "seems simple" — that's exactly when checks get skipped and IDOR/auth bugs slip through.

---

## Checklist

1. **Authentication check present?** Does this route/action call `requireUser()` or `requireAdmin()` before doing anything else? Is there any code path that runs business logic before the auth check?

2. **Authorization check present?** For admin-only actions, is `role === 'ADMIN'` checked server-side (not just hidden in the UI)? For user-owned resources, is the query scoped by `WHERE userId = session.user.id`?

3. **404 vs 403 correct?** Resource ownership mismatch → 404 (don't confirm the resource exists). Role mismatch on an admin route → 403 (admin existence isn't sensitive). Did you use the wrong one anywhere?

4. **Input validated server-side?** Is there a Zod schema (or equivalent) validating every field of the request body/params, independent of any frontend validation? Does it reject with a 400 and field-level errors, not a 500?

5. **Money in paise?** If this touches any price/total/fee, is it an integer in paise throughout — no floating point arithmetic on currency anywhere in this code path?

6. **Error messages safe?** Does any error response leak a stack trace, raw database error, or internal detail to the client? Should route through the centralized error handler instead.

7. **Rate limited if it should be?** Login, signup, checkout, ticket creation — does this route have an Upstash rate limit check? (Most other routes don't need one — don't over-apply this.)

8. **Audit logged if it's an admin mutation?** Does this write to `AuditLog` if it changes an order, product, risk flag, or setting?

9. **XSS-safe rendering?** If this stores or displays user-generated free text (support tickets, complaint descriptions), is it rendered as plain text only — no `dangerouslySetInnerHTML`, no markdown parsing?

10. **Secrets check?** Did this code introduce any new environment variable? If so, is it added to `docs/ENV-VARS.md` and `.env.example` with a placeholder? Is `SUPABASE_SERVICE_ROLE_KEY` (or any other server-only secret) referenced anywhere that could end up in client-side bundle code (e.g., outside a `'use client'` boundary check, or accidentally in a Client Component)?

---

If any check fails, fix it before marking the ticket complete — don't note it as a "TODO" and move on. These are the same categories that were caught during the project's Phase 4 architecture review when they were initially missed; the patterns repeat, so check deliberately rather than assuming "this one's simple."
