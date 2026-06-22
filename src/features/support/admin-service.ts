/**
 * features/support/admin-service.ts — Administrative Ticket Business Logic
 *
 * Implements TICKET-402 admin operations including ticket listing, detailed view,
 * admin-only notes, and ticket status changes.
 */

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { TicketStatus, SupportTicket, TicketMessage } from "@prisma/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

export interface TicketListFilters {
  status?: TicketStatus;
}

/**
 * Lists all support tickets.
 * Optionally filters by status.
 * Ordered by updatedAt DESC (last updated first).
 * Includes associated customer User and linked Order details.
 */
export async function listAllTickets(filters?: TicketListFilters) {
  const where: { status?: TicketStatus } = {};
  
  if (filters?.status) {
    where.status = filters.status;
  }

  return prisma.supportTicket.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
        },
      },
      order: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

/**
 * Fetches a single support ticket's detail including ALL messages
 * (both customer replies and internal notes), ordered by createdAt ASC.
 * Includes customer User and linked Order details.
 * Throws NOT_FOUND if ticket ID is invalid or ticket does not exist.
 */
export async function getTicketDetail(ticketId: string) {
  if (!ticketId || !isUuid(ticketId)) {
    throw new AppError("NOT_FOUND", "Ticket not found", 404);
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
        },
      },
      order: {
        select: {
          id: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!ticket) {
    throw new AppError("NOT_FOUND", "Ticket not found", 404);
  }

  return ticket;
}

/**
 * Adds an admin reply (customer-visible reply or internal note) to a ticket.
 * Touches parent ticket's updatedAt.
 * Throws NOT_FOUND if ticket doesn't exist.
 */
export async function addAdminReply(
  adminId: string,
  ticketId: string,
  messageText: string,
  isInternal: boolean
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

  // 1. Fetch ticket to verify existence
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new AppError("NOT_FOUND", "Ticket not found", 404);
  }

  // 2. Create message and update parent ticket updatedAt in a transaction
  const [createdMessage] = await prisma.$transaction([
    prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId: adminId,
        message,
        isInternal,
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return createdMessage;
}

/**
 * Updates a ticket's status and touches parent ticket's updatedAt.
 * Throws NOT_FOUND if ticket doesn't exist.
 */
export async function updateTicketStatus(
  adminId: string, // included for audit trail, though status change is on ticket model
  ticketId: string,
  status: TicketStatus
): Promise<SupportTicket> {
  if (!ticketId || !isUuid(ticketId)) {
    throw new AppError("NOT_FOUND", "Ticket not found", 404);
  }

  // 1. Verify existence
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new AppError("NOT_FOUND", "Ticket not found", 404);
  }

  // 2. Perform update
  return prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      updatedAt: new Date(),
    },
  });
}
