/**
 * features/support/service.ts — Support Ticket Business Logic Service
 *
 * Implements TICKET-401 support operations with strict ownership enforcement,
 * rate limiting on creation, terminal-status check for customer replies,
 * and plain-text requirements.
 *
 * Note on SSR-only decision:
 * `listOwnTickets` and `getOwnTicketDetail` are consumed directly within Next.js
 * Server Components (SSR) for `/support` and `/support/[ticketId]`. Since Server
 * Components can query the database directly, public GET API routes for these
 * functions are omitted to keep the API surface area secure and minimized.
 */

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { TicketStatus, SupportTicket, TicketMessage } from "@prisma/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

export interface SupportTicketWithMessages extends SupportTicket {
  messages: TicketMessage[];
}

/**
 * Creates a new support ticket for a user.
 * Enforces rate limiting at 10 tickets per hour.
 * Enforces orderId format and ownership check in a single query.
 */
export async function createTicket(
  userId: string,
  data: {
    subject: string;
    description?: string;
    orderId?: string;
  }
): Promise<SupportTicket> {
  const subject = data.subject?.trim();
  const description = data.description?.trim();
  const orderId = data.orderId?.trim();

  // 1. Basic validation
  if (!subject) {
    throw new AppError("VALIDATION_ERROR", "Subject is required.", 400);
  }

  // Description length validation (max 5000)
  if (description && description.length > 5000) {
    throw new AppError("VALIDATION_ERROR", "Description cannot exceed 5000 characters.", 400);
  }

  // 2. Order ID ownership validation (single query check, throws VALIDATION_ERROR on mismatch)
  if (orderId) {
    if (!isUuid(orderId)) {
      throw new AppError("VALIDATION_ERROR", "Invalid order ID format.", 400);
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
    });

    if (!order) {
      throw new AppError("VALIDATION_ERROR", "Order not found or access denied.", 400);
    }
  }

  // 3. Rate limiting check (10 tickets per hour per user)
  // ponytail: native database count check, resolving in-memory/stateless sync issues
  const oneHourAgo = new Date(Date.now() - 3600 * 1000);
  const hourTicketsCount = await prisma.supportTicket.count({
    where: {
      userId,
      createdAt: {
        gte: oneHourAgo,
      },
    },
  });

  if (hourTicketsCount >= 10) {
    throw new AppError(
      "RATE_LIMITED",
      "Too many support tickets created. Please try again later.",
      429
    );
  }

  // 4. Create support ticket
  return prisma.supportTicket.create({
    data: {
      userId,
      orderId: orderId || null,
      subject,
      description: description || null,
      status: TicketStatus.OPEN,
    },
  });
}

/**
 * Returns a list of support tickets belonging to the authenticated user.
 * Ordered by createdAt DESC (newest first).
 */
export async function listOwnTickets(userId: string): Promise<SupportTicket[]> {
  return prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Returns the ticket details with customer-visible messages (isInternal = false).
 * Throws NOT_FOUND (404) on IDOR/non-existence to prevent leakage.
 */
export async function getOwnTicketDetail(
  userId: string,
  ticketId: string
): Promise<SupportTicketWithMessages> {
  if (!ticketId || !isUuid(ticketId)) {
    throw new AppError("NOT_FOUND", "Ticket not found", 404);
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket || ticket.userId !== userId) {
    throw new AppError("NOT_FOUND", "Ticket not found", 404);
  }

  return ticket;
}

/**
 * Appends a new message from the customer to the ticket thread.
 * Rejects if the ticket is CLOSED or RESOLVED.
 * Updates ticket's updatedAt field.
 */
export async function addCustomerMessage(
  userId: string,
  ticketId: string,
  messageText: string
): Promise<TicketMessage> {
  const message = messageText?.trim();

  if (!message) {
    throw new AppError("VALIDATION_ERROR", "Message cannot be empty.", 400);
  }

  if (message.length > 5000) {
    throw new AppError("VALIDATION_ERROR", "Message cannot exceed 5000 characters.", 400);
  }

  if (!ticketId || !isUuid(ticketId)) {
    throw new AppError("NOT_FOUND", "Ticket not found", 404);
  }

  // 1. Fetch ticket and verify ownership
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket || ticket.userId !== userId) {
    throw new AppError("NOT_FOUND", "Ticket not found", 404);
  }

  // 2. Reject replies on CLOSED / RESOLVED tickets
  if (ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.RESOLVED) {
    throw new AppError("VALIDATION_ERROR", "Cannot reply to a resolved or closed ticket.", 400);
  }

  // 3. Create message and touch ticket in a transaction
  const [createdMessage] = await prisma.$transaction([
    prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId: userId,
        message,
        isInternal: false,
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return createdMessage;
}
