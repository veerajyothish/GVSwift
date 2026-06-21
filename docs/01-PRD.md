# GVSwift — Product Requirements Document (PRD)

**Document 1 of 10 | Version 1.0 | Status: Draft for Approval**

---

## 1. Problem Statement

GVSwift is a B2C e-commerce store launching in Visakhapatnam, Andhra Pradesh, India. It exists to:

- Give the founder a real, low-risk way to sell general merchandise online, starting Cash-on-Delivery (COD) only, with no payment gateway integration risk at launch.
- Serve as a credible, production-grade portfolio project demonstrating real-world e-commerce architecture (auth, inventory, order lifecycle, fraud controls, legal compliance).
- Be built in a way that survives contact with real customers and real orders — not a demo or prototype.

The store is **not** a marketplace at launch. The founder is the sole merchant. The architecture must not block adding multi-seller support later.

---

## 2. Target Users

| User type | Description | Needs |
|---|---|---|
| **Customer** | Individual shopper in Andhra Pradesh, mobile-first, may be a first-time online shopper | Trust signals, clear COD process, simple checkout, order tracking, easy returns |
| **Admin (Founder)** | Store owner, technical comfort varies | Full visibility into orders, inventory, complaints, and risk; ability to act without needing a developer |
| **Future: Delivery partner / 3PL** | Not in MVP | Order handoff, status sync (Shiprocket — future phase) |

---

## 3. Product Vision & Goals

> Make it easy and trustworthy for a customer in Andhra Pradesh to order anything from GVSwift and pay on delivery, while giving the founder full operational control and protection against COD fraud, built on infrastructure that costs near-zero at low volume and can scale 100x without a rewrite.

**Goals for V1 (MVP):**
1. A customer can browse, register, check out with COD, and track an order end-to-end.
2. The founder can manage products, orders, and complaints from an admin panel — no direct DB access needed.
3. The system actively reduces COD fraud risk via configurable rules (limits, pincode flags, risk flags).
4. The site meets baseline Indian e-commerce legal/UX expectations (privacy policy, terms, grievance officer, transparent pricing).
5. The codebase is structured so that prepaid payments, multi-state shipping, and multi-warehouse support can be added later without major rework.

---

## 4. Feature List

### 4.1 Must-Have (MVP — Required for Launch)

**Customer-facing:**
- Product browsing: home page, category listing, product detail page
- Search (basic, Postgres-based)
- Cart: add/update/remove, persists per logged-in user
- Checkout: address entry, order summary, COD-only payment, explicit T&C consent checkbox (unticked by default)
- Account: signup/login (email+password via Supabase Auth), password reset
- Address book: add/edit/delete, mark default
- Order history and order detail/tracking view
- Order cancellation (until SHIPPED)
- Return request (within 7 days of delivery)
- Support ticket creation and tracking (general + order-linked)
- All legal pages: Privacy Policy, Terms, Returns/Refunds, Shipping Policy, Cookie Policy, Disclaimer, FAQ, Grievance Officer page
- Cookie consent banner

**Admin-facing:**
- Admin authentication (role-gated, server-enforced)
- Product CRUD (with variants, images, stock, category)
- Order management: list/filter/view, status updates, internal notes, delivery attempt tracking
- Complaint/ticket management: list/filter, status updates, internal notes
- Risk flag management: phone/address/pincode flags (NORMAL / HIGH_RISK / BLACKLISTED)
- Settings/config panel: COD limit, return window, cancellation cutoff, shipping charge, risk thresholds (no-redeploy config changes)

**Platform / non-functional:**
- HTTPS enforced everywhere
- Server-side validation on all inputs
- Role-based authorization on every protected route
- Rate limiting on login, signup, checkout, complaint creation
- Sentry error monitoring
- GA4 event tracking (page view, add-to-cart, checkout start, order placed) — gated behind cookie consent
- Audit log for all admin actions on orders/risk flags
- Database migrations (Prisma) — no manual schema edits
- `.env.example` fully documented

### 4.2 Should-Have (Fast Follow, Not Blocking Launch)

- Google OAuth login (in addition to email+password)
- Email notifications for order status changes (Resend) — *abstracted as a service now, wired up early but can ship slightly after core commerce flow*
- Product image optimization/thumbnails
- Sitemap.xml, robots.txt, structured data (Schema.org Product)
- Admin dashboard with basic metrics (orders today, pending complaints, etc.)

### 4.3 Nice-to-Have (Post-MVP Roadmap)

- Shiprocket integration for automated logistics (**explicitly future — not MVP**)
- Prepaid payments (UPI/cards via Razorpay or similar)
- Multi-state shipping zones
- Multi-warehouse inventory
- Multi-seller marketplace support
- Multi-language support
- Background job/worker infrastructure (queue-based email sending, scheduled risk scoring, cleanup jobs)
- Wishlist, product reviews/ratings
- Discount codes / coupons

---

## 5. High-Level User Journeys

### Journey A — First-time purchase
1. Customer lands on home page → browses category → opens product detail
2. Adds to cart → prompted to sign up/log in (no guest checkout)
3. Verifies email (Supabase Auth flow)
4. Returns to cart → proceeds to checkout
5. Enters/selects shipping address (pincode validated against COD-serviceable list)
6. Reviews order summary (items, subtotal, shipping, COD fee [₹0 at launch], total)
7. Accepts T&C checkbox (unticked by default) → places order
8. Receives order confirmation (in-app; email if Resend wired up)
9. Tracks order status from "My Orders"

### Journey B — Cancellation
1. Customer opens an order in PLACED or CONFIRMED state
2. Clicks "Cancel order" → confirms reason
3. System validates order is still cancellable (not yet SHIPPED)
4. Order moves to CANCELLED; audit record created; stock released

### Journey C — Return request
1. Customer opens a DELIVERED order within 7 days
2. Clicks "Request return" → selects reason → submits
3. Order moves to RETURN_REQUESTED
4. Admin reviews, arranges self-pickup, updates status to RETURNED/REFUNDED

### Journey D — Complaint/grievance
1. Customer opens Support page or order detail → "Report an issue"
2. Submits subject + description (optionally linked to an order)
3. Ticket created with status OPEN
4. Admin reviews in backoffice, updates status, may respond
5. Customer sees status updates in "My Tickets"

### Journey E — Admin order fulfillment (manual, MVP)
1. Admin sees new PLACED order in admin panel
2. Reviews risk flags on phone/address/pincode (if any)
3. Marks CONFIRMED → packs order → marks SHIPPED (manually enters any tracking info as free text, since Shiprocket isn't integrated yet)
4. Updates to OUT_FOR_DELIVERY → DELIVERED, or FAILED_DELIVERY → RTO if delivery fails

---

## 6. MVP Definition (Exact Scope for V1 Launch)

**In scope:**
- Single state (Andhra Pradesh) shipping only, pincode-gated
- COD only, configurable limit ₹10,000
- Registered users only (no guest checkout)
- Manual order fulfillment (no Shiprocket)
- Email notifications: architecture in place (NotificationService), Resend wired for at least password reset and order confirmation
- All legal pages live, with placeholder business address/grievance officer name clearly marked `[TO BE FILLED]`
- Admin panel for products, orders, complaints, risk flags, and settings

**Explicitly out of scope for V1:**
- Online/prepaid payments
- Shiprocket or any courier API integration
- Multi-state/multi-warehouse
- Multi-seller
- Background job workers (designed for, not built)
- Product reviews, wishlists, coupons

---

## 7. Success Metrics

> ⚠️ These are illustrative MVP targets, not validated business projections. Treat as configurable goals to revisit after real usage data.

- Checkout completion rate (cart → placed order) — track via GA4 funnel
- COD order failure rate (FAILED_DELIVERY / RTO ÷ total orders) — target to monitor and reduce over time via risk flags
- Average time to resolve a support ticket (target: acknowledge within 48 hours per Grievance Officer commitment)
- Zero critical security incidents (auth bypass, data leak) — non-negotiable
- Page load performance: Core Web Vitals in "Good" range on product/category pages

---

## 8. Out-of-Scope Disclaimers

- **Legal/tax content** in this project is generic and conservative. It is **not legal advice**. GST, business registration, and consumer law specifics must be reviewed by a qualified CA/lawyer before real launch. ⚠️
- **Statistics and benchmarks** referenced in later documents (e.g., typical conversion rates) are general industry approximations, not guaranteed outcomes. Verify against your own data once live.

---

*End of PRD. Proceed to Document 2 — Technical Architecture.*
