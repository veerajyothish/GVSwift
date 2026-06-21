/**
 * scratch/verify-checkout-service.ts — Checkout Service Verification Script
 *
 * TICKET-204 acceptance criteria tests:
 *   1.  Happy path: serviceable pincode + valid cart → order created, stock decremented
 *   2.  Idempotency: same key twice → returns original order, no duplicate created
 *   3.  Out-of-stock: request qty > available → clear error, order NOT created
 *   4.  COD limit exceeded: total > ₹10,000 → COD_NOT_ELIGIBLE error
 *   5.  Unserviceable pincode: no RiskFlag row → clear "not serviceable" error
 *   6.  BLOCKED pincode: riskLevel = BLOCKED → COD_NOT_ELIGIBLE error
 *   7.  HIGH risk pincode: riskLevel = HIGH → order created with requiresApproval = true
 *   8.  BLOCKED user: user-level RiskFlag BLOCKED → COD_NOT_ELIGIBLE error
 *   9.  IDOR on cart: User B's cartId → NOT_FOUND (404)
 *   10. IDOR on address: User B's addressId → NOT_FOUND (404)
 *   11. Empty cart: no items → VALIDATION_ERROR
 *
 * Run: npx tsx scratch/verify-checkout-service.ts
 */

import { PrismaClient, RiskLevel, RiskEntityType } from "@prisma/client";
import { createOrder } from "../src/features/checkout/service";
import { AppError } from "../src/lib/errors";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function ok(label: string) {
  console.log(`  ✅ ${label}`);
  passed++;
}
function fail(label: string, err?: unknown) {
  console.error(`  ❌ ${label}`, err instanceof Error ? err.message : err);
  failed++;
}

async function expectError(
  label: string,
  fn: () => Promise<unknown>,
  expectedCode: string,
  expectedStatus?: number
) {
  try {
    await fn();
    fail(label + " (expected error, but none was thrown)");
  } catch (err) {
    if (err instanceof AppError) {
      if (err.code !== expectedCode) {
        fail(label, `Expected code ${expectedCode}, got ${err.code}: ${err.message}`);
      } else if (expectedStatus && err.statusCode !== expectedStatus) {
        fail(label, `Expected status ${expectedStatus}, got ${err.statusCode}`);
      } else {
        ok(`${label} → ${err.code}: "${err.message}"`);
      }
    } else {
      fail(label, err);
    }
  }
}

/* ── Test helpers: create minimal test data ─────────────────────────── */

async function createTestUser(phone: string = "9000000001") {
  return prisma.user.upsert({
    where: { supabaseId: `test-checkout-user-${phone}` },
    create: {
      supabaseId: `test-checkout-user-${phone}`,
      email: `checkout-test-${phone}@test.com`,
      phone,
      role: "USER",
      riskStatus: "NORMAL",
    },
    update: {},
  });
}

async function createTestCategory() {
  return prisma.category.upsert({
    where: { slug: "checkout-test-cat" },
    create: { name: "Checkout Test Category", slug: "checkout-test-cat" },
    update: {},
  });
}

async function createTestProduct(category: { id: string }, price: number = 50000) {
  const slug = `checkout-product-${randomUUID().slice(0, 8)}`;
  const product = await prisma.product.create({
    data: { name: "Checkout Test Product", slug, basePricePaise: price, categoryId: category.id },
  });
  const variant = await prisma.productVariant.create({
    data: { productId: product.id, sku: `sku-checkout-${randomUUID().slice(0, 8)}`, stock: 5, priceDeltaPaise: 0 },
  });
  return { product, variant };
}

async function createTestCart(userId: string, variantId: string, productId: string, qty: number) {
  const cart = await prisma.cart.create({ data: { userId } });
  await prisma.cartItem.create({
    data: { cartId: cart.id, productId, variantId, quantity: qty },
  });
  return cart;
}

async function createTestAddress(userId: string, pincode: string, phone: string = "9000000001") {
  return prisma.address.create({
    data: { userId, fullName: "Test User", phone, line1: "123 Test St", city: "Visakhapatnam", state: "Andhra Pradesh", pincode, isDefault: true },
  });
}

async function ensureRiskFlag(entityType: RiskEntityType, entityValue: string, riskLevel: RiskLevel) {
  const existing = await prisma.riskFlag.findFirst({
    where: { entityType, entityValue },
  });
  if (existing) {
    return prisma.riskFlag.update({ where: { id: existing.id }, data: { riskLevel } });
  }
  return prisma.riskFlag.create({ data: { entityType, entityValue, riskLevel } });
}

async function deleteRiskFlag(entityType: RiskEntityType, entityValue: string) {
  await prisma.riskFlag.deleteMany({ where: { entityType, entityValue } });
}

/* ── Cleanup helpers ────────────────────────────────────────────────── */

async function cleanupOrder(idempotencyKey: string) {
  const order = await prisma.order.findUnique({ where: { idempotencyKey }, include: { items: true, statusHistory: true } });
  if (order) {
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: order.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
  }
}

/* ══════════════════════════════════════════════════════════════════════ */
async function runTests() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║       TICKET-204: Checkout Service Verification          ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // ── Shared test fixtures ──────────────────────────────────────────────
  const category = await createTestCategory();
  const user = await createTestUser("9000000002");
  const userB = await createTestUser("9000000003");

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("Test 1: Happy path — valid cart, serviceable pincode");
  {
    const PINCODE = "530001";
    const KEY = `idem-happy-${randomUUID()}`;
    const { product, variant } = await createTestProduct(category);
    const address = await createTestAddress(user.id, PINCODE);
    const cart = await createTestCart(user.id, variant.id, product.id, 2);

    // Ensure pincode is serviceable (LOW)
    await ensureRiskFlag(RiskEntityType.PINCODE, PINCODE, RiskLevel.LOW);
    // Ensure user/phone/address have no BLOCKED flags
    await deleteRiskFlag(RiskEntityType.USER, user.id);

    const stockBefore = variant.stock; // 5

    try {
      const result = await createOrder(user.id, {
        cartId: cart.id,
        addressId: address.id,
        idempotencyKey: KEY,
        paymentMethod: "COD",
      });

      const stockAfter = (await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock;
      const cartCleared = (await prisma.cartItem.count({ where: { cartId: cart.id } })) === 0;
      const historyRow = await prisma.orderStatusHistory.findFirst({ where: { orderId: result.order.id } });

      if (result.order.status !== "PLACED") fail("Order status should be PLACED", result.order.status);
      else if (result.requiresApproval !== false) fail("requiresApproval should be false for LOW pincode");
      else if (result.wasIdempotent !== false) fail("wasIdempotent should be false for new order");
      else if (stockAfter !== stockBefore - 2) fail(`Stock not decremented: expected ${stockBefore - 2}, got ${stockAfter}`);
      else if (!cartCleared) fail("Cart items should be cleared after checkout");
      else if (!historyRow) fail("OrderStatusHistory row not created");
      else ok(`Order ${result.order.id} created, stock decremented ${stockBefore} → ${stockAfter}, cart cleared`);

      await cleanupOrder(KEY);
    } catch (err) {
      fail("Unexpected error in happy path", err);
    }

    // Cleanup: restore stock
    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: 5 } });
    await prisma.address.delete({ where: { id: address.id } });
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 2: Idempotency — same key returns original order, no duplicate");
  {
    const PINCODE = "530002";
    const KEY = `idem-test-${randomUUID()}`;
    const { product, variant } = await createTestProduct(category);
    const address = await createTestAddress(user.id, PINCODE);
    const cart = await createTestCart(user.id, variant.id, product.id, 1);

    await ensureRiskFlag(RiskEntityType.PINCODE, PINCODE, RiskLevel.LOW);

    try {
      // First call — creates order
      const first = await createOrder(user.id, {
        cartId: cart.id, addressId: address.id, idempotencyKey: KEY, paymentMethod: "COD",
      });

      // Second call with same key — should return same order
      const second = await createOrder(user.id, {
        cartId: cart.id, addressId: address.id, idempotencyKey: KEY, paymentMethod: "COD",
      });

      const orderCount = await prisma.order.count({ where: { idempotencyKey: KEY } });

      if (first.order.id !== second.order.id) fail("Idempotency: different orders returned for same key");
      else if (!second.wasIdempotent) fail("Idempotency: wasIdempotent should be true on second call");
      else if (orderCount !== 1) fail(`Idempotency: ${orderCount} orders in DB, expected 1`);
      else ok(`Same key → same order (${first.order.id}), wasIdempotent=true, DB count=1`);

      await cleanupOrder(KEY);
    } catch (err) {
      fail("Unexpected error in idempotency test", err);
    }

    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: 5 } });
    await prisma.address.delete({ where: { id: address.id } });
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 3: Out-of-stock — quantity exceeds available stock");
  {
    const PINCODE = "530003";
    const { product, variant } = await createTestProduct(category);
    const address = await createTestAddress(user.id, PINCODE);
    // Cart requests 10 but only 5 in stock
    const cart = await createTestCart(user.id, variant.id, product.id, 10);

    await ensureRiskFlag(RiskEntityType.PINCODE, PINCODE, RiskLevel.LOW);

    await expectError(
      "Out-of-stock: qty=10, stock=5",
      () => createOrder(user.id, {
        cartId: cart.id, addressId: address.id,
        idempotencyKey: `idem-oos-${randomUUID()}`, paymentMethod: "COD",
      }),
      "OUT_OF_STOCK",
      400
    );

    // Verify stock was NOT decremented (transaction rolled back)
    const stockAfter = (await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock;
    if (stockAfter === 5) ok("Stock correctly unchanged after rollback (still 5)");
    else fail(`Stock was modified despite out-of-stock error: ${stockAfter}`);

    await prisma.address.delete({ where: { id: address.id } });
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 4: COD limit exceeded — total > ₹10,000");
  {
    const PINCODE = "530004";
    // ₹10,001 order (price per unit 1,000,100 paise, qty 1 → total > limit)
    const { product, variant } = await createTestProduct(category, 1_000_100);
    const address = await createTestAddress(user.id, PINCODE);
    const cart = await createTestCart(user.id, variant.id, product.id, 1);

    await ensureRiskFlag(RiskEntityType.PINCODE, PINCODE, RiskLevel.LOW);

    await expectError(
      "COD limit exceeded (₹10,001)",
      () => createOrder(user.id, {
        cartId: cart.id, addressId: address.id,
        idempotencyKey: `idem-limit-${randomUUID()}`, paymentMethod: "COD",
      }),
      "COD_NOT_ELIGIBLE",
      400
    );

    await prisma.address.delete({ where: { id: address.id } });
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 5: Unserviceable pincode — no RiskFlag row exists");
  {
    const PINCODE = "999999"; // No row in RiskFlag table
    await deleteRiskFlag(RiskEntityType.PINCODE, PINCODE);

    const { product, variant } = await createTestProduct(category);
    const address = await createTestAddress(user.id, PINCODE);
    const cart = await createTestCart(user.id, variant.id, product.id, 1);

    await expectError(
      "Unserviceable pincode (no RiskFlag row)",
      () => createOrder(user.id, {
        cartId: cart.id, addressId: address.id,
        idempotencyKey: `idem-noserv-${randomUUID()}`, paymentMethod: "COD",
      }),
      "VALIDATION_ERROR",
      400
    );

    await prisma.address.delete({ where: { id: address.id } });
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 6: BLOCKED pincode — COD disabled for this pincode");
  {
    const PINCODE = "530006";
    await ensureRiskFlag(RiskEntityType.PINCODE, PINCODE, RiskLevel.BLOCKED);

    const { product, variant } = await createTestProduct(category);
    const address = await createTestAddress(user.id, PINCODE);
    const cart = await createTestCart(user.id, variant.id, product.id, 1);

    await expectError(
      "BLOCKED pincode → COD_NOT_ELIGIBLE",
      () => createOrder(user.id, {
        cartId: cart.id, addressId: address.id,
        idempotencyKey: `idem-blocked-pin-${randomUUID()}`, paymentMethod: "COD",
      }),
      "COD_NOT_ELIGIBLE",
      400
    );

    await prisma.address.delete({ where: { id: address.id } });
    // Restore pincode to LOW for other tests
    await ensureRiskFlag(RiskEntityType.PINCODE, PINCODE, RiskLevel.LOW);
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 7: HIGH risk pincode — order created, requiresApproval = true");
  {
    const PINCODE = "530007";
    const KEY = `idem-high-${randomUUID()}`;
    await ensureRiskFlag(RiskEntityType.PINCODE, PINCODE, RiskLevel.HIGH);

    const { product, variant } = await createTestProduct(category);
    const address = await createTestAddress(user.id, PINCODE);
    const cart = await createTestCart(user.id, variant.id, product.id, 1);

    // Ensure user/phone/address don't have their own BLOCKED flags
    await deleteRiskFlag(RiskEntityType.USER, user.id);

    try {
      const result = await createOrder(user.id, {
        cartId: cart.id, addressId: address.id, idempotencyKey: KEY, paymentMethod: "COD",
      });

      if (result.order.status !== "PLACED") fail("HIGH risk: order status should still be PLACED");
      else if (!result.requiresApproval) fail("HIGH risk: requiresApproval should be true");
      else {
        const historyRow = await prisma.orderStatusHistory.findFirst({ where: { orderId: result.order.id } });
        ok(`Order created (${result.order.id}), requiresApproval=true, reason="${historyRow?.reason}"`);
      }

      await cleanupOrder(KEY);
    } catch (err) {
      fail("HIGH risk: unexpected error", err);
    }

    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: 5 } });
    await prisma.address.delete({ where: { id: address.id } });
    await ensureRiskFlag(RiskEntityType.PINCODE, PINCODE, RiskLevel.LOW);
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 8: BLOCKED user — user-level RiskFlag blocks COD");
  {
    const PINCODE = "530008";
    await ensureRiskFlag(RiskEntityType.PINCODE, PINCODE, RiskLevel.LOW);
    await ensureRiskFlag(RiskEntityType.USER, user.id, RiskLevel.BLOCKED);

    const { product, variant } = await createTestProduct(category);
    const address = await createTestAddress(user.id, PINCODE);
    const cart = await createTestCart(user.id, variant.id, product.id, 1);

    await expectError(
      "BLOCKED user → COD_NOT_ELIGIBLE",
      () => createOrder(user.id, {
        cartId: cart.id, addressId: address.id,
        idempotencyKey: `idem-blocked-user-${randomUUID()}`, paymentMethod: "COD",
      }),
      "COD_NOT_ELIGIBLE",
      400
    );

    await deleteRiskFlag(RiskEntityType.USER, user.id);
    await prisma.address.delete({ where: { id: address.id } });
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 9: IDOR on cart — User B tries to use User A's cartId");
  {
    const PINCODE = "530009";
    await ensureRiskFlag(RiskEntityType.PINCODE, PINCODE, RiskLevel.LOW);

    const { product, variant } = await createTestProduct(category);
    // Cart belongs to User A (user)
    const cartA = await createTestCart(user.id, variant.id, product.id, 1);
    // Address belongs to User B
    const addressB = await createTestAddress(userB.id, PINCODE);

    await expectError(
      "IDOR: User B uses User A's cartId → NOT_FOUND",
      () => createOrder(userB.id, {
        cartId: cartA.id, addressId: addressB.id,
        idempotencyKey: `idem-idor-cart-${randomUUID()}`, paymentMethod: "COD",
      }),
      "NOT_FOUND",
      404
    );

    await prisma.address.delete({ where: { id: addressB.id } });
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 10: IDOR on address — User B tries to use User A's addressId");
  {
    const PINCODE = "530010";
    await ensureRiskFlag(RiskEntityType.PINCODE, PINCODE, RiskLevel.LOW);

    const { product, variant } = await createTestProduct(category);
    // Cart belongs to User B
    const cartB = await createTestCart(userB.id, variant.id, product.id, 1);
    // Address belongs to User A
    const addressA = await createTestAddress(user.id, PINCODE);

    await expectError(
      "IDOR: User B uses User A's addressId → NOT_FOUND",
      () => createOrder(userB.id, {
        cartId: cartB.id, addressId: addressA.id,
        idempotencyKey: `idem-idor-addr-${randomUUID()}`, paymentMethod: "COD",
      }),
      "NOT_FOUND",
      404
    );

    await prisma.address.delete({ where: { id: addressA.id } });
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 11: Empty cart — no items");
  {
    const PINCODE = "530011";
    await ensureRiskFlag(RiskEntityType.PINCODE, PINCODE, RiskLevel.LOW);

    // Create cart with NO items
    const emptyCart = await prisma.cart.create({ data: { userId: user.id } });
    const address = await createTestAddress(user.id, PINCODE);

    await expectError(
      "Empty cart → VALIDATION_ERROR",
      () => createOrder(user.id, {
        cartId: emptyCart.id, addressId: address.id,
        idempotencyKey: `idem-empty-${randomUUID()}`, paymentMethod: "COD",
      }),
      "VALIDATION_ERROR",
      400
    );

    await prisma.address.delete({ where: { id: address.id } });
  }

  /* ── Results ────────────────────────────────────────────────────────── */
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log("═══════════════════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
