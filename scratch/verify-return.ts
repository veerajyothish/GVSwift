/**
 * scratch/verify-return.ts — TICKET-304 Return Flow Tests
 *
 * Tests:
 *   1. Return a DELIVERED order → succeeds, status becomes RETURN_REQUESTED, history row created
 *   2. Return window expired → rejected (VALIDATION_ERROR)
 *   3. Return on a non-DELIVERED order (e.g. SHIPPED) → rejected (INVALID_TRANSITION)
 *   4. IDOR attempt (wrong userId) → 404 NOT_FOUND
 *   5. Missing reason → rejected (VALIDATION_ERROR)
 *   6. Duplicate return request → rejected since order is no longer in DELIVERED status
 *
 * Run: npx tsx scratch/verify-return.ts
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
  console.log("\n🧪 TICKET-304: Customer Return Request Flow Tests\n");

  // ── Setup: create test user, product, variant, address ──
  const testUser = await prisma.user.upsert({
    where: { email: "return-test@gvswift.test" },
    update: {},
    create: {
      supabaseId: "return-test-supabase-id",
      email: "return-test@gvswift.test",
      phone: "+919999911111",
      role: Role.USER,
    },
  });

  const otherUser = await prisma.user.upsert({
    where: { email: "return-other@gvswift.test" },
    update: {},
    create: {
      supabaseId: "return-other-supabase-id",
      email: "return-other@gvswift.test",
      phone: "+919999911112",
      role: Role.USER,
    },
  });

  // Create product + variant
  let product = await prisma.product.findFirst({ where: { slug: "return-test-product" } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: "Return Test Product",
        slug: "return-test-product",
        basePricePaise: 100000,
        isActive: true,
      },
    });
  }

  let variant = await prisma.productVariant.findFirst({ where: { sku: "RETURN-TEST-V1" } });
  if (!variant) {
    variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: "RETURN-TEST-V1",
        stock: 50,
        priceDeltaPaise: 0,
      },
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
        phone: "+919999911111",
      },
    });
    addressId = newAddr.id;
  }

  const orderIds: string[] = [];

  try {
    // Dynamic import of the service
    const { requestReturn } = await import("../src/features/orders/service");

    // ── Test 1: Return a DELIVERED order within return window ──
    console.log("\n📋 Test 1: Return a DELIVERED order within window");
    const order1 = await prisma.order.create({
      data: {
        userId: testUser.id,
        addressId,
        status: OrderStatus.DELIVERED,
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

    // Create the delivered status history row (simulating delivery just now)
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order1.id,
        fromStatus: OrderStatus.OUT_FOR_DELIVERY,
        toStatus: OrderStatus.DELIVERED,
        changedById: null, // system/admin action
        reason: "Delivered successfully",
      },
    });

    await requestReturn(testUser.id, order1.id, "Size doesn't fit");

    const updated1 = await prisma.order.findUnique({ where: { id: order1.id } });
    assert(updated1?.status === OrderStatus.RETURN_REQUESTED, "Order status is RETURN_REQUESTED");

    const history1 = await prisma.orderStatusHistory.findFirst({
      where: { orderId: order1.id, toStatus: OrderStatus.RETURN_REQUESTED },
    });
    assert(history1 !== null, "OrderStatusHistory row created for return request");
    assert(history1?.reason === "Size doesn't fit", "History reason matches");
    assert(history1?.changedById === testUser.id, "changedById is the customer");


    // ── Test 2: Expired return window ──
    console.log("\n📋 Test 2: Return window expired");
    const order2 = await prisma.order.create({
      data: {
        userId: testUser.id,
        addressId,
        status: OrderStatus.DELIVERED,
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

    // Create history entry 10 days ago (window default: 7 days)
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order2.id,
        fromStatus: OrderStatus.OUT_FOR_DELIVERY,
        toStatus: OrderStatus.DELIVERED,
        changedById: null,
        reason: "Delivered 10 days ago",
        createdAt: tenDaysAgo,
      },
    });

    try {
      await requestReturn(testUser.id, order2.id, "Changed my mind");
      assert(false, "Should have thrown for expired return window");
    } catch (err: unknown) {
      const error = err as { code?: string };
      assert(error.code === "VALIDATION_ERROR", "Correctly rejected: Return window expired");
    }


    // ── Test 3: Return on a non-DELIVERED order ──
    console.log("\n📋 Test 3: Return on a non-DELIVERED order (e.g. SHIPPED)");
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
      await requestReturn(testUser.id, order3.id, "Want a refund");
      assert(false, "Should have thrown for non-DELIVERED order");
    } catch (err: unknown) {
      const error = err as { code?: string };
      assert(error.code === "INVALID_TRANSITION", "Correctly rejected: INVALID_TRANSITION");
    }


    // ── Test 4: IDOR attempt ──
    console.log("\n📋 Test 4: IDOR attempt (wrong userId) → 404");
    const order4 = await prisma.order.create({
      data: {
        userId: testUser.id,
        addressId,
        status: OrderStatus.DELIVERED,
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

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order4.id,
        fromStatus: OrderStatus.OUT_FOR_DELIVERY,
        toStatus: OrderStatus.DELIVERED,
        changedById: null,
        reason: "Delivered",
      },
    });

    try {
      await requestReturn(otherUser.id, order4.id, "Return this");
      assert(false, "Should have thrown for wrong user");
    } catch (err: unknown) {
      const error = err as { code?: string; statusCode?: number };
      assert(error.code === "NOT_FOUND", "Returns NOT_FOUND (not FORBIDDEN)");
      assert(error.statusCode === 404, "Status code is 404");
    }


    // ── Test 5: Missing reason ──
    console.log("\n📋 Test 5: Missing reason → VALIDATION_ERROR");
    const order5 = await prisma.order.create({
      data: {
        userId: testUser.id,
        addressId,
        status: OrderStatus.DELIVERED,
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

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order5.id,
        fromStatus: OrderStatus.OUT_FOR_DELIVERY,
        toStatus: OrderStatus.DELIVERED,
        changedById: null,
        reason: "Delivered",
      },
    });

    try {
      await requestReturn(testUser.id, order5.id, "   ");
      assert(false, "Should have thrown for empty reason");
    } catch (err: unknown) {
      const error = err as { code?: string };
      assert(error.code === "VALIDATION_ERROR", "Returns VALIDATION_ERROR for empty reason");
    }


    // ── Test 6: Duplicate return request ──
    console.log("\n📋 Test 6: Duplicate return request → rejected");
    const order6 = await prisma.order.create({
      data: {
        userId: testUser.id,
        addressId,
        status: OrderStatus.DELIVERED,
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
    orderIds.push(order6.id);

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order6.id,
        fromStatus: OrderStatus.OUT_FOR_DELIVERY,
        toStatus: OrderStatus.DELIVERED,
        changedById: null,
        reason: "Delivered",
      },
    });

    // First request should succeed
    await requestReturn(testUser.id, order6.id, "Reason one");
    const afterFirst = await prisma.order.findUnique({ where: { id: order6.id } });
    assert(afterFirst?.status === OrderStatus.RETURN_REQUESTED, "First return request succeeded");

    // Second request should fail because status is now RETURN_REQUESTED (not DELIVERED)
    try {
      await requestReturn(testUser.id, order6.id, "Reason two");
      assert(false, "Should have thrown for duplicate return request");
    } catch (err: unknown) {
      const error = err as { code?: string };
      assert(error.code === "INVALID_TRANSITION", "Correctly rejected duplicate: INVALID_TRANSITION");
    }

  } finally {
    // Cleanup
    await cleanup(orderIds);
    await prisma.productVariant.deleteMany({ where: { sku: "RETURN-TEST-V1" } });
    await prisma.product.deleteMany({ where: { slug: "return-test-product" } });
    await prisma.address.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.deleteMany({ where: { email: { in: ["return-test@gvswift.test", "return-other@gvswift.test"] } } });
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
