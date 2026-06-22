/**
 * features/checkout/types.ts — Checkout domain types
 */

import type { Order, OrderItem, Address } from "@prisma/client";

/** Result returned by createOrder() */
export interface CheckoutResult {
  /** The newly created (or idempotently retrieved) order with its items */
  order: Order & { items: OrderItem[] };
  /**
   * True when any risk entity for this order is HIGH level — the order
   * is created as PLACED but needs manual admin approval before CONFIRMED.
   * The UI should show "Your order is placed and awaiting admin approval."
   */
  requiresApproval: boolean;
  /**
   * True when this result was returned from an existing idempotency key
   * (i.e. the order was not newly created, it was already in the DB).
   */
  wasIdempotent: boolean;
}

/** Input to createOrder — validated by CheckoutInputSchema */
export interface CheckoutInput {
  cartId: string;
  addressId: string;
  idempotencyKey: string;
  paymentMethod: "COD";
}

/** A resolved cart item with variant and product details */
export interface ResolvedCartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: {
    id: string;
    name: string;
    basePricePaise: number;
    isActive: boolean;
  };
  variant: {
    id: string;
    stock: number;
    priceDeltaPaise: number;
  } | null;
}

/** A cart with its owner and items */
export interface ResolvedCart {
  id: string;
  userId: string | null;
  items: ResolvedCartItem[];
}

/** A resolved address with owner */
export type ResolvedAddress = Address;
