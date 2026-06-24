/**
 * features/checkout/validation.ts — Zod schemas for checkout input
 */

import { z } from "zod";

export const CheckoutInputSchema = z.object({
  /** Cart ID to check out */
  cartId: z.string().uuid("cartId must be a valid UUID"),

  /** Address ID to ship to */
  addressId: z.string().uuid("addressId must be a valid UUID"),

  /**
   * Client-generated idempotency key. Should be a UUID created when the
   * checkout page loads — resubmitting with the same key returns the
   * original order instead of creating a duplicate.
   */
  idempotencyKey: z
    .string()
    .min(1, "idempotencyKey is required")
    .max(128, "idempotencyKey must be at most 128 characters"),

  /**
   * Payment method. Only COD is available at MVP.
   * PREPAID is reserved for post-MVP; attempting it returns a clear error.
   */
  paymentMethod: z.literal("COD").refine((v) => v === "COD", {
    message: "Only COD (Cash on Delivery) is supported at this time.",
  }),

  /** Optional coupon code applied */
  couponCode: z.string().max(100).optional(),
});

export type CheckoutInputRaw = z.input<typeof CheckoutInputSchema>;
export type CheckoutInputParsed = z.output<typeof CheckoutInputSchema>;
