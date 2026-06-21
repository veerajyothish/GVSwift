# GVSwift — Coding Standards

These apply to every file the agent generates. They're deliberately narrow — only things that matter for this project's correctness and security, not generic style preferences.

---

## TypeScript

- `strict: true` in `tsconfig.json`, no exceptions.
- No `any` — if a type is genuinely unknown, use `unknown` and narrow it, or define the type properly.
- Prefer explicit return types on exported functions in `src/features/*/service.ts` and `repository.ts` files — these are the business logic boundary and benefit most from explicit contracts.

## File organization

- One Prisma model's queries live in one `repository.ts` per domain — don't scatter raw Prisma calls across route handlers.
- Validation schemas (Zod) live in `validation.ts` per domain, imported by both the service layer and any route handler that needs to validate the same shape — don't duplicate schemas.
- A route file (`app/**/page.tsx`, `app/api/**/route.ts`) should primarily call into a `features/<domain>/service.ts` function. If a route file is doing real business logic inline, that logic should be extracted.

## Naming

- Database fields: `camelCase` in Prisma (already established in `FINAL-SCHEMA.prisma`) — don't introduce `snake_case` anywhere.
- Money fields: always suffixed `Paise` (e.g., `totalPaise`), never ambiguous (`total`, `amount`).
- Boolean fields: prefixed `is`/`has` (`isActive`, `isDefault`, `isInternal`) — already the pattern in the schema, keep it consistent in any new fields.

## Error handling

- Every API route and server action wraps its logic in try/catch, routing unexpected errors through a single shared `handleApiError()` utility in `lib/errors.ts` (build this in TICKET-001/003 if it doesn't exist yet).
- Validation errors return 400 with field-level detail. Auth failures return 401. Authorization failures return 403 (role) or 404 (ownership, per CONTEXT.md §3). Everything else unexpected returns 500 with a generic message — never a raw stack trace or DB error string to the client.

## Comments

- Comment *why*, not *what*, and only where the reasoning isn't obvious from the code itself. Don't narrate every line.
- Any deliberate MVP simplification or known limitation (e.g., no stock reservation holds, no product-name snapshotting) gets a one-line comment pointing to the relevant doc section, so a future maintainer doesn't "fix" an intentional tradeoff without context.

## Testing

- Test file lives next to the code it tests (`service.ts` → `service.test.ts`), not in a separate parallel tree.
- Every `features/*/service.ts` function with business logic (not pure CRUD passthrough) gets at least one unit test per branch/condition, per `docs/09-Testing-Strategy.md`.

## Commits

- One ticket = one logical commit (or a small number of commits if the ticket is large) — not one commit per file, not the whole phase squashed into one commit.
- Commit message format: `[TICKET-XXX] short description` (e.g., `[TICKET-204] implement atomic checkout transaction`).

## What NOT to do

- Don't add a UI component library (shadcn, MUI, Chakra) — the Stitch CSS system is deliberate.
- Don't add Tailwind, even partially — same reason.
- Don't reach for a state management library (Redux, Zustand, etc.) unless a specific ticket calls for it — React state + server data fetching is sufficient at this scale.
- Don't "improve" the schema by adding fields/tables not in `FINAL-SCHEMA.prisma` without flagging it first — several fields were deliberately omitted (e.g., no full address/product snapshotting) as documented tradeoffs, not oversights.
