# GVSwift — Operations & Support Document

**Document 6 of 10 | Version 1.0 | Status: Draft for Approval**

---

## 1. Order State Machine

> See the rendered diagram above for the visual flow. Full transition table below is the authoritative spec for implementation.

### Valid transitions

| From | To | Trigger |
|---|---|---|
| `PLACED` | `CONFIRMED` | Admin action |
| `PLACED` | `CANCELLED` | Customer or admin action |
| `PLACED` | `CANCELLED` | **System (automatic)** — see "Out-of-stock after order" below |
| `CONFIRMED` | `CANCELLED` | Customer or admin action |
| `CONFIRMED` | `SHIPPED` | Admin action |
| `SHIPPED` | `OUT_FOR_DELIVERY` | Admin action |
| `OUT_FOR_DELIVERY` | `DELIVERED` | Admin action |
| `OUT_FOR_DELIVERY` | `FAILED_DELIVERY` | Admin action (delivery attempt failed) |
| `FAILED_DELIVERY` | `OUT_FOR_DELIVERY` | Admin action (retry attempt, if `deliveryAttempts < maxAttempts`) |
| `FAILED_DELIVERY` | `RTO` | System/admin, when `deliveryAttempts >= maxAttempts` (config: `settings.max_delivery_attempts`) |
| `DELIVERED` | `RETURN_REQUESTED` | Customer action, within `settings.return_window_days` of delivery |
| `RETURN_REQUESTED` | `RETURNED` | Admin action, after pickup confirmed |
| `RETURN_REQUESTED` | `DELIVERED` | Admin action (return request rejected, reverts) |

**All other transitions are invalid and must be rejected at the service layer** (`features/orders/service.ts`), regardless of what the client sends. Every transition writes a row to `order_status_history` recording `fromStatus`, `toStatus`, `changedByUserId` (null if system-triggered), and `reason`.

### Cancellation rule (per your confirmed answer)
Customers may cancel **until the order reaches `SHIPPED`**. Once `SHIPPED`, only admin can cancel (e.g., goodwill exception), and such admin overrides are logged with a mandatory reason field.

### Out-of-stock after order (confirmed: auto-cancel)

**Scope of this rule:** applies only to the `PLACED` → `CONFIRMED` transition — the gap between a customer placing a COD order and an admin reviewing/confirming it. It does **not** apply once `CONFIRMED`, since stock is already deducted atomically at order placement (Database Design Document §4) and confirmed orders are assumed to be physically set aside for fulfillment.

**Why this gap can exist at all:** stock is deducted at order *placement*, not earlier — so in the normal case this rule should rarely fire (the deduction already happened). It exists as a safety net for edge cases such as: an admin manually correcting/zeroing out stock for a damaged/lost item between order placement and confirmation, or a data correction that reduces recorded stock below what's already been committed to outstanding `PLACED` orders.

**Behavior:** when an admin attempts to move an order from `PLACED` → `CONFIRMED`, the system re-checks that all `OrderItem` rows on the order still have sufficient stock available for their `ProductVariant`. If any line item now has insufficient stock, the **entire order is automatically cancelled** (not partially fulfilled) — `status` moves to `CANCELLED`, `OrderStatusHistory` records `changedByUserId = null` (system-triggered) with `reason = "Auto-cancelled: insufficient stock at confirmation"`, and the customer should be notified via the Notifications domain (order-cancelled email).

**Why whole-order, not partial:** GVSwift doesn't support partial order fulfillment at MVP (no split shipments) — see Document 1, out-of-scope. Auto-cancelling the full order is consistent with that scope, simpler to reason about, and avoids inventing partial-refund logic for a COD order that hasn't been paid yet.

**Admin visibility:** auto-cancelled orders should appear distinctly in the admin order list (e.g., a visible "system cancelled — stock" indicator) so the founder can follow up with the customer if appropriate, even though no manual action is required to process the cancellation itself.

---

## 2. COD Fraud & Risk Controls (Balanced Profile)

Per your "balanced" strictness preference, suggested **default** thresholds (all stored in the `Setting` table, editable by admin without redeploy). Updated to reflect the finalized four-tier risk model: `User.riskStatus` is `NORMAL / WATCHLIST / HIGH_RISK / BLACKLISTED`; `RiskFlag.riskLevel` (per phone/address/pincode/user entity) is `LOW / MEDIUM / HIGH / BLOCKED`.

| Setting | Suggested default | Rationale |
|---|---|---|
| `cod_limit_paise` | ₹10,000 (1,000,000 paise) | Your confirmed limit |
| `return_window_days` | 7 | Your confirmed window |
| `cancellation_cutoff_status` | `SHIPPED` | Your confirmed rule |
| `max_delivery_attempts` | 2 | Balanced — not overly punitive on first failure, but caps repeated cost |
| `failed_delivery_watchlist_threshold` | 1 failed delivery in 90 days → auto-flag entity `MEDIUM` / user `WATCHLIST` | Balanced — first failure earns watching, not restriction |
| `failed_delivery_high_risk_threshold` | 2 failed deliveries in 90 days → escalate to `HIGH` / `HIGH_RISK` | Balanced — second failure is a stronger signal |
| `cancellation_risk_threshold` | 3 cancellations after `CONFIRMED` in 30 days → flag `MEDIUM`/`WATCHLIST` for manual review | Catches abuse without penalizing normal changed-minds |
| `low_medium_cod_behavior` | Allow COD normally, no friction | `LOW`/`NORMAL` and `MEDIUM`/`WATCHLIST` don't block checkout |
| `high_cod_behavior` | Require manual admin approval before `CONFIRMED`, not an automatic block | `HIGH`/`HIGH_RISK` — doesn't lose the sale outright |
| `blocked_cod_behavior` | Block COD entirely; customer sees "COD unavailable for this order" | `BLOCKED`/`BLACKLISTED` — reserved for repeat/confirmed abuse |

> ⚠️ These are starting defaults, not validated fraud-prevention benchmarks — I'm not aware of a verified industry-standard number for "average COD RTO rate in India" to calibrate against, so treat these as reasonable starting points to tune from real data once the store has order history.
>
> The `WATCHLIST`/`MEDIUM` tier (added when you provided the finalized schema) gives a middle ground the original three-tier design lacked: a customer with one isolated failed delivery gets noted, not restricted — closer to genuinely "balanced" than a binary normal/high-risk split.

### Pattern detection (MVP scope)
At MVP, risk flag creation is **manual** (admin reviews patterns in the order list and applies a flag) plus a few **simple automatic triggers** computed synchronously at order-relevant events (not a background job):
- On `FAILED_DELIVERY`: check phone's failure count in last 90 days → auto-flag if threshold met
- On order placement: check if phone/address/pincode already has a `risk_flags` row → apply configured behavior

**Explicitly deferred to post-MVP:** continuous/scheduled risk scoring across the whole order history (this needs a background job — see Document 7).

---

## 3. Support / Complaint Workflow

1. Customer submits ticket (general or order-linked) → `status = OPEN`
2. Admin reviews in backoffice → may set `IN_PROGRESS` and add internal notes (not visible to customer) or reply messages (visible to customer, via `ticket_messages.isInternalNote = false`)
3. Once resolved → `RESOLVED`
4. Customer can reopen within a grace period, or ticket auto-archives to `CLOSED` after a configurable period of inactivity (suggested: 14 days after `RESOLVED`, configurable)

**Grievance Officer commitment (stated on the Grievance page and Privacy Policy):**
> Acknowledge within 48 hours, resolve within 30 days — per Consumer Protection (E-Commerce) Rules 2020 conventions. ⚠️ Confirm this exact commitment language is appropriate with a lawyer; it is presented here as a common, conservative convention, not a verified legal requirement of a specific clause number.

**Grievance Officer contact (placeholder, update before real launch):**
- Name: `[Owner Name — TO BE FILLED]`
- Email: `gvswift.help@gmail.com`
- Address: `[Registered business address — TO BE FILLED]`

---

## 4. Legal Pages — Content Outline

> Full page copy will be drafted as actual page content during implementation (Phase 5/6), using the structure below. All legal content here is conservative and generic by design, and marked for your lawyer/CA review before go-live. ⚠️

| Page | Key sections |
|---|---|
| **Privacy Policy** | Data collected, purpose, sharing (logistics/analytics/future payment gateway), retention, user rights, security practices, Grievance Officer contact |
| **Terms & Conditions** | Account responsibilities, acceptable use, order contract formation, pricing error handling, shipping/delivery basics, returns reference, liability disclaimer, governing law (Andhra Pradesh / India), IP |
| **Returns/Refunds Policy** | Eligible/non-eligible items, valid reasons, 7-day window, merchant-paid self-arranged pickup, refund method/timeline |
| **Shipping Policy** | AP-only serviceability at launch, dispatch/delivery timelines, COD steps, force majeure note |
| **Cookie Policy** | What's tracked (GA4), consent banner behavior, browser-level opt-out guidance |
| **Disclaimer** | Product images illustrative, no liability for indirect damages beyond law, external links disclaimer |
| **FAQ** | Shipping timelines, COD basics + limit, returns summary, contact/grievance info |

All pages linked from footer; checkout references Returns + Shipping with "Learn more" links; signup references Privacy + Terms.

---

## 5. Notification Architecture

`NotificationService` interface (in `features/notifications/service.ts`) decouples "what triggers a notification" from "how it's sent":

```typescript
interface NotificationService {
  send(event: NotificationEvent): Promise<void>;
}
```

**Events supported at MVP** (sent via Resend):
- Account verification (handled by Supabase Auth's built-in email — not custom)
- Password reset (handled by Supabase Auth's built-in email — not custom)
- Welcome email (after verification) — custom, via Resend
- Order confirmation — custom, via Resend
- Order status update (SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RTO) — custom, via Resend
- Return/refund status update — custom, via Resend
- Complaint acknowledgement — custom, via Resend

At MVP, these are sent **synchronously** within the relevant request handler (e.g., right after an order status update commits). This is acceptable at low volume; if Resend is slow or briefly down, it should **not** roll back the underlying business transaction — email sending is wrapped in its own try/catch, logged on failure, and never blocks the order status change itself. This is the seam where a background queue would be introduced later (see Document 7, §Background Jobs).

---

## 6. Data Lifecycle & Retention

| Data type | Policy |
|---|---|
| User accounts | Soft-considered via Supabase Auth; deletion request handled per DPDPA — account marked inactive, PII scrubbed from `users` table, but **order records retained** for legal/accounting purposes (with user reference anonymized) |
| Orders | Retained indefinitely at MVP scale (low volume); revisit retention window once real accounting/tax record requirements are confirmed with a CA ⚠️ |
| Audit logs | Retained minimum 1 year (suggested), never auto-deleted at MVP scale |
| Application logs (Sentry, server logs) | Sentry free tier default retention (~30–90 days depending on current plan terms — verify in Sentry dashboard, I don't have a fully current figure I'm confident in) |
| Support tickets | Retained indefinitely at MVP scale; revisit if volume grows |

> **TODO (blocking real launch, not MVP build):** None of the retention periods above are confirmed legal minimums — they're conservative placeholder defaults chosen so nothing is deleted prematurely. Before accepting real customer orders, confirm with a CA: (1) the minimum period financial/order records must be retained for GST and income tax purposes under Indian law, and (2) whether any maximum retention limit applies to customer PII under the DPDPA once an account is closed. This same item is tracked in Document 10 (Production Readiness Checklist) under Legal/Compliance so it isn't missed before go-live.

---

*End of Operations & Support Document. Proceed to Document 7 — Deployment & Infrastructure.*
