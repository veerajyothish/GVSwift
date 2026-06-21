/**
 * features/users/addresses.ts — Address Management Service
 *
 * TICKET-203: CRUD operations, default-address support, pincode validation,
 * strict ownership validation, and protected deletes when address is in use.
 */

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { CreateAddressSchema, UpdateAddressSchema } from "./validation";
import { lookupPincode } from "@/features/risk/service";

/**
 * Lists all addresses for a user, ordered by creation time (newest first).
 */
export async function listAddresses(userId: string) {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  return prisma.address.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Retrieves a single address by ID.
 * Enforces ownership: returns 404 if not found or belongs to another user.
 */
export async function getAddress(userId: string, addressId: string) {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address || address.userId !== userId) {
    throw new AppError("NOT_FOUND", "Address not found", 404);
  }

  return address;
}

/**
 * Creates a new address for the user.
 * Validates pincode serviceability at entry time.
 * Enforces default selection constraints.
 */
export async function createAddress(userId: string, data: unknown) {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  const parsed = CreateAddressSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid address data",
      400
    );
  }

  const addressData = parsed.data;

  // Validate pincode serviceability
  const riskResult = await lookupPincode(addressData.pincode);
  if (!riskResult.serviceable) {
    throw new AppError("VALIDATION_ERROR", "We don't currently ship to this pincode.", 400);
  }

  const existingCount = await prisma.address.count({
    where: { userId },
  });

  // First address automatically becomes default
  const shouldBeDefault = existingCount === 0 || addressData.isDefault;

  return prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      // Set all other addresses for this user to isDefault = false
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        ...addressData,
        userId,
        isDefault: shouldBeDefault,
      },
    });
  });
}

/**
 * Updates an existing address.
 * Enforces ownership (throws 404 if IDOR attempt).
 * Validates pincode serviceability if changed.
 * Enforces default selection constraints.
 */
export async function updateAddress(userId: string, addressId: string, data: unknown) {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  const existing = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!existing || existing.userId !== userId) {
    throw new AppError("NOT_FOUND", "Address not found", 404);
  }

  const parsed = UpdateAddressSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid address data",
      400
    );
  }

  const addressData = parsed.data;

  // Validate pincode serviceability if pincode is being updated and has changed
  if (addressData.pincode && addressData.pincode !== existing.pincode) {
    const riskResult = await lookupPincode(addressData.pincode);
    if (!riskResult.serviceable) {
      throw new AppError("VALIDATION_ERROR", "We don't currently ship to this pincode.", 400);
    }
  }

  // Handle default transitions
  if (addressData.isDefault === true) {
    return prisma.$transaction(async (tx) => {
      // Clear other defaults
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id: addressId },
        data: {
          ...addressData,
          isDefault: true,
        },
      });
    });
  }

  // If the user tries to toggle the default address to false, check if they have others
  if (existing.isDefault && addressData.isDefault === false) {
    const otherAddress = await prisma.address.findFirst({
      where: { userId, id: { not: addressId } },
      orderBy: { createdAt: "desc" },
    });

    if (otherAddress) {
      return prisma.$transaction(async (tx) => {
        // Set the other address as default
        await tx.address.update({
          where: { id: otherAddress.id },
          data: { isDefault: true },
        });

        return tx.address.update({
          where: { id: addressId },
          data: {
            ...addressData,
            isDefault: false,
          },
        });
      });
    } else {
      // It's the only address, it must remain default
      return prisma.address.update({
        where: { id: addressId },
        data: {
          ...addressData,
          isDefault: true,
        },
      });
    }
  }

  // Standard update without default changes
  return prisma.address.update({
    where: { id: addressId },
    data: addressData,
  });
}

/**
 * Deletes an address.
 * Enforces ownership (throws 404 if IDOR attempt).
 * Gracefully blocks deletion if referenced by past orders.
 * Automatically promotes another address to default if the deleted one was default.
 */
export async function deleteAddress(userId: string, addressId: string) {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  const existing = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!existing || existing.userId !== userId) {
    throw new AppError("NOT_FOUND", "Address not found", 404);
  }

  // Pre-emptive check: is it referenced by any orders?
  const orderCount = await prisma.order.count({
    where: { addressId },
  });

  if (orderCount > 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      "This address is used in a past order and can't be deleted",
      400
    );
  }

  return prisma.$transaction(async (tx) => {
    // Re-verify the address inside transaction
    const toDelete = await tx.address.findUnique({
      where: { id: addressId },
    });

    if (!toDelete) {
      throw new AppError("NOT_FOUND", "Address not found", 404);
    }

    const wasDefault = toDelete.isDefault;

    try {
      await tx.address.delete({
        where: { id: addressId },
      });
    } catch (err: any) {
      // Handle db constraints if any race condition occurred
      if (err.code === "P2003") {
        throw new AppError(
          "VALIDATION_ERROR",
          "This address is used in a past order and can't be deleted",
          400
        );
      }
      throw err;
    }

    // If we deleted the default address, automatically promote the most recently created address to default
    if (wasDefault) {
      const nextDefault = await tx.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (nextDefault) {
        await tx.address.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }
  });
}
