/**
 * features/cart/service.ts — Persisted Cart Service
 *
 * TICKET-201: get-or-create cart, add item, update quantity, remove item.
 *
 * Ownership model (IDOR protection):
 *   - All cart read/writes are strictly scoped by session.user.id.
 *   - Requesting/mutating a resource that doesn't belong to the user returns 404,
 *     never the content or a 403 confirmation of existence.
 *
 * Stock Validation:
 *   - Stock is verified at add-time and update-time (non-blocking for checkout).
 *
 * Guest Checkout:
 *   - Disabled. A valid userId is required for all operations.
 */

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

/**
 * Retrieves the cart record for the authenticated user, or creates one if it doesn't exist.
 * Guest carts are disabled; a valid userId is required.
 */
export async function getOrCreateCart(userId: string) {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  let cart = await prisma.cart.findFirst({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }

  return cart;
}

/**
 * Retrieves the cart with all its items, including products and variants.
 */
export async function getCart(userId: string) {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  return prisma.cart.findFirst({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

/**
 * Retrieves a cart by its ID, enforcing ownership.
 * Throws 404 if the cart does not exist or belongs to another user.
 */
export async function getCartById(userId: string, cartId: string) {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
  });

  if (!cart || cart.userId !== userId) {
    throw new AppError("NOT_FOUND", "Cart not found", 404);
  }

  return prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

/**
 * Adds an item to the user's cart.
 * Validates stock availability at add-time.
 */
export async function addToCart(
  userId: string,
  productId: string,
  variantId: string,
  quantity: number
) {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  if (quantity < 1 || !Number.isInteger(quantity)) {
    throw new AppError("VALIDATION_ERROR", "Quantity must be an integer of at least 1", 400);
  }

  // Validate variant exists and belongs to the product
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });

  if (!variant || variant.productId !== productId || !variant.product.isActive) {
    throw new AppError("NOT_FOUND", "Product variant not found", 404);
  }

  const cart = await getOrCreateCart(userId);

  // Check if item is already in cart to calculate target quantity
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      variantId,
    },
  });

  const currentQty = existingItem?.quantity ?? 0;
  const targetQty = currentQty + quantity;

  // Validate stock
  if (targetQty > variant.stock) {
    throw new AppError(
      "OUT_OF_STOCK",
      `Cannot add ${quantity} item(s). Available stock is ${variant.stock}, and you already have ${currentQty} in your cart.`,
      400
    );
  }

  if (existingItem) {
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: targetQty },
    });
  } else {
    return prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId,
        quantity,
      },
    });
  }
}

/**
 * Updates the quantity of a cart item.
 * Enforces ownership and validates stock.
 */
export async function updateCartItemQuantity(
  userId: string,
  cartItemId: string,
  quantity: number
) {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  if (quantity < 1 || !Number.isInteger(quantity)) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Quantity must be an integer of at least 1. To remove an item, use the delete action.",
      400
    );
  }

  // Fetch the item and verify ownership of the parent cart
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      cart: true,
      variant: true,
    },
  });

  if (!item || item.cart.userId !== userId) {
    throw new AppError("NOT_FOUND", "Cart item not found", 404);
  }

  // Validate stock
  if (quantity > (item.variant?.stock ?? 0)) {
    throw new AppError(
      "OUT_OF_STOCK",
      `Requested quantity ${quantity} exceeds available stock of ${item.variant?.stock ?? 0}.`,
      400
    );
  }

  return prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });
}

/**
 * Removes a single item from the cart. Enforces ownership.
 */
export async function removeFromCart(userId: string, cartItemId: string) {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  // Fetch the item and verify ownership of the parent cart
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== userId) {
    throw new AppError("NOT_FOUND", "Cart item not found", 404);
  }

  return prisma.cartItem.delete({
    where: { id: cartItemId },
  });
}

/**
 * Clears all items in the user's cart.
 */
export async function clearCart(userId: string) {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  const cart = await prisma.cart.findFirst({
    where: { userId },
  });

  if (!cart) return;

  return prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });
}
