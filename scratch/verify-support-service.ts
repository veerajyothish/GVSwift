
/**
 * scratch/verify-support-service.ts — TICKET-401 Support Tickets Verification Tests
 *
 * Run with: npx tsx scratch/verify-support-service.ts
 */

import { PrismaClient, Role, TicketStatus } from "@prisma/client";
import { AppError } from "../src/lib/errors";

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

async function main() {
  console.log("\n🧪 TICKET-401: Customer Support Tickets Verification Tests\n");

  (process.env as any).NODE_ENV = "test";

  // ── Setup: Create test users and order ──
  const customer1 = await prisma.user.upsert({
    where: { email: "customer1@gvswift.test" },
    update: {},
    create: {
      supabaseId: "customer1-supabase-id",
      email: "customer1@gvswift.test",
      phone: "+919999922221",
      role: Role.USER,
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: "customer2@gvswift.test" },
    update: {},
    create: {
      supabaseId: "customer2-supabase-id",
      email: "customer2@gvswift.test",
      phone: "+919999922222",
      role: Role.USER,
    },
  });

  // Create a product/variant & address to mock a valid order
  let product = await prisma.product.findFirst({ where: { slug: "support-test-product" } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: "Support Test Product",
        slug: "support-test-product",
        basePricePaise: 100000,
        isActive: true,
      },
    });
  }

  let variant = await prisma.productVariant.findFirst({ where: { sku: "SUPPORT-TEST-V1" } });
  if (!variant) {
    variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: "SUPPORT-TEST-V1",
        stock: 10,
        priceDeltaPaise: 0,
      },
    });
  }

  let address = await prisma.address.findFirst({ where: { userId: customer1.id } });
  if (!address) {
    address = await prisma.address.create({
      data: {
        userId: customer1.id,
        fullName: "Customer One",
        line1: "123 Support Lane",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500001",
        phone: "+919999922221",
      },
    });
  }

  // Create order for Customer 1
  const order1 = await prisma.order.create({
    data: {
      userId: customer1.id,
      addressId: address.id,
      status: "PLACED",
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

  const {
    createTicket,
    listOwnTickets,
    getOwnTicketDetail,
    addCustomerMessage,
  } = await import("../src/features/support/service");

  try {
    // ── Test 1: Ticket Creation with valid details ──
    console.log("\n📋 Test 1: Create Ticket with valid data");
    const ticket1 = await createTicket(customer1.id, {
      subject: "Faulty product",
      description: "My item arrived damaged.",
      orderId: order1.id,
    });
    assert(ticket1.subject === "Faulty product", "Ticket subject saved correctly");
    assert(ticket1.description === "My item arrived damaged.", "Ticket description saved correctly");
    assert(ticket1.orderId === order1.id, "Ticket linked to order ID");
    assert(ticket1.status === "OPEN", "Initial ticket status is OPEN");

    // ── Test 1.1: Subject length cap matching Prisma schema (not limited to 5000 chars) ──
    console.log("\n📋 Test 1.1: Create Ticket with long subject (unbounded subject length check)");
    const longSubject = "A".repeat(5005);
    const ticketLongSubject = await createTicket(customer1.id, {
      subject: longSubject,
      description: "Short description",
    });
    assert(ticketLongSubject.subject === longSubject, "Successfully allowed subject over 5000 characters");

    // ── Test 2: Validation Errors ──
    console.log("\n📋 Test 2: Create Ticket validation checks");

    // Empty subject
    try {
      await createTicket(customer1.id, { subject: "   ", description: "Empty subject" });
      assert(false, "Should have thrown for empty subject");
    } catch (err) {
      assert(err instanceof AppError && err.code === "VALIDATION_ERROR", "Correctly rejected empty subject");
    }

    // Description > 5000 characters
    try {
      await createTicket(customer1.id, { subject: "Test subject", description: "B".repeat(5001) });
      assert(false, "Should have thrown for oversized description");
    } catch (err) {
      assert(err instanceof AppError && err.code === "VALIDATION_ERROR", "Correctly rejected description > 5000 chars");
    }

    // Invalid order ID format
    try {
      await createTicket(customer1.id, { subject: "Test subject", orderId: "not-a-uuid" });
      assert(false, "Should have thrown for non-UUID orderId");
    } catch (err) {
      assert(err instanceof AppError && err.code === "VALIDATION_ERROR", "Correctly rejected non-UUID order ID");
    }

    // Order belonging to someone else (throws VALIDATION_ERROR per user's request, not NOT_FOUND)
    try {
      await createTicket(customer2.id, { subject: "IDOR test subject", orderId: order1.id });
      assert(false, "Should have thrown for order belonging to another user");
    } catch (err) {
      assert(
        err instanceof AppError && err.code === "VALIDATION_ERROR",
        "Correctly rejected order ownership mismatch with VALIDATION_ERROR (not NOT_FOUND)"
      );
    }

    // ── Test 3: Rate Limiting ──
    console.log("\n📋 Test 3: Create Ticket rate limiting check");
    (global as any).__mockRateLimit = { success: false, remaining: 0, resetAt: new Date() };

    try {
      await createTicket(customer1.id, { subject: "Throttled ticket" });
      assert(false, "Should have thrown RATE_LIMITED error");
    } catch (err) {
      assert(
        err instanceof AppError && err.code === "RATE_LIMITED" && err.statusCode === 429,
        "Correctly rejected with 429 RATE_LIMITED"
      );
    }

    (global as any).__mockRateLimit = undefined; // Reset mock

    // ── Test 4: List Own Tickets ──
    console.log("\n📋 Test 4: List own tickets");
    const ticketsC1 = await listOwnTickets(customer1.id);
    const ticketsC2 = await listOwnTickets(customer2.id);
    assert(ticketsC1.length >= 2, "Returned customer1's tickets");
    assert(ticketsC2.length === 0, "Returned zero tickets for customer2");

    // ── Test 5: Fetch Own Ticket Detail (IDOR protection) ──
    console.log("\n📋 Test 5: Fetch ticket detail & IDOR protection");
    const details = await getOwnTicketDetail(customer1.id, ticket1.id);
    assert(details.id === ticket1.id, "Successfully fetched own ticket details");

    try {
      await getOwnTicketDetail(customer2.id, ticket1.id);
      assert(false, "Should have thrown for IDOR on fetch ticket detail");
    } catch (err) {
      assert(err instanceof AppError && err.code === "NOT_FOUND", "Returns NOT_FOUND (404) for IDOR fetch");
    }

    // ── Test 5.1: Internal messages hidden from customer ──
    console.log("\n📋 Test 5.1: Exclude internal messages from customer fetching");
    // Seed messages on ticket1
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket1.id,
        authorId: null, // Admin
        message: "This is a public support reply.",
        isInternal: false,
      },
    });

    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket1.id,
        authorId: null, // Admin
        message: "This is an internal staff note.",
        isInternal: true,
      },
    });

    const refreshedDetails = await getOwnTicketDetail(customer1.id, ticket1.id);
    assert(refreshedDetails.messages.length === 1, "Only returned 1 message (isInternal = false)");
    assert(refreshedDetails.messages[0].message === "This is a public support reply.", "Message content matches");

    // ── Test 6: Add Customer Message ──
    console.log("\n📋 Test 6: Add Customer Message & ownership checks");
    const initialUpdatedAt = refreshedDetails.updatedAt;

    // Wait slightly to guarantee timestamp change
    await new Promise((resolve) => setTimeout(resolve, 50));

    const replyMsg = await addCustomerMessage(customer1.id, ticket1.id, "Please hurry up.");
    assert(replyMsg.message === "Please hurry up.", "Message added successfully");
    assert(replyMsg.isInternal === false, "Customer replies are always non-internal");

    const updatedTicket = await prisma.supportTicket.findUnique({ where: { id: ticket1.id } });
    assert(
      updatedTicket!.updatedAt.getTime() > initialUpdatedAt.getTime(),
      "Adding a message touched the ticket updatedAt field"
    );

    // Reply IDOR
    try {
      await addCustomerMessage(customer2.id, ticket1.id, "Sneaky reply");
      assert(false, "Should have rejected message addition from non-owner");
    } catch (err) {
      assert(err instanceof AppError && err.code === "NOT_FOUND", "Returns NOT_FOUND (404) for IDOR replies");
    }

    // Oversized message
    try {
      await addCustomerMessage(customer1.id, ticket1.id, "C".repeat(5001));
      assert(false, "Should have rejected message > 5000 characters");
    } catch (err) {
      assert(err instanceof AppError && err.code === "VALIDATION_ERROR", "Correctly rejected oversized message");
    }

    // ── Test 6.1: Terminal status check on customer replies ──
    console.log("\n📋 Test 6.1: Reject customer messages on terminal statuses");
    // Resolved status
    await prisma.supportTicket.update({
      where: { id: ticket1.id },
      data: { status: TicketStatus.RESOLVED },
    });

    try {
      await addCustomerMessage(customer1.id, ticket1.id, "One more reply");
      assert(false, "Should have rejected message on RESOLVED ticket");
    } catch (err) {
      assert(
        err instanceof AppError && err.code === "VALIDATION_ERROR",
        "Correctly rejected message reply on RESOLVED ticket"
      );
    }

    // Closed status
    await prisma.supportTicket.update({
      where: { id: ticket1.id },
      data: { status: TicketStatus.CLOSED },
    });

    try {
      await addCustomerMessage(customer1.id, ticket1.id, "One more reply");
      assert(false, "Should have rejected message on CLOSED ticket");
    } catch (err) {
      assert(
        err instanceof AppError && err.code === "VALIDATION_ERROR",
        "Correctly rejected message reply on CLOSED ticket"
      );
    }

    // ── Test 7: No-XSS / Plain Text verbatim storage ──
    console.log("\n📋 Test 7: HTML / script tags stored verbatim");
    const xssPayload = "<script>alert('xss')</script> & <html>";
    const xssTicket = await createTicket(customer1.id, {
      subject: xssPayload,
      description: xssPayload,
    });

    assert(xssTicket.subject === xssPayload, "Script payload saved verbatim in subject");
    assert(xssTicket.description === xssPayload, "Script payload saved verbatim in description");

  } finally {
    // ── Cleanup ──
    console.log("\n🧹 Cleaning up test database records...");
    const ticketsToDelete = await prisma.supportTicket.findMany({
      where: {
        userId: { in: [customer1.id, customer2.id] },
      },
      select: { id: true },
    });
    const ticketIds = ticketsToDelete.map((t) => t.id);

    await prisma.ticketMessage.deleteMany({
      where: {
        ticketId: { in: ticketIds },
      },
    });

    await prisma.supportTicket.deleteMany({
      where: {
        id: { in: ticketIds },
      },
    });

    const ordersToDelete = await prisma.order.findMany({
      where: {
        userId: { in: [customer1.id, customer2.id] },
      },
      select: { id: true },
    });
    const orderIds = ordersToDelete.map((o) => o.id);

    await prisma.orderItem.deleteMany({
      where: {
        orderId: { in: orderIds },
      },
    });

    await prisma.orderStatusHistory.deleteMany({
      where: {
        orderId: { in: orderIds },
      },
    });

    await prisma.order.deleteMany({
      where: {
        id: { in: orderIds },
      },
    });

    await prisma.address.deleteMany({
      where: {
        userId: { in: [customer1.id, customer2.id] },
      },
    });

    await prisma.user.deleteMany({
      where: { id: { in: [customer1.id, customer2.id] } },
    });

    await prisma.$disconnect();
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Support Service Results: ${passed} passed, ${failed} failed`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
