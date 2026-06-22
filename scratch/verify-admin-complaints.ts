/**
 * scratch/verify-admin-complaints.ts — TICKET-402 Admin Complaints Verification Tests
 *
 * Run with: npx tsx scratch/verify-admin-complaints.ts
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
  console.log("\n🧪 TICKET-402: Admin Complaints Management Verification Tests\n");

  (process.env as any).NODE_ENV = "test";

  // ── Setup: Create test customer and admin users ──
  const customer = await prisma.user.upsert({
    where: { email: "customer-complaints@gvswift.test" },
    update: {},
    create: {
      supabaseId: "customer-complaints-supabase-id",
      email: "customer-complaints@gvswift.test",
      phone: "+919999933331",
      role: Role.USER,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin-complaints@gvswift.test" },
    update: {},
    create: {
      supabaseId: "admin-complaints-supabase-id",
      email: "admin-complaints@gvswift.test",
      phone: "+919999933332",
      role: Role.ADMIN,
    },
  });

  const {
    listAllTickets,
    getTicketDetail,
    addAdminReply,
    updateTicketStatus,
  } = await import("../src/features/support/admin-service");

  const {
    getOwnTicketDetail,
  } = await import("../src/features/support/service");

  // Create a support ticket to test with
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: customer.id,
      subject: "Broken packaging",
      description: "Box arrived completely crushed.",
      status: TicketStatus.OPEN,
    },
  });

  try {
    // ── Test 1: Admin Listing all tickets (no filter) ──
    console.log("\n📋 Test 1: List all tickets (no filters)");
    const allTickets = await listAllTickets();
    const testTicket = allTickets.find((t) => t.id === ticket.id);
    assert(!!testTicket, "Newly created ticket exists in admin list");
    assert(testTicket?.user?.email === "customer-complaints@gvswift.test", "Customer email is loaded via user relation");

    // ── Test 2: Admin Listing filtered by status ──
    console.log("\n📋 Test 2: List tickets filtered by status");
    const openTickets = await listAllTickets({ status: TicketStatus.OPEN });
    const resolvedTickets = await listAllTickets({ status: TicketStatus.RESOLVED });

    assert(openTickets.some((t) => t.id === ticket.id), "Ticket is returned under OPEN filter");
    assert(!resolvedTickets.some((t) => t.id === ticket.id), "Ticket is NOT returned under RESOLVED filter");

    // ── Test 3: Get Ticket Detail ──
    console.log("\n📋 Test 3: Get ticket detail with customer info");
    const detail = await getTicketDetail(ticket.id);
    assert(detail.id === ticket.id, "Correct ticket retrieved");
    assert(detail.user?.email === "customer-complaints@gvswift.test", "User details included in detail");

    // ── Test 4: Add Admin Public Reply and Internal Note ──
    console.log("\n📋 Test 4: Add admin reply & internal note");

    const reply1 = await addAdminReply(admin.id, ticket.id, "We are looking into this.", false);
    assert(reply1.message === "We are looking into this.", "Reply text matches");
    assert(reply1.isInternal === false, "Public reply is flag isInternal = false");
    assert(reply1.authorId === admin.id, "Author ID matches admin ID");

    const note1 = await addAdminReply(admin.id, ticket.id, "Checking log database history.", true);
    assert(note1.message === "Checking log database history.", "Internal note text matches");
    assert(note1.isInternal === true, "Internal note is flag isInternal = true");
    assert(note1.authorId === admin.id, "Author ID matches admin ID");

    // ── Test 5: Verify getTicketDetail fetches ALL messages ──
    console.log("\n📋 Test 5: Fetch ticket detail with all replies & internal notes");
    const detailWithMessages = await getTicketDetail(ticket.id);
    assert(detailWithMessages.messages.length === 2, "Fetched both messages (public + internal)");
    assert(detailWithMessages.messages[0].message === "We are looking into this.", "First message is the public reply");
    assert(detailWithMessages.messages[1].message === "Checking log database history.", "Second message is the internal note");

    // ── Test 6: Verify Privacy - Internal note does not leak to customer ──
    console.log("\n📋 Test 6: Privacy check - getOwnTicketDetail hides internal notes");
    const customerDetail = await getOwnTicketDetail(customer.id, ticket.id);
    assert(customerDetail.messages.length === 1, "Customer only sees 1 message (hides internal note)");
    assert(customerDetail.messages[0].message === "We are looking into this.", "Customer message list contains only the public reply");
    assert(customerDetail.messages.every((m) => m.isInternal === false), "All returned messages have isInternal = false");

    // ── Test 7: Update Ticket Status ──
    console.log("\n📋 Test 7: Update ticket status");
    const updated = await updateTicketStatus(admin.id, ticket.id, TicketStatus.IN_PROGRESS);
    assert(updated.status === TicketStatus.IN_PROGRESS, "Status updated to IN_PROGRESS");

    const checkedDetail = await getTicketDetail(ticket.id);
    assert(checkedDetail.status === TicketStatus.IN_PROGRESS, "Database reflects updated status IN_PROGRESS");

    // Invalid ticket ID error check
    try {
      await getTicketDetail("not-a-uuid");
      assert(false, "Should throw for invalid UUID format");
    } catch (err) {
      assert(err instanceof AppError && err.code === "NOT_FOUND", "Returns NOT_FOUND (404) for invalid UUID");
    }

    try {
      await updateTicketStatus(admin.id, "00000000-0000-0000-0000-000000000000", TicketStatus.CLOSED);
      assert(false, "Should throw for non-existent ticket");
    } catch (err) {
      assert(err instanceof AppError && err.code === "NOT_FOUND", "Returns NOT_FOUND (404) for non-existent ticket ID");
    }

    // ── Test 8: HTML / script tags stored verbatim (plain text) ──
    console.log("\n📋 Test 8: Admin message XSS tags stored verbatim");
    const xssText = "<script>alert('admin-xss')</script>";
    const xssReply = await addAdminReply(admin.id, ticket.id, xssText, false);
    assert(xssReply.message === xssText, "HTML/script tags preserved exactly in database");

  } finally {
    // ── Cleanup ──
    console.log("\n🧹 Cleaning up test database records...");

    await prisma.ticketMessage.deleteMany({
      where: {
        ticketId: ticket.id,
      },
    });

    await prisma.supportTicket.deleteMany({
      where: {
        id: ticket.id,
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: [customer.id, admin.id] },
      },
    });

    await prisma.$disconnect();
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Admin Complaints Results: ${passed} passed, ${failed} failed`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
