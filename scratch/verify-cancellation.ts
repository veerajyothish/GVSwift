/**
 * scratch/verify-cancellation.ts — TICKET-303 Cancellation Flow Tests
 *
 * Tests:
 *   1. Cancel a PLACED order → succeeds, status becomes CANCELLED, history row created
 *   2. Cancel a CONFIRMED order → succeeds
 *   3. Cancel a SHIPPED order as USER → rejected (INVALID_TRANSITION)
 *   4. Stock is restored correctly after cancellation
 *   5. IDOR attempt (wrong userId) → 404 NOT_FOUND
 *   6. Missing reason → rejected (VALIDATION_ERROR)
 *
 * Run: npx tsx scratch/verify-cancellation.ts
 */

import { PrismaClient, OrderStatus, Role } from "@prisma/client";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    failed++;
  }
}

async function cleanup(ids: string[]) {
  for (const id of ids) {
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: id } });
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.order.deleteMany({ where: { id } });
  }
}

async function main() {
  console.log("\n🧪 TICKET-303: Customer Cancellation Flow Tests\n");

  // ── Setup: create test user, product, variant, address ──
  const testUser = await prisma.user.upsert({
    where: { email: "cancel-test@gvswift.test" },
    update: {},
    create: {
      supabaseId: "cancel-test-supabase-id",
      email: "cancel-test@gvswift.test",
      phone: "+919999900001",
      role: Role.USER,
    },
  });

  const otherUser = await prisma.user.upsert({
    where: { email: "cancel-other@gvswift.test" },
    update: {},
    create: {
      supabaseId: "cancel-other-supabase-id",
      email: "cancel-other@gvswift.test",
      phone: "+919999900002",
      role: Role.USER,
    },
  });

  // Create product + variant with known stock
  let product = await prisma.product.findFirst({ where: { slug: "cancel-test-product" } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: "Cancel Test Product",
        slug: "cancel-test-product",
        basePricePaise: 100000,
        isActive: true,
      },
    });
  }

  let variant = await prisma.productVariant.findFirst({ where: { sku: "CANCEL-TEST-V1" } });
  if (!variant) {
    variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: "CANCEL-TEST-V1",
        stock: 50,
        priceDeltaPaise: 0,
      },
    });
  } else {
    // Reset stock
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: 50 },
    });
  }

  const address = await prisma.address.findFirst({ where: { userId: testUser.id } });
  let addressId: string;
  if (address) {
    addressId = address.id;
  } else {
    const newAddr = await prisma.address.create({
      data: {
        userId: testUser.id,
        fullName: "Test User",
        line1: "123 Test St",
        city: "Test City",
        state: "Andhra Pradesh",
        pincode: "530001",
        phone: "+919999900001",
      },
    });
    addressId = newAddr.id;
  }

  const orderIds: string[] = [];

  try {
    // Dynamic import of the service
    const { cancelOrder } = await import("../src/features/orders/service");

    // ── Test 1: Cancel a PLACED order ──
    console.log("\n📋 Test 1: Cancel a PLACED order");
    const order1 = await prisma.order.create({
      data: {
        userId: testUser.id,
        addressId,
        status: OrderStatus.PLACED,
        subtotalPaise: 200000,
        totalPaise: 200000,
        items: {
          create: {
            productId: product.id,
            variantId: variant.id,
            quantity: 2,
            unitPricePaise: 100000,
            lineTotalPaise: 200000,
          },
        },
      },
    });
    orderIds.push(order1.id);

    // Deduct stock as checkout would
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: { decrement: 2 } },
    });

    const stockBefore = (await prisma.productVariant.findUnique({ where: { id: variant.id } }))!.stock;

    await cancelOrder(testUser.id, order1.id, "Changed my mind");

    const updated1 = await prisma.order.findUnique({ where: { id: order1.id } });
    assert(updated1?.status === OrderStatus.CANCELLED, "Order status is CANCELLED");

    const history1 = await prisma.orderStatusHistory.findFirst({
      where: { orderId: order1.id, toStatus: OrderStatus.CANCELLED },
    });
    assert(history1 !== null, "OrderStatusHistory row created");
    assert(history1?.reason === "Changed my mind", "History reason matches");
    assert(history1?.changedById === testUser.id, "changedById is the customer");

    // ── Test 2: Stock is restored correctly ──
    console.log("\n📋 Test 2: Stock is restored correctly after cancellation");
    const stockAfter = (await prisma.productVariant.findUnique({ where: { id: variant.id } }))!.stock;
    assert(stockAfter === stockBefore + 2, `Stock restored: ${stockBefore} → ${stockAfter} (expected +2)`);

    // ── Test 3: Cancel a CONFIRMED order ──
    console.log("\n📋 Test 3: Cancel a CONFIRMED order");
    // Reset stock
    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: 50 } });

    const order2 = await prisma.order.create({
      data: {
        userId: testUser.id,
        addressId,
        status: OrderStatus.CONFIRMED,
        subtotalPaise: 100000,
        totalPaise: 100000,
        items: {
          create: {
            productId: product.id,
            variantId: variant.id,
            quantity: 1,
            unitPricePaise: 100000,
            lineTotalPaise: 100000,
          },
        },
      },
    });
    orderIds.push(order2.id);

    // Deduct stock
    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: { decrement: 1 } } });

    await cancelOrder(testUser.id, order2.id, "Found a better deal");

    const updated2 = await prisma.order.findUnique({ where: { id: order2.id } });
    assert(updated2?.status === OrderStatus.CANCELLED, "CONFIRMED order cancelled successfully");

    // ── Test 4: Cancel a SHIPPED order as USER → rejected ──
    console.log("\n📋 Test 4: Cancel a SHIPPED order as USER → rejected");
    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: 50 } });

    const order3 = await prisma.order.create({
      data: {
        userId: testUser.id,
        addressId,
        status: OrderStatus.SHIPPED,
        subtotalPaise: 100000,
        totalPaise: 100000,
        items: {
          create: {
            productId: product.id,
            variantId: variant.id,
            quantity: 1,
            unitPricePaise: 100000,
            lineTotalPaise: 100000,
          },
        },
      },
    });
    orderIds.push(order3.id);

    try {
      await cancelOrder(testUser.id, order3.id, "I want to cancel");
      assert(false, "Should have thrown for SHIPPED order");
    } catch (err: unknown) {
      const error = err as { code?: string };
      assert(error.code === "INVALID_TRANSITION", "Correctly rejected: INVALID_TRANSITION");
    }

    // ── Test 5: IDOR attempt → 404 ──
    console.log("\n📋 Test 5: IDOR attempt (wrong userId) → 404");
    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: 50 } });

    const order4 = await prisma.order.create({
      data: {
        userId: testUser.id,
        addressId,
        status: OrderStatus.PLACED,
        subtotalPaise: 100000,
        totalPaise: 100000,
        items: {
          create: {
            productId: product.id,
            variantId: variant.id,
            quantity: 1,
            unitPricePaise: 100000,
            lineTotalPaise: 100000,
          },
        },
      },
    });
    orderIds.push(order4.id);

    try {
      await cancelOrder(otherUser.id, order4.id, "Trying to cancel someone else's order");
      assert(false, "Should have thrown for wrong user");
    } catch (err: unknown) {
      const error = err as { code?: string; statusCode?: number };
      assert(error.code === "NOT_FOUND", "Returns NOT_FOUND (not FORBIDDEN)");
      assert(error.statusCode === 404, "Status code is 404");
    }

    // ── Test 6: Missing reason → rejected ──
    console.log("\n📋 Test 6: Missing reason → VALIDATION_ERROR");
    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: 50 } });

    const order5 = await prisma.order.create({
      data: {
        userId: testUser.id,
        addressId,
        status: OrderStatus.PLACED,
        subtotalPaise: 100000,
        totalPaise: 100000,
        items: {
          create: {
            productId: product.id,
            variantId: variant.id,
            quantity: 1,
            unitPricePaise: 100000,
            lineTotalPaise: 100000,
          },
        },
      },
    });
    orderIds.push(order5.id);

    try {
      await cancelOrder(testUser.id, order5.id, "   ");
      assert(false, "Should have thrown for empty reason");
    } catch (err: unknown) {
      const error = err as { code?: string };
      assert(error.code === "VALIDATION_ERROR", "Returns VALIDATION_ERROR for empty reason");
    }

  } finally {
    // Cleanup
    await cleanup(orderIds);
    await prisma.productVariant.deleteMany({ where: { sku: "CANCEL-TEST-V1" } });
    await prisma.product.deleteMany({ where: { slug: "cancel-test-product" } });
    await prisma.address.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.deleteMany({ where: { email: { in: ["cancel-test@gvswift.test", "cancel-other@gvswift.test"] } } });
    await prisma.$disconnect();
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
