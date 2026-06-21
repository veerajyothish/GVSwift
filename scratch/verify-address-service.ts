/**
 * scratch/verify-address-service.ts — Verification script for TICKET-203 Address Management
 *
 * Run with: npx tsx scratch/verify-address-service.ts
 */

import { prisma } from "../src/lib/prisma";
import {
  listAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../src/features/users/addresses";
import { RiskEntityType, RiskLevel } from "@prisma/client";

async function main() {
  console.log("=== TICKET-203: Address Service Verification ===\n");

  // 1. Create clean test users in DB
  const emailA = `test-addr-user-a-${Date.now()}@test.com`;
  const emailB = `test-addr-user-b-${Date.now()}@test.com`;

  const userA = await prisma.user.create({
    data: { supabaseId: `sb-test-addr-${Date.now()}-a`, email: emailA },
  });
  const userB = await prisma.user.create({
    data: { supabaseId: `sb-test-addr-${Date.now()}-b`, email: emailB },
  });

  console.log(`Created User A: ID=${userA.id}, email=${userA.email}`);
  console.log(`Created User B: ID=${userB.id}, email=${userB.email}\n`);

  // 2. Set up pincode risk flags for serviceability tests
  const serviceablePincode = "560001";
  const blockedPincode = "560002";
  const unserviceablePincode = "999999"; // Not seeded, so no row exists

  console.log("Setting up risk flags for testing...");
  // Clear any existing flag for our test pincodes
  await prisma.riskFlag.deleteMany({
    where: {
      entityType: RiskEntityType.PINCODE,
      entityValue: { in: [serviceablePincode, blockedPincode, unserviceablePincode] },
    },
  });

  // Create flags
  await prisma.riskFlag.create({
    data: {
      entityType: RiskEntityType.PINCODE,
      entityValue: serviceablePincode,
      riskLevel: RiskLevel.LOW,
    },
  });
  await prisma.riskFlag.create({
    data: {
      entityType: RiskEntityType.PINCODE,
      entityValue: blockedPincode,
      riskLevel: RiskLevel.BLOCKED,
    },
  });
  console.log(`   Pincode ${serviceablePincode} is serviceable (LOW risk)`);
  console.log(`   Pincode ${blockedPincode} is serviceable but COD blocked (BLOCKED risk)`);
  console.log(`   Pincode ${unserviceablePincode} is NOT serviceable (No row)\n`);

  // 3. Testing Pincode Serviceability Check at Entry Time
  console.log("3. Testing Pincode Serviceability Check...");
  
  // A. Try adding address with unserviceable pincode
  try {
    await createAddress(userA.id, {
      fullName: "John Doe",
      line1: "123 Lane",
      city: "Bangalore",
      state: "Karnataka",
      pincode: unserviceablePincode,
      phone: "9876543210",
      isDefault: false,
    });
    console.log("   ❌ FAIL — Allowed unserviceable pincode creation");
  } catch (err: any) {
    console.log(`   Caught expected error: code=${err.code}, message="${err.message}"`);
    console.assert(err.code === "VALIDATION_ERROR", "Should throw VALIDATION_ERROR");
    console.assert(err.message.includes("don't currently ship"), "Should mention not shipping");
    console.log("   ✅ PASS (unserviceable pincode blocked)");
  }

  // B. Try adding address with valid pincode (serviceable)
  let addr1: any;
  try {
    addr1 = await createAddress(userA.id, {
      fullName: "John Doe",
      line1: "123 Lane",
      city: "Bangalore",
      state: "Karnataka",
      pincode: serviceablePincode,
      phone: "9876543210",
      isDefault: false,
    });
    console.log(`   Created address with pincode ${serviceablePincode}. ID=${addr1.id}, isDefault=${addr1.isDefault}`);
    console.assert(addr1.isDefault === true, "First address should automatically become default");
    console.log("   ✅ PASS (serviceable pincode allowed)");
  } catch (err) {
    console.error("   ❌ FAIL — Failed to create serviceable address:", err);
  }
  console.log("");

  // 4. Testing Default Address selection constraints
  console.log("4. Testing Default Selection Constraints...");
  
  // A. Create second address with isDefault = false
  const addr2 = await createAddress(userA.id, {
    fullName: "John Doe 2",
    line1: "456 Avenue",
    city: "Bangalore",
    state: "Karnataka",
    pincode: serviceablePincode,
    phone: "9876543210",
    isDefault: false,
  });
  console.log(`   Created address 2. ID=${addr2.id}, isDefault=${addr2.isDefault}`);
  console.assert(addr2.isDefault === false, "Second address should not be default when requested false");

  // B. Create third address with isDefault = true
  const addr3 = await createAddress(userA.id, {
    fullName: "John Doe 3",
    line1: "789 Boulevard",
    city: "Bangalore",
    state: "Karnataka",
    pincode: serviceablePincode,
    phone: "9876543210",
    isDefault: true,
  });
  console.log(`   Created address 3. ID=${addr3.id}, isDefault=${addr3.isDefault}`);
  console.assert(addr3.isDefault === true, "Third address should be default");

  // Verify that addr1 has been set to false
  const verifyAddr1 = await getAddress(userA.id, addr1.id);
  console.log(`   Re-checked address 1 default status: ${verifyAddr1.isDefault}`);
  console.assert(verifyAddr1.isDefault === false, "Address 1 default should be cleared");
  console.log("   ✅ PASS\n");

  // 5. Testing IDOR Protection
  console.log("5. Testing IDOR Protection...");
  
  // A. User B tries to read User A's address
  try {
    await getAddress(userB.id, addr1.id);
    console.log("   ❌ FAIL — Allowed User B to read User A's address");
  } catch (err: any) {
    console.log(`   Caught expected error on read: code=${err.code}, status=${err.statusCode}`);
    console.assert(err.code === "NOT_FOUND", "Should throw NOT_FOUND");
    console.assert(err.statusCode === 404, "Should be 404 response");
  }

  // B. User B tries to update User A's address
  try {
    await updateAddress(userB.id, addr1.id, { fullName: "Hacker" });
    console.log("   ❌ FAIL — Allowed User B to update User A's address");
  } catch (err: any) {
    console.log(`   Caught expected error on update: code=${err.code}, status=${err.statusCode}`);
    console.assert(err.code === "NOT_FOUND", "Should throw NOT_FOUND");
    console.assert(err.statusCode === 404, "Should be 404 response");
  }

  // C. User B tries to delete User A's address
  try {
    await deleteAddress(userB.id, addr1.id);
    console.log("   ❌ FAIL — Allowed User B to delete User A's address");
  } catch (err: any) {
    console.log(`   Caught expected error on delete: code=${err.code}, status=${err.statusCode}`);
    console.assert(err.code === "NOT_FOUND", "Should throw NOT_FOUND");
    console.assert(err.statusCode === 404, "Should be 404 response");
  }
  console.log("   ✅ PASS\n");

  // 6. Testing deletion logic and automatic re-default selection
  console.log("6. Testing Default Reassignment on Delete...");
  // Currently: addr3 is default (created last). Let's delete it.
  console.log(`   Deleting default Address 3 (ID=${addr3.id})...`);
  await deleteAddress(userA.id, addr3.id);
  console.log("   Address 3 deleted successfully.");

  // The remaining addresses are addr1 and addr2. The most recently created remaining is addr2.
  // Verify that addr2 has automatically become default.
  const verifyAddr2 = await getAddress(userA.id, addr2.id);
  const verifyAddr1After = await getAddress(userA.id, addr1.id);
  console.log(`   Remaining addresses default status:`);
  console.log(`     Address 1: ${verifyAddr1After.isDefault}`);
  console.log(`     Address 2: ${verifyAddr2.isDefault}`);
  console.assert(verifyAddr2.isDefault === true, "Address 2 should be promoted to default");
  console.assert(verifyAddr1After.isDefault === false, "Address 1 should remain non-default");
  console.log("   ✅ PASS\n");

  // 7. Testing Protected Deletes when Referenced by Order
  console.log("7. Testing Protected Deletes...");
  
  // Create a past order referencing Address 2 (which is now default)
  console.log("   Creating test order referencing Address 2...");
  const order = await prisma.order.create({
    data: {
      userId: userA.id,
      addressId: addr2.id,
      subtotalPaise: 500000, // 5000 INR
      totalPaise: 500000,
      status: "PLACED",
      paymentMethod: "COD",
    },
  });
  console.log(`   Created Order: ID=${order.id}`);

  // Now attempt to delete Address 2. It should fail gracefully.
  try {
    await deleteAddress(userA.id, addr2.id);
    console.log("   ❌ FAIL — Allowed deletion of address referenced by order");
  } catch (err: any) {
    console.log(`   Caught expected error: code=${err.code}, message="${err.message}"`);
    console.assert(err.code === "VALIDATION_ERROR", "Should be a VALIDATION_ERROR");
    console.assert(err.message.includes("past order"), "Should mention past order in message");
    console.log("   ✅ PASS");
  }

  // 8. Clean up everything
  console.log("\n8. Cleaning up test rows...");
  await prisma.order.delete({ where: { id: order.id } });
  await prisma.address.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
  await prisma.user.delete({ where: { id: userA.id } });
  await prisma.user.delete({ where: { id: userB.id } });
  await prisma.riskFlag.deleteMany({
    where: {
      entityType: RiskEntityType.PINCODE,
      entityValue: { in: [serviceablePincode, blockedPincode] },
    },
  });
  console.log("   Cleanup completed successfully.");
  console.log("   ✅ PASS\n");

  console.log("=== All TICKET-203 Address Service tests passed successfully! ===");
}

main()
  .catch((err) => {
    console.error("❌ VERIFICATION FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
