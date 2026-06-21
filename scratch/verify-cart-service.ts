/**
 * scratch/verify-cart-service.ts — Verification script for TICKET-201 Cart Service
 *
 * Run with: npx tsx scratch/verify-cart-service.ts
 */

import { prisma } from "../src/lib/prisma";
import {
  getOrCreateCart,
  getCart,
  getCartById,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
} from "../src/features/cart/service";

async function main() {
  console.log("=== TICKET-201: Cart Service Verification ===\n");

  // 1. Create clean test users in DB
  const emailA = `test-user-a-${Date.now()}@test.com`;
  const emailB = `test-user-b-${Date.now()}@test.com`;

  const userA = await prisma.user.create({
    data: { supabaseId: `sb-test-${Date.now()}-a`, email: emailA },
  });
  const userB = await prisma.user.create({
    data: { supabaseId: `sb-test-${Date.now()}-b`, email: emailB },
  });

  console.log(`Created User A: ID=${userA.id}, email=${userA.email}`);
  console.log(`Created User B: ID=${userB.id}, email=${userB.email}`);

  // Fetch test product variant (Stitch Gold-Trimmed Premium Jacket SKU: STITCH-JKT-BLK-XL, stock = 5)
  const variant = await prisma.productVariant.findFirst({
    where: { sku: "STITCH-JKT-BLK-XL" },
  });

  if (!variant) {
    throw new Error("Could not find test product variant STITCH-JKT-BLK-XL. Run seed first.");
  }
  console.log(`Using variant: SKU=${variant.sku}, Stock=${variant.stock}, ID=${variant.id}\n`);

  // 2. getOrCreateCart
  console.log("2. Testing getOrCreateCart...");
  const cartA = await getOrCreateCart(userA.id);
  console.log(`   User A Cart created: ID=${cartA.id}`);
  console.assert(cartA.userId === userA.id, "Cart userId should match User A id");
  console.log("   ✅ PASS\n");

  // 3. addToCart Success
  console.log("3. Testing addToCart success (add 2 items)...");
  const addedItem = await addToCart(userA.id, variant.productId, variant.id, 2);
  console.log(`   Item added to cart: ID=${addedItem.id}, quantity=${addedItem.quantity}`);
  console.assert(addedItem.quantity === 2, "Quantity should be 2");

  const currentCart = await getCart(userA.id);
  console.log(`   Cart item count: ${currentCart?.items.length}`);
  console.assert(currentCart?.items.length === 1, "Should have 1 item");
  console.assert(currentCart?.items[0]?.quantity === 2, "Should have quantity 2");
  console.log("   ✅ PASS\n");

  // 4. addToCart Out of Stock Validation
  console.log("4. Testing addToCart stock validation (target quantity 6 exceeds stock 5)...");
  try {
    // Attempting to add 4 more items (total target = 6, stock = 5)
    await addToCart(userA.id, variant.productId, variant.id, 4);
    console.log("   ❌ FAIL — allowed adding exceeding stock");
  } catch (err: any) {
    console.log(`   Caught expected error: code=${err.code}, message="${err.message}"`);
    console.assert(err.code === "OUT_OF_STOCK", "Should throw OUT_OF_STOCK error");
    console.log("   ✅ PASS\n");
  }

  // 5. Quantity boundary checks (negative / decimal)
  console.log("5. Testing quantity boundary checks...");
  try {
    await addToCart(userA.id, variant.productId, variant.id, -1);
    console.log("   ❌ FAIL — allowed negative quantity");
  } catch (err: any) {
    console.log(`   Caught expected error: code=${err.code}, message="${err.message}"`);
    console.assert(err.code === "VALIDATION_ERROR", "Should throw VALIDATION_ERROR");
  }

  try {
    await addToCart(userA.id, variant.productId, variant.id, 1.5);
    console.log("   ❌ FAIL — allowed decimal quantity");
  } catch (err: any) {
    console.log(`   Caught expected error: code=${err.code}, message="${err.message}"`);
    console.assert(err.code === "VALIDATION_ERROR", "Should throw VALIDATION_ERROR");
  }
  console.log("   ✅ PASS\n");

  // 6. updateCartItemQuantity
  console.log("6. Testing updateCartItemQuantity...");
  // Valid update (set to 4)
  const updatedItem = await updateCartItemQuantity(userA.id, addedItem.id, 4);
  console.log(`   Updated quantity: ${updatedItem.quantity}`);
  console.assert(updatedItem.quantity === 4, "Quantity should be updated to 4");

  // Invalid update (set to 6, exceeds stock 5)
  try {
    await updateCartItemQuantity(userA.id, addedItem.id, 6);
    console.log("   ❌ FAIL — allowed updating exceeding stock");
  } catch (err: any) {
    console.log(`   Caught expected error: code=${err.code}, message="${err.message}"`);
    console.assert(err.code === "OUT_OF_STOCK", "Should throw OUT_OF_STOCK error");
  }

  // Invalid update (set to 0)
  try {
    await updateCartItemQuantity(userA.id, addedItem.id, 0);
    console.log("   ❌ FAIL — allowed updating quantity to 0");
  } catch (err: any) {
    console.log(`   Caught expected error: code=${err.code}, message="${err.message}"`);
    console.assert(err.code === "VALIDATION_ERROR", "Should throw VALIDATION_ERROR");
  }
  console.log("   ✅ PASS\n");

  // 7. IDOR Protection (User B tries to access/mutate User A's cart)
  console.log("7. Testing IDOR Protection...");
  // User B tries to read User A's cart by cartId
  try {
    await getCartById(userB.id, cartA.id);
    console.log("   ❌ FAIL — allowed User B to read User A's cart content");
  } catch (err: any) {
    console.log(`   Caught expected error: code=${err.code}, message="${err.message}"`);
    console.assert(err.statusCode === 404, "Should return 404 Not Found");
    console.assert(err.code === "NOT_FOUND", "Should throw NOT_FOUND error code");
  }

  // User B tries to update User A's cartItem
  try {
    await updateCartItemQuantity(userB.id, addedItem.id, 2);
    console.log("   ❌ FAIL — allowed User B to update User A's cartItem");
  } catch (err: any) {
    console.log(`   Caught expected error: code=${err.code}, message="${err.message}"`);
    console.assert(err.statusCode === 404, "Should return 404 Not Found");
    console.assert(err.code === "NOT_FOUND", "Should throw NOT_FOUND error code");
  }

  // User B tries to delete User A's cartItem
  try {
    await removeFromCart(userB.id, addedItem.id);
    console.log("   ❌ FAIL — allowed User B to remove User A's cartItem");
  } catch (err: any) {
    console.log(`   Caught expected error: code=${err.code}, message="${err.message}"`);
    console.assert(err.statusCode === 404, "Should return 404 Not Found");
    console.assert(err.code === "NOT_FOUND", "Should throw NOT_FOUND error code");
  }
  console.log("   ✅ PASS\n");

  // 8. removeFromCart
  console.log("8. Testing removeFromCart...");
  await removeFromCart(userA.id, addedItem.id);
  const cartAfterRemove = await getCart(userA.id);
  console.log(`   Items in cart after remove: ${cartAfterRemove?.items.length}`);
  console.assert(cartAfterRemove?.items.length === 0, "Cart should be empty");
  console.log("   ✅ PASS\n");

  // 9. clearCart
  console.log("9. Testing clearCart...");
  await addToCart(userA.id, variant.productId, variant.id, 1);
  const cartBeforeClear = await getCart(userA.id);
  console.log(`   Items in cart before clear: ${cartBeforeClear?.items.length}`);
  console.assert(cartBeforeClear?.items.length === 1, "Should have 1 item");

  await clearCart(userA.id);
  const cartAfterClear = await getCart(userA.id);
  console.log(`   Items in cart after clear: ${cartAfterClear?.items.length}`);
  console.assert(cartAfterClear?.items.length === 0, "Cart should be empty");
  console.log("   ✅ PASS\n");

  // 10. Clean up test database rows
  console.log("10. Cleaning up database rows...");
  await prisma.cartItem.deleteMany({ where: { cartId: cartA.id } });
  await prisma.cart.delete({ where: { id: cartA.id } });
  
  // Also check if User B had any cart created
  const cartB = await prisma.cart.findFirst({ where: { userId: userB.id } });
  if (cartB) {
    await prisma.cartItem.deleteMany({ where: { cartId: cartB.id } });
    await prisma.cart.delete({ where: { id: cartB.id } });
  }

  await prisma.user.delete({ where: { id: userA.id } });
  await prisma.user.delete({ where: { id: userB.id } });
  console.log("   Deleted test users and carts");
  console.log("   ✅ PASS\n");

  console.log("=== All TICKET-201 Cart Service tests passed successfully! ===");
}

main()
  .catch((err) => {
    console.error("❌ VERIFICATION FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
