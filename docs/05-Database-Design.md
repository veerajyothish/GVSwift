# GVSwift — Database Design Document

**Document 5 of 10 | Version 1.0 | Status: Draft for Approval**

---

## 1.1 Schema Source of Truth

The Prisma schema you provided is now the authoritative source — it supersedes the conceptual table list originally drafted here. Differences worth your explicit confirmation are called out in §2.1 below; everything else (naming, indexes, relations) reflects your file as-is.

> ⚠️ **Action needed on your actual `schema.prisma` file:** one field has been added to the `Order` model documentation below (`trackingReference`, per your confirmed "manual tracking reference" decision) that doesn't yet exist in the schema file you pasted. Add this line to your `Order` model before running the next migration:
> ```prisma
> trackingReference String?  // manually entered by admin after marking SHIPPED
> ```
> I'm flagging this explicitly rather than assuming it's been added, since I can only edit the documents in this conversation, not your actual project file.

**Enums (as finalized):**

```prisma
enum Role { USER  ADMIN }

enum RiskStatus { NORMAL  WATCHLIST  HIGH_RISK  BLACKLISTED }   // on User

enum RiskLevel { LOW  MEDIUM  HIGH  BLOCKED }                    // on RiskFlag

enum RiskEntityType { PHONE  ADDRESS  PINCODE  USER }

enum OrderStatus {
  PLACED  CONFIRMED  SHIPPED  OUT_FOR_DELIVERY  DELIVERED
  CANCELLED  FAILED_DELIVERY  RTO  RETURN_REQUESTED  RETURNED
}

enum TicketStatus { OPEN  IN_PROGRESS  RESOLVED  CLOSED }

enum PaymentMethod { COD  PREPAID }  // PREPAID reserved, not implemented at MVP
```

> Note the four-tier `RiskStatus`/`RiskLevel` (with a `WATCHLIST`/`MEDIUM` tier between normal and high-risk) replaces the three-tier version in the original draft of this document. The extra tier is a genuine improvement: it lets admins flag "keep an eye on this" without immediately restricting COD — closer to your "balanced" risk profile than a binary normal/restricted split. Document 6 (Operations & Support) §2 will be updated to reference these four levels explicitly rather than the original three.
>
> `RiskEntityType.USER` (flagging a user account directly, not just their phone/address/pincode) is also new versus the original draft and is adopted — it closes a real gap where a user could churn through multiple phone numbers/addresses but still be the same flagged account.

## 1.2 Design Principles

- PostgreSQL via Supabase; Prisma as the schema source of truth and migration tool.
- All primary keys: `uuid` (via `gen_random_uuid()`) — avoids sequential ID enumeration and eases future multi-tenant growth.
- All tables have `createdAt` / `updatedAt` timestamps.
- Money stored as **integer paise** (₹1 = 100 paise), never floating point — avoids rounding errors.
- Soft delete (`deletedAt` nullable timestamp) on: `products`, `categories`. Hard delete acceptable for: `cart_items` (ephemeral). `audit_logs` and `order_status_history` are never deleted (append-only).
- Every status/enum field uses a Postgres enum (via Prisma `enum`), not free-text — prevents invalid states at the DB level.

> The ERD rendered above shows core entities and relationships. Full column-level detail follows below.

---

## 2. Table Definitions (from finalized `schema.prisma`)

### `User`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `supabaseId` | text, unique | links to `auth.users.id` in Supabase |
| `email` | text, unique | |
| `phone` | text, unique, nullable | |
| `role` | `Role` enum | default `USER` |
| `riskStatus` | `RiskStatus` enum | default `NORMAL` |
| `createdAt`, `updatedAt` | timestamp | |

### `Address`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `userId` | uuid FK → User | |
| `fullName`, `phone` | text | |
| `line1`, `line2` (nullable) | text | |
| `city`, `state`, `pincode` | text | indexed on `pincode` |
| `isDefault` | boolean | default false |

### `Category`
| `id` PK, `name` unique, `slug` unique, `parentId` FK → Category (self-referential, nullable) |

> Note: the finalized schema has **no soft-delete (`deletedAt`)** on `Category` or `Product`, unlike the original draft. Deactivation is handled entirely via `Product.isActive`. Categories have no active/inactive flag at all currently — deleting a category in use will be blocked by the FK relation (or orphan products if you choose to allow null `categoryId`). **Open question for you:** is hard-deleting a category ever expected, or should `Category` also get an `isActive` flag before launch? Flagging rather than assuming.

### `Product`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name`, `slug` (unique) | text | |
| `description` | text, nullable | |
| `basePricePaise` | int | |
| `isActive` | boolean | default true — sole visibility control (no soft-delete field) |
| `categoryId` | uuid FK → Category, nullable | |

### `ProductVariant`
| `id` PK, `productId` FK, `sku` unique, `stock` int, `priceDeltaPaise` int |

### `ProductImage`
| `id` PK, `productId` FK, `url`, `altText` nullable, `isPrimary` boolean, `sortOrder` int |

> Note: `altText` is **nullable** in the finalized schema. Document 4 (Frontend Spec) §5 requires alt text as a *required form field* in the admin upload UI — that's an application-layer requirement, not a DB constraint, so this is consistent as long as the admin product form enforces it (TICKET-104's acceptance criteria already covers this). Flagging only so the constraint isn't assumed to live in the database.

### `Cart` / `CartItem`
- `Cart`: `id` PK, `userId` FK nullable (schema allows guest carts at the data level, though product requirements disable guest **checkout** — a cart can technically exist pre-login)
- `CartItem`: `id` PK, `cartId` FK, `productId` FK, `variantId` FK nullable, `quantity` int

> Note: `Cart.userId` being nullable is slightly broader than strictly needed given "no guest checkout," but is harmless — it just means a cart can exist before a user signs in (e.g., session-based browsing), which is reasonable UX as long as checkout itself still hard-requires authentication (enforced in TICKET-204, not at the schema level).

### `Order`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `userId` | uuid FK → User | |
| `addressId` | uuid FK → Address | **reference only — no address snapshot fields.** See §2.1 below. |
| `status` | `OrderStatus` enum | default `PLACED` |
| `paymentMethod` | `PaymentMethod` enum | default `COD` |
| `subtotalPaise`, `shippingPaise` (default 0), `codFeePaise` (default 0), `totalPaise` | int | all paise |
| `idempotencyKey` | text, unique, nullable | |
| `trackingReference` | text, nullable | **New field, added per confirmed decision.** Free-text field admin fills in manually after marking an order `SHIPPED` (e.g., a courier name + AWB number typed by hand). Shown to the customer on their order detail page as the closest thing to "tracking" available pre-Shiprocket. Not validated against any courier API at MVP — purely informational text. |

### `OrderItem`
| `id` PK, `orderId` FK, `productId` FK, `variantId` FK nullable, `quantity` int, `unitPricePaise` int, `lineTotalPaise` int |

> **No `productNameSnapshot` or variant-attributes snapshot.** See §2.1 below — same category of tradeoff as the address snapshot question.

### `OrderStatusHistory`
| `id` PK, `orderId` FK, `fromStatus` nullable, `toStatus`, `reason` nullable, `changedById` FK nullable (null = system), `createdAt` — append-only |

### `SupportTicket` / `TicketMessage`
- `SupportTicket`: `id` PK, `userId` FK nullable, `orderId` FK nullable, `subject`, `description` nullable, `status` enum
- `TicketMessage`: `id` PK, `ticketId` FK, `authorId` FK nullable, `message`, `isInternal` boolean default false

### `AuditLog`
| `id` PK, `actorId` FK nullable, `orderId` FK nullable, `action` text, `details` text nullable, `createdAt` |

> Note: `details` is `String?`, not `Json`. This is a workable choice (store a JSON-encoded string and parse on read) but loses native queryability (no `details->>'field'` filtering in Postgres). Acceptable at MVP audit-log volumes; flagged as a minor future improvement, not a blocker.

### `RiskFlag`
| `id` PK, `entityType` (`RiskEntityType`), `entityValue` text, `riskLevel` (`RiskLevel`), composite index on `(entityType, entityValue)` |

### `Setting`
| `key` text PK, `value` text (not Json), `updatedAt` |

> Same `String` vs `Json` tradeoff as `AuditLog.details` — workable for simple scalar settings (numbers, booleans as strings), but means settings holding structured data need manual `JSON.stringify`/`parse` at the application boundary. Fine for the flat config values in Document 6 §2 (limits, windows, thresholds are all single numbers).

### Not present in the finalized schema (were in the original draft — confirm if intentionally deferred)

| Table | Status |
|---|---|
| `PincodeRules` (per-pincode COD eligibility/serviceability) | **Resolved — no separate table.** Folded into `RiskFlag` using the existing `entityType = PINCODE` variant. See §2.2 below for the exact design. |
| `BusinessEvent` (structured event log distinct from audit logs) | **Not in schema.** This was the analytics/reporting event stream from Document 2 §2 and Document 5 §2 (e.g., `ORDER_PLACED`, `COMPLAINT_OPENED`). Not currently blocking — GA4 covers MVP analytics needs — so this can stay deferred to post-MVP without issue. Noting as accepted scope reduction, not an oversight. |

## 2.2 Pincode Serviceability & Risk via `RiskFlag` (Approved Design)

Rather than a dedicated `PincodeRules` table, pincode-level COD eligibility and risk both live as `RiskFlag` rows with `entityType = PINCODE` and `entityValue = "<6-digit pincode>"`.

**Design:**

| `riskLevel` on a `PINCODE` flag | Checkout behavior |
|---|---|
| *(no `RiskFlag` row exists for this pincode)* | **Not serviceable.** Address entry (TICKET-203) and checkout (TICKET-204) both reject with "We don't currently ship to this pincode." Absence of a row is the default "unserviceable" state — this is the seeding mechanism: you only add rows for pincodes you actually serve. |
| `LOW` | Serviceable, COD allowed with no extra friction |
| `MEDIUM` | Serviceable, COD allowed, but order is logged/watchlisted for review patterns (no customer-facing friction) |
| `HIGH` | Serviceable, but order requires manual admin approval before moving `PLACED` → `CONFIRMED` |
| `BLOCKED` | Serviceable for shipping in principle, but COD specifically disabled for this pincode — checkout shows "COD unavailable for this pincode" |

**Seeding:** at launch, an admin (or a seed script you run once) inserts one `RiskFlag` row per AP pincode you intend to serve, all at `riskLevel = LOW` to start. Expanding serviceability later is just inserting more rows — no migration needed, consistent with the Settings/Config philosophy of "no redeploy to change business rules."

**Lookup performance:** the existing composite index on `(entityType, entityValue)` (`risk_entity_idx`) already covers this exact query pattern (`WHERE entityType = 'PINCODE' AND entityValue = ?`), so no additional indexing work is needed.

**Operational note (not a schema concern):** you'll want your own reference list (spreadsheet, or just memory, given 10–20 products and a single city/region at launch) mapping which Vizag/AP pincodes correspond to which actual areas, so you know what you're approving when adding rows. That's an ops artifact, not something that needs to live in the database.

This replaces TICKET-203 and TICKET-204's dependency on a not-yet-existing `PincodeRules` table — both now depend on `RiskFlag` (already scheduled via TICKET-501), so no new ticket is needed, just an acceptance-criteria update (reflected in Document 8).

## 2.1 Decisions Needed: Historical Snapshotting

**Status: address-deletion protection approved; full snapshotting deferred (see below).**

The finalized schema stores **references only** (`Order.addressId`, `OrderItem.productId`/`variantId`) rather than copying the address and product/price details onto the order at creation time, which is what the original draft of this document specified in §4.

This is a real tradeoff, not a style choice:

| | Reference-only (current schema) | Snapshot (original draft) |
|---|---|---|
| Schema simplicity | Simpler — fewer columns, no duplication | More columns, some data duplication |
| Historical accuracy | **If a user edits/deletes a saved address, past orders' displayed address changes or breaks.** If a product is renamed or its price changes, past orders show the *current* name/price, not what was actually charged. | Past orders remain accurate regardless of later edits |
| Risk for GVSwift specifically | `unitPricePaise`/`lineTotalPaise` on `OrderItem` **do** preserve the price actually charged (good — pricing integrity is intact). | N/A |

**Approved fix (minimum viable):** `Order.addressId` gets `onDelete: Restrict`:

```prisma
addressId String
address   Address @relation(fields: [addressId], references: [id], onDelete: Restrict)
```

This means a customer cannot delete an address that's referenced by any existing order — the delete attempt fails at the database level rather than silently orphaning or corrupting order history. The address UI (TICKET-203) should catch this gracefully: attempting to delete an address used in a past order should show a clear message ("This address is used in a past order and can't be deleted — you can still edit it or mark a different one as default") rather than surfacing a raw DB constraint error.

**Deferred, not forgotten:** full snapshotting of product name/variant attributes (so a renamed product doesn't retroactively change how old orders display) remains out of scope for now, since price — the part that actually matters for disputes/accounting — is already preserved via `OrderItem.unitPricePaise`. Revisit if product renames become frequent enough to cause real customer confusion.

---

## 3. Indexing Strategy

| Table | Index | Reason |
|---|---|---|
| `Address` | `pincode`, `userId` | COD eligibility lookups, user's address list |
| `Order` | `userId`, `status`, `createdAt` | order history queries, admin filtering |
| `Order` | `idempotencyKey` unique | duplicate prevention |
| `ProductVariant` | `productId`, `sku` unique | catalog lookups |
| `Product` | `categoryId`, `slug` unique | listing pages |
| `RiskFlag` | `(entityType, entityValue)` composite (`risk_entity_idx`) | fast risk lookup at checkout |
| `SupportTicket` | `userId`, `orderId`, `status` | ticket dashboards |
| `AuditLog` | `actorId`, `orderId` | admin activity review |
| `User` | `email`, `phone` | login lookups, risk-by-phone lookups |

---

## 4. Concurrency & Inventory Consistency

**Problem:** two customers can attempt to buy the last unit of a variant simultaneously.

**Approach:** Pessimistic locking via a database transaction at checkout:

```
BEGIN TRANSACTION
  SELECT stock FROM "ProductVariant" WHERE id = ? FOR UPDATE
  IF stock < requested_quantity: ROLLBACK, return "out of stock" error
  UPDATE "ProductVariant" SET stock = stock - requested_quantity WHERE id = ?
  INSERT INTO "Order" (...)
  INSERT INTO "OrderItem" (...)
  INSERT INTO "OrderStatusHistory" (...)
COMMIT
```

`SELECT ... FOR UPDATE` row-locks the variant row for the transaction's duration, serializing concurrent checkout attempts on the same variant. At GVSwift's expected volume (low concurrency, 10–20 products) this is simpler and safer than optimistic concurrency (version columns + retry logic), at the cost of slightly higher lock contention under heavy simultaneous load — an acceptable tradeoff documented here as a known scaling limit. **Upgrade path if needed:** move to optimistic concurrency (a `version` column with conditional updates) if a single product ever sees genuinely high concurrent demand (e.g., a flash sale).

**Idempotency:** the checkout API requires a client-generated `idempotencyKey` (e.g., a UUID generated when the checkout page loads). The `Order.idempotencyKey` column is unique; a duplicate submission (double-click, retry) with the same key returns the original order instead of creating a second one.

**Abandoned checkouts:** MVP does not implement time-limited stock holds (no "reserved for 10 minutes" mechanic) — stock is deducted only at successful order creation, not at "add to cart." This is a deliberate MVP simplification: with low traffic and a small catalog, true overselling risk is low. **Documented technical debt:** if traffic grows, add a `StockReservation` table with TTL-based expiry, released by a scheduled cleanup job.

---

## 5. Migration & Backup Policy

- All schema changes go through `prisma migrate dev` (local) → `prisma migrate deploy` (production), never manual SQL against production.
- Every migration is committed to version control with a descriptive name.
- **Backups:** Supabase free tier provides daily backups with limited retention (verify current Supabase free-tier backup policy at supabase.com/docs before relying on it — free tier backup retention has changed across Supabase's pricing history, and I don't have a fully current figure I'm confident in). ⚠️ Recommend confirming this directly in your Supabase project dashboard before launch, and supplementing with a manual `pg_dump` export on a periodic basis as a second safety net while on the free tier.
- **RPO/RTO targets (MVP, low-volume):** RPO of 24 hours (daily backup) is acceptable at this stage; RTO is best-effort manual restore (no formal SLA at free-tier).

---

*End of Database Design Document. Proceed to Document 6 — Operations & Support.*
