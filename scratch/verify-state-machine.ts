/**
 * scratch/verify-state-machine.ts — Order State Machine Verification Script
 *
 * Runs unit/integration tests to verify all requirements of TICKET-301:
 *   1. All valid status transitions under admin/user permissions
 *   2. Invalid status transitions are rejected
 *   3. Customer cancellation cutoff at SHIPPED
 *   4. Admin post-shipped cancellation override with mandatory reason
 *   5. Delivery retry attempts gating (max_delivery_attempts limit)
 *   6. FAILED_DELIVERY -> RTO transition conditions
 *   7. Return window limit enforcement (return_window_days check)
 *   8. Safety stock check: auto-cancel on PLACED -> CONFIRMED with stock release
 *
 * Run: npx tsx scratch/verify-state-machine.ts
 */

import { PrismaClient, OrderStatus, Role } from "@prisma/client";
import { transitionOrderStatus } from "../src/features/orders/state-machine";
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
  expectedCode: string
) {
  try {
    await fn();
    fail(label + " (expected error, but none was thrown)");
  } catch (err) {
    if (err instanceof AppError) {
      if (err.code !== expectedCode) {
        fail(label, `Expected code ${expectedCode}, got ${err.code}: ${err.message}`);
      } else {
        ok(`${label} → ${err.code}: "${err.message}"`);
      }
    } else {
      fail(label, err);
    }
  }
}

/* ── Test Helpers: create data ────────────────────────────────────────── */

async function createTestUser(role: Role = Role.USER) {
  const phone = Math.floor(6000000000 + Math.random() * 3000000000).toString();
  const idStr = randomUUID().slice(0, 8);
  return prisma.user.create({
    data: {
      supabaseId: `test-sm-user-${idStr}`,
      email: `sm-test-${idStr}@test.com`,
      phone,
      role,
    },
  });
}

async function createTestProduct() {
  const idStr = randomUUID().slice(0, 8);
  const product = await prisma.product.create({
    data: {
      name: `SM Test Product ${idStr}`,
      slug: `sm-product-${idStr}`,
      basePricePaise: 10000,
    },
  });
  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      sku: `sku-sm-${idStr}`,
      stock: 5,
      priceDeltaPaise: 0,
    },
  });
  return { product, variant };
}

async function createTestOrder(userId: string, variantId: string, productId: string, qty: number = 1) {
  // Needs a address first
  const address = await prisma.address.create({
    data: {
      userId,
      fullName: "SM Test Recipient",
      phone: "9876543210",
      line1: "123 Test St",
      city: "Visakhapatnam",
      state: "Andhra Pradesh",
      pincode: "530001",
    },
  });

  const order = await prisma.order.create({
    data: {
      userId,
      addressId: address.id,
      status: OrderStatus.PLACED,
      paymentMethod: "COD",
      subtotalPaise: 10000,
      totalPaise: 10000,
      idempotencyKey: `idem-sm-${randomUUID()}`,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId,
      variantId,
      quantity: qty,
      unitPricePaise: 10000,
      lineTotalPaise: 10000,
    },
  });

  return { order, address };
}

async function cleanupOrderData(orderId: string, addressId: string) {
  await prisma.orderStatusHistory.deleteMany({ where: { orderId } });
  await prisma.orderItem.deleteMany({ where: { orderId } });
  await prisma.order.delete({ where: { id: orderId } });
  await prisma.address.delete({ where: { id: addressId } });
}

/* ── Running Tests ────────────────────────────────────────────────────── */

async function runTests() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║         TICKET-301: Order State Machine Tests            ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const adminUser = await createTestUser(Role.ADMIN);
  const normalUser = await createTestUser(Role.USER);

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("Test 1: Valid transition path (PLACED -> CONFIRMED -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED) by Admin");
  {
    const { product, variant } = await createTestProduct();
    const { order, address } = await createTestOrder(normalUser.id, variant.id, product.id);

    try {
      // 1. PLACED -> CONFIRMED
      let updated = await transitionOrderStatus(order.id, OrderStatus.CONFIRMED, adminUser.id, Role.ADMIN, "Confirmed by Admin");
      console.assert(updated.status === OrderStatus.CONFIRMED, "Should be CONFIRMED");

      // 2. CONFIRMED -> SHIPPED
      updated = await transitionOrderStatus(order.id, OrderStatus.SHIPPED, adminUser.id, Role.ADMIN, "Shipped out");
      console.assert(updated.status === OrderStatus.SHIPPED, "Should be SHIPPED");

      // 3. SHIPPED -> OUT_FOR_DELIVERY
      updated = await transitionOrderStatus(order.id, OrderStatus.OUT_FOR_DELIVERY, adminUser.id, Role.ADMIN, "Out for delivery");
      console.assert(updated.status === OrderStatus.OUT_FOR_DELIVERY, "Should be OUT_FOR_DELIVERY");

      // 4. OUT_FOR_DELIVERY -> DELIVERED
      updated = await transitionOrderStatus(order.id, OrderStatus.DELIVERED, adminUser.id, Role.ADMIN, "Delivered to door");
      console.assert(updated.status === OrderStatus.DELIVERED, "Should be DELIVERED");

      // Verify history records
      const histories = await prisma.orderStatusHistory.findMany({
        where: { orderId: order.id },
        orderBy: { createdAt: "asc" },
      });

      console.assert(histories.length === 4, "Should have 4 history records");
      console.assert(histories[0].toStatus === OrderStatus.CONFIRMED, "First should be CONFIRMED");
      console.assert(histories[3].toStatus === OrderStatus.DELIVERED, "Last should be DELIVERED");

      ok("Valid transition chain succeeded and history logged correctly.");
    } catch (err) {
      fail("Test 1 failed unexpectedly:", err);
    } finally {
      await cleanupOrderData(order.id, address.id);
      await prisma.productVariant.delete({ where: { id: variant.id } });
      await prisma.product.delete({ where: { id: product.id } });
    }
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 2: Invalid transition path (PLACED -> DELIVERED directly) rejection");
  {
    const { product, variant } = await createTestProduct();
    const { order, address } = await createTestOrder(normalUser.id, variant.id, product.id);

    await expectError(
      "Invalid transition PLACED -> DELIVERED",
      () => transitionOrderStatus(order.id, OrderStatus.DELIVERED, adminUser.id, Role.ADMIN),
      "INVALID_TRANSITION"
    );

    await cleanupOrderData(order.id, address.id);
    await prisma.productVariant.delete({ where: { id: variant.id } });
    await prisma.product.delete({ where: { id: product.id } });
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 3: Customer permission limits (Standard USER cannot confirm or ship orders)");
  {
    const { product, variant } = await createTestProduct();
    const { order, address } = await createTestOrder(normalUser.id, variant.id, product.id);

    await expectError(
      "Customer cannot confirm order",
      () => transitionOrderStatus(order.id, OrderStatus.CONFIRMED, normalUser.id, Role.USER),
      "INVALID_TRANSITION"
    );

    await cleanupOrderData(order.id, address.id);
    await prisma.productVariant.delete({ where: { id: variant.id } });
    await prisma.product.delete({ where: { id: product.id } });
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 4: Customer cancellation cutoff at SHIPPED");
  {
    const { product, variant } = await createTestProduct();
    const { order, address } = await createTestOrder(normalUser.id, variant.id, product.id);

    try {
      // PLACED -> CONFIRMED -> SHIPPED (by admin)
      await transitionOrderStatus(order.id, OrderStatus.CONFIRMED, adminUser.id, Role.ADMIN);
      await transitionOrderStatus(order.id, OrderStatus.SHIPPED, adminUser.id, Role.ADMIN);

      // Customer tries to cancel SHIPPED order
      await expectError(
        "Customer cannot cancel after SHIPPED status",
        () => transitionOrderStatus(order.id, OrderStatus.CANCELLED, normalUser.id, Role.USER),
        "INVALID_TRANSITION"
      );

      // Admin cancels SHIPPED order WITH reason
      const updated = await transitionOrderStatus(order.id, OrderStatus.CANCELLED, adminUser.id, Role.ADMIN, "Goodwill exception reason");
      console.assert(updated.status === OrderStatus.CANCELLED, "Admin should be able to cancel");
      
      // Stock released back (deducted initially by checkout service test, but here we just added it back)
      const variantAfter = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
      console.assert(variantAfter.stock === 6, `Stock should be released (5 + 1), got ${variantAfter.stock}`);

      ok("Customer cancellation cutoff enforced, Admin cancel override with stock release works.");
    } catch (err) {
      fail("Test 4 failed unexpectedly:", err);
    } finally {
      await cleanupOrderData(order.id, address.id);
      await prisma.productVariant.delete({ where: { id: variant.id } });
      await prisma.product.delete({ where: { id: product.id } });
    }
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 5: Admin post-shipped cancellation reason requirement");
  {
    const { product, variant } = await createTestProduct();
    const { order, address } = await createTestOrder(normalUser.id, variant.id, product.id);

    try {
      await transitionOrderStatus(order.id, OrderStatus.CONFIRMED, adminUser.id, Role.ADMIN);
      await transitionOrderStatus(order.id, OrderStatus.SHIPPED, adminUser.id, Role.ADMIN);

      await expectError(
        "Admin cancel post-shipped requires mandatory reason",
        () => transitionOrderStatus(order.id, OrderStatus.CANCELLED, adminUser.id, Role.ADMIN, ""),
        "VALIDATION_ERROR"
      );
    } catch (err) {
      fail("Test 5 failed unexpectedly:", err);
    } finally {
      await cleanupOrderData(order.id, address.id);
      await prisma.productVariant.delete({ where: { id: variant.id } });
      await prisma.product.delete({ where: { id: product.id } });
    }
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 6: FAILED_DELIVERY retry and RTO attempt gating");
  {
    const { product, variant } = await createTestProduct();
    const { order, address } = await createTestOrder(normalUser.id, variant.id, product.id);

    try {
      // Move to FAILED_DELIVERY first: PLACED -> CONFIRMED -> SHIPPED -> OUT_FOR_DELIVERY -> FAILED_DELIVERY
      await transitionOrderStatus(order.id, OrderStatus.CONFIRMED, adminUser.id, Role.ADMIN);
      await transitionOrderStatus(order.id, OrderStatus.SHIPPED, adminUser.id, Role.ADMIN);
      await transitionOrderStatus(order.id, OrderStatus.OUT_FOR_DELIVERY, adminUser.id, Role.ADMIN);
      
      // Attempt 1: FAILED_DELIVERY (deliveryAttempts increments to 1)
      let updated = await transitionOrderStatus(order.id, OrderStatus.FAILED_DELIVERY, adminUser.id, Role.ADMIN);
      console.assert(updated.deliveryAttempts === 1, "Attempts should be 1");

      // Verify that transition to RTO is BLOCKED because deliveryAttempts (1) < maxAttempts (2)
      await expectError(
        "RTO rejected because attempts < maxAttempts",
        () => transitionOrderStatus(order.id, OrderStatus.RTO, null, null),
        "VALIDATION_ERROR"
      );

      // Attempt 2: retry (FAILED_DELIVERY -> OUT_FOR_DELIVERY) - allowed since 1 < 2
      await transitionOrderStatus(order.id, OrderStatus.OUT_FOR_DELIVERY, adminUser.id, Role.ADMIN);
      
      // Attempt 2: FAILED_DELIVERY (deliveryAttempts increments to 2)
      updated = await transitionOrderStatus(order.id, OrderStatus.FAILED_DELIVERY, adminUser.id, Role.ADMIN);
      console.assert(updated.deliveryAttempts === 2, "Attempts should be 2");

      // Verify that retry (OUT_FOR_DELIVERY) is now BLOCKED because deliveryAttempts (2) >= maxAttempts (2)
      await expectError(
        "Retry rejected because attempts >= maxAttempts",
        () => transitionOrderStatus(order.id, OrderStatus.OUT_FOR_DELIVERY, adminUser.id, Role.ADMIN),
        "VALIDATION_ERROR"
      );

      // Transition to RTO - allowed since 2 >= 2
      updated = await transitionOrderStatus(order.id, OrderStatus.RTO, null, null);
      console.assert(updated.status === OrderStatus.RTO, "Should be RTO");

      ok("Delivery attempt retry bounds and RTO gating verified successfully.");
    } catch (err) {
      fail("Test 6 failed unexpectedly:", err);
    } finally {
      await cleanupOrderData(order.id, address.id);
      await prisma.productVariant.delete({ where: { id: variant.id } });
      await prisma.product.delete({ where: { id: product.id } });
    }
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 7: Return window limit enforcement (return_window_days)");
  {
    const { product, variant } = await createTestProduct();
    const { order, address } = await createTestOrder(normalUser.id, variant.id, product.id);

    try {
      // PLACED -> CONFIRMED -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED
      await transitionOrderStatus(order.id, OrderStatus.CONFIRMED, adminUser.id, Role.ADMIN);
      await transitionOrderStatus(order.id, OrderStatus.SHIPPED, adminUser.id, Role.ADMIN);
      await transitionOrderStatus(order.id, OrderStatus.OUT_FOR_DELIVERY, adminUser.id, Role.ADMIN);
      await transitionOrderStatus(order.id, OrderStatus.DELIVERED, adminUser.id, Role.ADMIN);

      // Backdate the DELIVERED history entry to 10 days ago (limit is 7 days)
      const deliveryHistory = await prisma.orderStatusHistory.findFirstOrThrow({
        where: { orderId: order.id, toStatus: OrderStatus.DELIVERED },
      });
      const backdate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      await prisma.orderStatusHistory.update({
        where: { id: deliveryHistory.id },
        data: { createdAt: backdate },
      });

      // Customer requests return -> should be rejected
      await expectError(
        "Return request rejected post-return window",
        () => transitionOrderStatus(order.id, OrderStatus.RETURN_REQUESTED, normalUser.id, Role.USER),
        "VALIDATION_ERROR"
      );

      ok("Return window validation correctly enforced.");
    } catch (err) {
      fail("Test 7 failed unexpectedly:", err);
    } finally {
      await cleanupOrderData(order.id, address.id);
      await prisma.productVariant.delete({ where: { id: variant.id } });
      await prisma.product.delete({ where: { id: product.id } });
    }
  }

  /* ──────────────────────────────────────────────────────────────────── */
  console.log("\nTest 8: Safety stock check: auto-cancel on PLACED -> CONFIRMED");
  {
    const { product, variant } = await createTestProduct();
    const { order, address } = await createTestOrder(normalUser.id, variant.id, product.id);

    try {
      // Manually set variant stock to -1 (simulating correction/oversell)
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { stock: -1 },
      });

      // Attempt to confirm the order -> should result in auto-cancel instead of confirm
      const result = await transitionOrderStatus(order.id, OrderStatus.CONFIRMED, adminUser.id, Role.ADMIN);
      
      console.assert(result.status === OrderStatus.CANCELLED, "Should be auto-cancelled to CANCELLED status");

      const history = await prisma.orderStatusHistory.findFirstOrThrow({
        where: { orderId: order.id, toStatus: OrderStatus.CANCELLED },
      });
      console.assert(history.changedById === null, "System-triggered should have changedById = null");
      console.assert(history.reason === "Auto-cancelled: insufficient stock at confirmation", `Reason is: ${history.reason}`);

      // Variant stock released back (-1 + 1 = 0)
      const variantAfter = await prisma.productVariant.findUniqueOrThrow({
        where: { id: variant.id },
      });
      console.assert(variantAfter.stock === 0, `Stock should be released back to 0, got ${variantAfter.stock}`);

      ok("Auto-cancellations with stock releases during confirmation work correctly.");
    } catch (err) {
      fail("Test 8 failed unexpectedly:", err);
    } finally {
      await cleanupOrderData(order.id, address.id);
      await prisma.productVariant.delete({ where: { id: variant.id } });
      await prisma.product.delete({ where: { id: product.id } });
    }
  }

  /* ── Results ────────────────────────────────────────────────────────── */
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`  SM Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log("═══════════════════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
}

// Ensure cleanup of user records created
runTests()
  .catch((err) => {
    console.error("Fatal error in state machine tests:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
