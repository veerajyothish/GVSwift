/**
 * scratch/verify-admin-orders.ts — TICKET-305 Admin Order Management Tests
 *
 * Tests:
 *   1. Non-admin access to admin order PUT API → 403 Forbidden
 *   2. Filter and pagination functionality (listAdminOrders query helper)
 *   3. Admin status transition (PLACED -> CONFIRMED)
 *   4. Invalid transition rejection (PLACED -> DELIVERED)
 *   5. Manual override cancel requires reason (SHIPPED -> CANCELLED)
 *   6. Auto-cancel on stock check during confirmation
 *   7. Update fields (internalNotes, trackingReference) and verify audit log
 *
 * Run: npx tsx scratch/verify-admin-orders.ts
 */

import { PrismaClient, OrderStatus, Role } from "@prisma/client";
import { NextRequest } from "next/server";

// Set test environment
(process.env as any).NODE_ENV = "test";

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
  console.log("\n🧪 TICKET-305: Admin Order Management Tests\n");

  // ── Setup: create test admin user, standard user, product, variant, address ──
  const testAdmin = await prisma.user.upsert({
    where: { email: "admin-test@gvswift.test" },
    update: {},
    create: {
      supabaseId: "admin-test-supabase-id",
      email: "admin-test@gvswift.test",
      phone: "+919999922221",
      role: Role.ADMIN,
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: "user-test@gvswift.test" },
    update: {},
    create: {
      supabaseId: "user-test-supabase-id",
      email: "user-test@gvswift.test",
      phone: "+919999922222",
      role: Role.USER,
    },
  });

  // Create product + variant
  let product = await prisma.product.findFirst({ where: { slug: "admin-test-product" } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: "Admin Test Product",
        slug: "admin-test-product",
        basePricePaise: 100000,
        isActive: true,
      },
    });
  }

  let variant = await prisma.productVariant.findFirst({ where: { sku: "ADMIN-TEST-V1" } });
  if (!variant) {
    variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: "ADMIN-TEST-V1",
        stock: 10,
        priceDeltaPaise: 0,
      },
    });
  } else {
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: 10 },
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
        phone: "+919999922222",
      },
    });
    addressId = newAddr.id;
  }

  const orderIds: string[] = [];

  try {
    // Dynamic import of PUT API route and service helper
    const { PUT } = await import("../src/app/api/v1/admin/orders/[id]/route");
    const { listAdminOrders } = await import("../src/features/orders/service");

    // ── Test 1: Non-admin access rejected with 403 ──
    console.log("\n📋 Test 1: Non-admin access rejected with 403");
    
    // Create a temporary order to test the endpoint
    const tempOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        addressId,
        status: OrderStatus.PLACED,
        subtotalPaise: 100000,
        totalPaise: 100000,
      },
    });
    orderIds.push(tempOrder.id);

    // Mock global session as standard user (non-admin)
    (global as any).__mockAdminSession = testUser;

    const requestNonAdmin = new NextRequest(`http://localhost:3000/api/v1/admin/orders/${tempOrder.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: OrderStatus.CONFIRMED }),
    });

    const responseNonAdmin = await PUT(requestNonAdmin, { params: Promise.resolve({ id: tempOrder.id }) });
    assert(responseNonAdmin.status === 403, `Non-admin response status is 403 (got ${responseNonAdmin.status})`);
    
    const bodyNonAdmin = await responseNonAdmin.json();
    assert(bodyNonAdmin.code === "FORBIDDEN", "Error code is FORBIDDEN");


    // ── Test 2: Filter and pagination functionality ──
    console.log("\n📋 Test 2: listAdminOrders filter and pagination check");
    
    // Create multiple orders to test filtering
    const orderPl = await prisma.order.create({
      data: {
        userId: testUser.id,
        addressId,
        status: OrderStatus.PLACED,
        subtotalPaise: 100000,
        totalPaise: 100000,
      },
    });
    orderIds.push(orderPl.id);

    const orderSh = await prisma.order.create({
      data: {
        userId: testUser.id,
        addressId,
        status: OrderStatus.SHIPPED,
        subtotalPaise: 100000,
        totalPaise: 100000,
      },
    });
    orderIds.push(orderSh.id);

    // Query status = PLACED
    const listPlaced = await listAdminOrders({ status: "PLACED", page: 1, pageSize: 10 });
    const hasPl = listPlaced.orders.some((o) => o.id === orderPl.id);
    const hasSh = listPlaced.orders.some((o) => o.id === orderSh.id);
    assert(hasPl === true, "Query status: PLACED includes PLACED order");
    assert(hasSh === false, "Query status: PLACED excludes SHIPPED order");

    // Query search = user-test@gvswift.test (matching user email)
    const listUserSearch = await listAdminOrders({ userSearch: "user-test@gvswift.test" });
    const hasBoth = listUserSearch.orders.some((o) => o.id === orderPl.id) && listUserSearch.orders.some((o) => o.id === orderSh.id);
    assert(hasBoth === true, "Query search matches user email successfully");


    // ── Test 3: Admin status transition (PLACED -> CONFIRMED) ──
    console.log("\n📋 Test 3: Admin status transition PLACED -> CONFIRMED");
    
    // Set mock global session to admin
    (global as any).__mockAdminSession = testAdmin;

    const requestConfirm = new NextRequest(`http://localhost:3000/api/v1/admin/orders/${orderPl.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: OrderStatus.CONFIRMED }),
    });

    const responseConfirm = await PUT(requestConfirm, { params: Promise.resolve({ id: orderPl.id }) });
    assert(responseConfirm.status === 200, "Confirm response status is 200");

    const updatedPl = await prisma.order.findUnique({ where: { id: orderPl.id } });
    assert(updatedPl?.status === OrderStatus.CONFIRMED, "Order status transitioned to CONFIRMED");

    const confirmHistory = await prisma.orderStatusHistory.findFirst({
      where: { orderId: orderPl.id, toStatus: OrderStatus.CONFIRMED },
    });
    assert(confirmHistory !== null, "OrderStatusHistory entry created");
    assert(confirmHistory?.changedById === testAdmin.id, "changedById recorded admin user");


    // ── Test 4: Invalid transition rejection (PLACED -> DELIVERED) ──
    console.log("\n📋 Test 4: Invalid transition rejection (PLACED -> DELIVERED)");
    
    const orderPl2 = await prisma.order.create({
      data: {
        userId: testUser.id,
        addressId,
        status: OrderStatus.PLACED,
        subtotalPaise: 100000,
        totalPaise: 100000,
      },
    });
    orderIds.push(orderPl2.id);

    const requestInvalid = new NextRequest(`http://localhost:3000/api/v1/admin/orders/${orderPl2.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: OrderStatus.DELIVERED }),
    });

    const responseInvalid = await PUT(requestInvalid, { params: Promise.resolve({ id: orderPl2.id }) });
    assert(responseInvalid.status === 400, `Rejected response status is 400 (got ${responseInvalid.status})`);
    
    const bodyInvalid = await responseInvalid.json();
    assert(bodyInvalid.code === "INVALID_TRANSITION", "Error code is INVALID_TRANSITION");


    // ── Test 5: Manual override cancel requires reason (SHIPPED -> CANCELLED) ──
    console.log("\n📋 Test 5: Manual override cancel requires reason (SHIPPED -> CANCELLED)");

    // Attempt without reason
    const requestCancelNoReason = new NextRequest(`http://localhost:3000/api/v1/admin/orders/${orderSh.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: OrderStatus.CANCELLED }),
    });

    const responseCancelNoReason = await PUT(requestCancelNoReason, { params: Promise.resolve({ id: orderSh.id }) });
    assert(responseCancelNoReason.status === 400, "Missing reason rejected with 400");
    
    const bodyCancelNoReason = await responseCancelNoReason.json();
    assert(bodyCancelNoReason.code === "VALIDATION_ERROR", "Error code is VALIDATION_ERROR");

    // Attempt with reason
    const requestCancelWithReason = new NextRequest(`http://localhost:3000/api/v1/admin/orders/${orderSh.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: OrderStatus.CANCELLED, reason: "Goodwill override cancel" }),
    });

    const responseCancelWithReason = await PUT(requestCancelWithReason, { params: Promise.resolve({ id: orderSh.id }) });
    assert(responseCancelWithReason.status === 200, "Cancel override with reason succeeded (200)");

    const updatedSh = await prisma.order.findUnique({ where: { id: orderSh.id } });
    assert(updatedSh?.status === OrderStatus.CANCELLED, "Order status transitioned to CANCELLED");


    // ── Test 6: Auto-cancel on stock check during confirmation ──
    console.log("\n📋 Test 6: Auto-cancel on stock check during confirmation");

    // Create order PLACED with variant
    const orderPl3 = await prisma.order.create({
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
    orderIds.push(orderPl3.id);

    // Explicitly set variant stock to negative to trigger safety checks
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: -1 },
    });

    const requestConfirmStock = new NextRequest(`http://localhost:3000/api/v1/admin/orders/${orderPl3.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: OrderStatus.CONFIRMED }),
    });

    const responseConfirmStock = await PUT(requestConfirmStock, { params: Promise.resolve({ id: orderPl3.id }) });
    assert(responseConfirmStock.status === 200, "Response status is 200");

    const bodyConfirmStock = await responseConfirmStock.json();
    // The response returns the successfully transitioned order, but its status is CANCELLED!
    assert(bodyConfirmStock.order?.status === OrderStatus.CANCELLED, "Order auto-cancelled and status is CANCELLED");

    const historyStock = await prisma.orderStatusHistory.findFirst({
      where: { orderId: orderPl3.id, toStatus: OrderStatus.CANCELLED },
    });
    assert(historyStock !== null, "OrderStatusHistory row created");
    assert(historyStock?.changedById === null, "changedById is null (system auto-cancellation)");
    assert(historyStock?.reason === "Auto-cancelled: insufficient stock at confirmation", "Reason matches stock warning");


    // ── Test 7: Update fields (internalNotes, trackingReference) and verify audit log ──
    console.log("\n📋 Test 7: Update internalNotes, trackingReference, and verify audit log");

    const orderPl4 = await prisma.order.create({
      data: {
        userId: testUser.id,
        addressId,
        status: OrderStatus.SHIPPED, // set to shipped to allow trackingReference updates
        subtotalPaise: 100000,
        totalPaise: 100000,
      },
    });
    orderIds.push(orderPl4.id);

    const requestFields = new NextRequest(`http://localhost:3000/api/v1/admin/orders/${orderPl4.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        internalNotes: "Admin noted: client called to verify address.",
        trackingReference: "BlueDart AWB #9876543",
      }),
    });

    const responseFields = await PUT(requestFields, { params: Promise.resolve({ id: orderPl4.id }) });
    assert(responseFields.status === 200, "Update fields response status is 200");

    const updatedPl4 = await prisma.order.findUnique({ where: { id: orderPl4.id } });
    assert(updatedPl4?.internalNotes === "Admin noted: client called to verify address.", "internalNotes updated");
    assert(updatedPl4?.trackingReference === "BlueDart AWB #9876543", "trackingReference updated");

    // Verify audit log entry
    const audit = await prisma.auditLog.findFirst({
      where: { orderId: orderPl4.id, action: "ORDER_UPDATE" },
    });
    assert(audit !== null, "AuditLog entry for ORDER_UPDATE created");
    assert(audit?.actorId === testAdmin.id, "Audit actor ID is the admin user");

    const details = JSON.parse(audit?.details ?? "{}");
    assert(details.internalNotes !== undefined && details.trackingReference !== undefined, "Audit details serialised correctly");

  } finally {
    // Cleanup
    await cleanup(orderIds);
    await prisma.productVariant.deleteMany({ where: { sku: "ADMIN-TEST-V1" } });
    await prisma.product.deleteMany({ where: { slug: "admin-test-product" } });
    await prisma.address.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.deleteMany({ where: { email: { in: ["admin-test@gvswift.test", "user-test@gvswift.test"] } } });
    await prisma.$disconnect();
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error in test script:", err);
  process.exit(1);
});
