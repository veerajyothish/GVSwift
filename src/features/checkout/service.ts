/**
 * features/checkout/service.ts — Checkout Orchestration Service
 *
 * TICKET-204: Atomic order creation with pessimistic row-locking,
 * idempotency handling, and full COD eligibility validation.
 *
 * Transaction design (Database Design Document §4):
 *   BEGIN
 *     SELECT stock FROM "ProductVariant" WHERE id = $id FOR UPDATE  -- row-locks variant
 *     IF stock < quantity → ROLLBACK "out of stock"
 *     UPDATE "ProductVariant" SET stock = stock - qty WHERE id = $id
 *     INSERT "Order" (...)
 *     INSERT "OrderItem" per line item (unit price snapshot)
 *     INSERT "OrderStatusHistory" (fromStatus: null, toStatus: PLACED, changedById: null)
 *   COMMIT
 *
 * COD eligibility (Operations §2, Database Design §2.2):
 *   - No RiskFlag row for pincode → not serviceable → reject
 *   - BLOCKED on any entity (pincode/phone/address/user) → COD_NOT_ELIGIBLE
 *   - HIGH on any entity → order created but requiresApproval = true
 *   - LOW / MEDIUM → normal checkout
 *
 * Idempotency:
 *   - If idempotencyKey already exists on an Order → return that order immediately
 *   - Unique DB constraint on idempotencyKey is the last-line safety net for races
 */

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { CheckoutInputSchema } from "./validation";
import type { CheckoutResult } from "./types";
import {
  lookupPincode,
  lookupPhone,
  lookupAddress,
  lookupUser,
  createRiskFlag,
  getRiskFlagByEntity,
} from "@/features/risk/service";
import { getCodLimitPaise } from "@/features/settings/service";
import { sendOrderPlacedEmail } from "@/features/notifications/service";
import { RiskEntityType, RiskLevel, PaymentMethod } from "@prisma/client";
import {
  getOrCreateLoyaltyAccount,
  awardPoints,
  getLoyaltySettings,
} from "@/lib/loyalty";

/* ── helpers ──────────────────────────────────────────────────────────── */

/** Format paise as a human-readable rupee string for error messages */
function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

/* ── Main service function ────────────────────────────────────────────── */

/**
 * Creates an order from the user's cart.
 *
 * All pre-flight checks (ownership, serviceability, COD eligibility, COD limit)
 * happen outside the transaction. The transaction itself only does stock locking,
 * stock deduction, and row insertion — keeping the critical section short.
 *
 * @param userId - Authenticated session user ID (from requireUser)
 * @param rawInput - Unvalidated body from the API route
 * @returns CheckoutResult with the order and whether it requires admin approval
 */
export async function createOrder(
  userId: string,
  rawInput: unknown
): Promise<CheckoutResult> {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  // ── 1. Validate input ──────────────────────────────────────────────────
  const parsed = CheckoutInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid checkout data",
      400
    );
  }
  const { cartId, addressId, idempotencyKey, paymentMethod, couponCode, pointsToRedeem } = parsed.data;

  // ── 2. Idempotency check ───────────────────────────────────────────────
  // If this key was already used, return the original order immediately.
  // This handles double-clicks, retries, and network errors on the client.
  const existingOrder = await prisma.order.findUnique({
    where: { idempotencyKey },
    include: {
      user: { select: { email: true, name: true } },
      address: true,
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
  });
  if (existingOrder) {
    // Ownership check — only the original user can retrieve it by idempotency key
    if (existingOrder.userId !== userId) {
      throw new AppError("NOT_FOUND", "Order not found", 404);
    }
    return {
      order: existingOrder as CheckoutResult["order"],
      requiresApproval: false, // Don't re-derive approval status; order already committed
      wasIdempotent: true,
    };
  }

  // ── 3. Resolve and verify cart ownership ──────────────────────────────
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, basePricePaise: true, isActive: true },
          },
          variant: {
            select: { id: true, stock: true, priceDeltaPaise: true },
          },
        },
      },
    },
  });

  if (!cart || cart.userId !== userId) {
    throw new AppError("NOT_FOUND", "Cart not found", 404);
  }

  if (cart.items.length === 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Your cart is empty. Add items before checking out.",
      400
    );
  }

  // Guard: all products must be active and have a variant
  for (const item of cart.items) {
    if (!item.product.isActive) {
      throw new AppError(
        "VALIDATION_ERROR",
        `"${item.product.name}" is no longer available. Please remove it from your cart.`,
        400
      );
    }
    if (!item.variant) {
      throw new AppError(
        "VALIDATION_ERROR",
        `A variant for "${item.product.name}" could not be found. Please update your cart.`,
        400
      );
    }
  }

  // ── 4. Resolve and verify address ownership ────────────────────────────
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address || address.userId !== userId) {
    throw new AppError("NOT_FOUND", "Address not found", 404);
  }

  // ── 5. Pincode serviceability check ────────────────────────────────────
  // Absence of a RiskFlag row for a pincode = "not serviceable" (Design Doc §2.2)
  const pincodeRisk = await lookupPincode(address.pincode);
  if (!pincodeRisk.serviceable) {
    throw new AppError(
      "VALIDATION_ERROR",
      `We don't currently ship to pincode ${address.pincode}. Please use a different address.`,
      400
    );
  }

  // ── 6. COD eligibility — all four entity types ─────────────────────────
  // pincodeRisk already fetched; run the other three in parallel.
  const [phoneRisk, addressRisk, userRisk] = await Promise.all([
    lookupPhone(address.phone),
    lookupAddress(address.id),     // ADDRESS entity value = address UUID
    lookupUser(userId),            // USER entity value = user UUID
  ]);

  const riskChecks = [
    { result: pincodeRisk, label: "pincode" },
    { result: phoneRisk,   label: "phone number" },
    { result: addressRisk, label: "address" },
    { result: userRisk,    label: "account" },
  ];

  let requiresApproval = false;

  for (const { result, label } of riskChecks) {
    // BLOCKED = COD specifically disabled for this entity
    if (result.found && result.riskLevel === RiskLevel.BLOCKED) {
      throw new AppError(
        "COD_NOT_ELIGIBLE",
        `COD is not available for this order. Your ${label} is restricted from Cash on Delivery.`,
        400
      );
    }
    // HIGH = COD allowed, but requires manual admin approval before CONFIRMED
    if (result.requiresApproval) {
      requiresApproval = true;
    }
  }

  // ── 7. COD order value limit ────────────────────────────────────────────
  // Compute the total before entering the transaction so we can validate
  // against the limit without holding any locks.
  const subtotalPaise = cart.items.reduce((sum, item) => {
    const unitPrice =
      item.product.basePricePaise + (item.variant?.priceDeltaPaise ?? 0);
    return sum + unitPrice * item.quantity;
  }, 0);

  // Validate coupon and compute discount if couponCode is provided
  let discountPaise = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });
    if (!coupon || !coupon.isActive) {
      throw new AppError("VALIDATION_ERROR", "Coupon is not valid or active", 400);
    }
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      throw new AppError("VALIDATION_ERROR", "Coupon is not active yet", 400);
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      throw new AppError("VALIDATION_ERROR", "Coupon has expired", 400);
    }
    if (coupon.maxUsage > 0 && coupon.usageCount >= coupon.maxUsage) {
      throw new AppError("VALIDATION_ERROR", "Coupon usage limit has been reached", 400);
    }
    if (subtotalPaise < coupon.minOrderPaise) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Coupon requires a minimum order of ${formatRupees(coupon.minOrderPaise)}`,
        400
      );
    }

    if (coupon.discountType === "PERCENTAGE") {
      discountPaise = Math.round((subtotalPaise * coupon.discountValue) / 100);
    } else {
      discountPaise = coupon.discountValue;
    }
    discountPaise = Math.min(discountPaise, subtotalPaise);
  }

  // Shipping and COD fee are ₹0 at MVP
  const shippingPaise = 0;
  const codFeePaise = 0;

  // ── B12: Points redemption validation ─────────────────────────────────
  let loyaltySettings: Awaited<ReturnType<typeof getLoyaltySettings>> | null = null;
  let pointsDiscountPaise = 0;
  const rawRedeemPoints = pointsToRedeem ?? 0;
  const redeemPoints = Math.floor(rawRedeemPoints / 100) * 100;
  const account = await getOrCreateLoyaltyAccount(userId);

  if (redeemPoints > 0) {
    loyaltySettings = await getLoyaltySettings();
    if (account.balance < redeemPoints) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Insufficient points. You have ${account.balance} points but tried to redeem ${redeemPoints}.`,
        400
      );
    }
    // Calculate discount: rupeesPer100Points per 100 points
    pointsDiscountPaise = (redeemPoints / 100) * loyaltySettings.rupeesPer100Points * 100;
  }

  const totalPaise = Math.max(0, subtotalPaise - discountPaise - pointsDiscountPaise) + shippingPaise + codFeePaise;

  const codLimit = await getCodLimitPaise();
  if (totalPaise > codLimit) {
    throw new AppError(
      "COD_NOT_ELIGIBLE",
      `Your order total of ${formatRupees(totalPaise)} exceeds the COD limit of ${formatRupees(codLimit)}. Please reduce your order value to proceed with COD.`,
      400
    );
  }

  // ── 8. Atomic transaction: stock check + deduction + order creation ────
  //
  // Uses $transaction with raw SQL SELECT ... FOR UPDATE to row-lock each
  // ProductVariant. This serialises concurrent checkout attempts on the same
  // variant so two customers cannot simultaneously check out the last unit.
  //
  // Per Design Doc §4, we use pessimistic locking (simpler and safer at
  // GVSwift's expected low concurrency than optimistic versioning + retries).

  let orderId: string;
  const _requiresApproval = requiresApproval; // captured for post-transaction return

  try {
    orderId = await prisma.$transaction(async (tx) => {
      // --- Stock verification with FOR UPDATE row locking ---
      // We lock each variant individually. All locks are acquired before any
      // update, preventing partial-lock scenarios.
      for (const item of cart.items) {
        const variantId = item.variantId!;

        // Raw SQL: SELECT ... FOR UPDATE acquires a row-level exclusive lock.
        const rows = await tx.$queryRaw<Array<{ stock: number }>>`
          SELECT stock FROM "ProductVariant" WHERE id = ${variantId}::uuid FOR UPDATE
        `;

        const currentStock = rows[0]?.stock ?? 0;

        if (currentStock < item.quantity) {
          throw new AppError(
            "OUT_OF_STOCK",
            `"${item.product.name}" only has ${currentStock} unit(s) in stock, but your cart requests ${item.quantity}. Please update your cart.`,
            400
          );
        }
      }

      // --- Deduct stock for all items ---
      for (const item of cart.items) {
        await tx.$executeRaw`
          UPDATE "ProductVariant"
          SET stock = stock - ${item.quantity}
          WHERE id = ${item.variantId!}::uuid
        `;
      }

      // Increment coupon usage count inside transaction if couponCode was used
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode },
        });
        if (!coupon || !coupon.isActive) {
          throw new AppError("VALIDATION_ERROR", "Coupon is no longer active", 400);
        }
        const now = new Date();
        if (coupon.validFrom && now < coupon.validFrom) {
          throw new AppError("VALIDATION_ERROR", "Coupon is not active yet", 400);
        }
        if (coupon.validUntil && now > coupon.validUntil) {
          throw new AppError("VALIDATION_ERROR", "Coupon has expired", 400);
        }
        if (coupon.maxUsage > 0 && coupon.usageCount >= coupon.maxUsage) {
          throw new AppError("VALIDATION_ERROR", "Coupon usage limit reached", 400);
        }
        if (subtotalPaise < coupon.minOrderPaise) {
          throw new AppError("VALIDATION_ERROR", "Coupon minimum order not met", 400);
        }

        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      // --- Create the Order ---
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId,
          status: "PLACED",
          paymentMethod: paymentMethod as PaymentMethod,
          subtotalPaise,
          shippingPaise,
          codFeePaise,
          totalPaise,
          idempotencyKey,
          couponCode,
          discountPaise,
        },
      });

      // --- Create OrderItems (unit price snapshot at time of order) ---
      // This preserves price integrity — even if the product price changes
      // later, this order reflects what the customer was charged.
      await tx.orderItem.createMany({
        data: cart.items.map((item) => {
          const unitPricePaise =
            item.product.basePricePaise + (item.variant?.priceDeltaPaise ?? 0);
          return {
            orderId: newOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPricePaise,
            lineTotalPaise: unitPricePaise * item.quantity,
          };
        }),
      });

      // --- Record initial OrderStatusHistory row ---
      // changedById = null → system-initiated (the order placement itself, not a user action)
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          fromStatus: null,
          toStatus: "PLACED",
          changedById: null,
          reason: _requiresApproval
            ? "Order placed — awaiting manual admin approval (HIGH risk entity detected)"
            : "Order placed successfully",
        },
      });

      // ── B12: Deduct redeemed points inside transaction ─────────────────
      if (redeemPoints > 0) {
        await tx.pointsLedger.create({
          data: {
            loyaltyAccountId: account.id,
            delta: -redeemPoints,
            reason: `Redeemed at checkout — Order #${newOrder.id.slice(-8).toUpperCase()}`,
            orderId: newOrder.id,
          },
        });
        await tx.loyaltyAccount.update({
          where: { id: account.id },
          data: { balance: { increment: -redeemPoints } },
        });
      }

      return newOrder.id;
    });
  } catch (err) {
    // Re-throw AppErrors (stock issues, validation) directly — they already have
    // the correct code and status code.
    if (err instanceof AppError) throw err;

    // P2002 = unique constraint violation on idempotencyKey.
    // This means two concurrent requests with the same key raced through the
    // pre-flight check simultaneously. Retrieve and return the winner's order.
    const prismaErr = err as { code?: string };
    if (prismaErr?.code === "P2002") {
      const idempotentOrder = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: {
          user: { select: { email: true, name: true } },
          address: true,
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      });
      if (idempotentOrder && idempotentOrder.userId === userId) {
        return { order: idempotentOrder as CheckoutResult["order"], requiresApproval: false, wasIdempotent: true };
      }
    }

    // Unexpected errors — never surface raw DB errors to the client
    console.error("[Checkout] Transaction failed unexpectedly:", err);
    throw new AppError(
      "INTERNAL_ERROR",
      "An unexpected error occurred while placing your order. Please try again.",
      500
    );
  }

  // ── 9. Post-transaction: clear the user's cart (best-effort) ──────────
  // Non-atomic — if this fails, the order is already committed and correct.
  // The cart will appear stale but the order is placed. It will self-correct
  // on the next cart view (getCart() finds an existing PLACED order for the cart).
  try {
    await prisma.cartItem.deleteMany({ where: { cartId } });
  } catch (err) {
    console.warn("[Checkout] Cart clear failed after order creation:", err);
  }



  // ── 11. Fetch the final order with items for the response ──────────────
  const finalOrder = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      user: { select: { email: true, name: true } },
      address: true,
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
  });

  sendOrderPlacedEmail(finalOrder);

  // ── B12: Award purchase points (best-effort, post-transaction, non-blocking) ──
  const awardPurchasePoints = async () => {
    try {
      if (!loyaltySettings) loyaltySettings = await getLoyaltySettings();
      const amountPaidRupees = Math.floor(totalPaise / 100);
      const pointsEarned = amountPaidRupees * loyaltySettings.pointsPerRupee;
      if (pointsEarned > 0) {
        await awardPoints(
          userId,
          pointsEarned,
          `Purchase — Order #${orderId.slice(-8).toUpperCase()}`,
          orderId
        );
      }
    } catch (err) {
      console.error("[Checkout] Failed to award purchase points:", err);
    }
  };

  const awardReferralBonus = async () => {
    try {
      const referralUse = await prisma.referralUse.findUnique({
        where: { referredUserId: userId },
        include: { referralCode: { select: { userId: true } } },
      });
      if (referralUse && referralUse.pointsAwarded === 0) {
        const referrerId = referralUse.referralCode.userId;
        if (!loyaltySettings) loyaltySettings = await getLoyaltySettings();
        await awardPoints(
          referrerId,
          loyaltySettings.referralBonus,
          `Referral bonus — friend placed their first order`,
          orderId
        );
        await prisma.referralUse.update({
          where: { id: referralUse.id },
          data: { pointsAwarded: loyaltySettings.referralBonus },
        });
      }
    } catch (err) {
      console.error("[Checkout] Failed to award referral bonus:", err);
    }
  };

  // Fire all post-order background tasks without blocking the response
  void Promise.all([awardPurchasePoints(), awardReferralBonus()]);

  // ── 10. Best-effort risk flag seeding (non-blocking) ──────────────────
  const seedRiskFlags = async () => {
    try {
      const lowRiskEntities = [
        { entityType: RiskEntityType.PINCODE, entityValue: address.pincode },
        { entityType: RiskEntityType.PHONE, entityValue: address.phone },
        { entityType: RiskEntityType.USER, entityValue: userId },
      ];
      for (const entity of lowRiskEntities) {
        const existing = await getRiskFlagByEntity(entity.entityType, entity.entityValue);
        if (!existing) {
          await createRiskFlag({ ...entity, riskLevel: RiskLevel.LOW });
        }
      }
    } catch (err) {
      console.error("[Checkout] Failed to seed LOW risk flags after order placement:", err);
    }
  };
  void seedRiskFlags();

  return {
    order: finalOrder,
    requiresApproval,
    wasIdempotent: false,
  };
}

/**
 * Retrieves a single order by ID, enforcing ownership.
 * Returns 404 for IDOR attempts (never 403 — never confirm existence).
 */
export async function getOrder(userId: string, orderId: string) {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true } },
          variant: { select: { id: true, sku: true } },
        },
      },
      address: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order || order.userId !== userId) {
    throw new AppError("NOT_FOUND", "Order not found", 404);
  }

  return order;
}

/**
 * Lists all orders for the authenticated user, newest first.
 */
export async function listOrders(userId: string) {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  return prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true } },
          variant: { select: { id: true, sku: true } },
        },
      },
      address: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
