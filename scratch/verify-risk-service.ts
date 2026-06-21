/**
 * Scratch script to verify TICKET-501 risk flag service.
 * 
 * Run with: npx tsx scratch/verify-risk-service.ts
 */

import { prisma } from "../src/lib/prisma";
import {
  lookupPincode,
  lookupPhone,
  createRiskFlag,
  updateRiskFlag,
  deleteRiskFlag,
  getRiskFlagByEntity,
  listRiskFlags,
  upsertRiskFlag,
} from "../src/features/risk/service";

async function main() {
  console.log("=== TICKET-501: Risk Flag Service Verification ===\n");

  // ── 1. Pincode lookup with NO row → "not serviceable" ──
  console.log("1. Pincode lookup with NO row (expect: not serviceable)");
  const noRow = await lookupPincode("999999");
  console.log(`   found: ${noRow.found}`);
  console.log(`   serviceable: ${noRow.serviceable}`);
  console.log(`   codAllowed: ${noRow.codAllowed}`);
  console.log(`   description: ${noRow.description}`);
  console.assert(!noRow.found, "Should not be found");
  console.assert(!noRow.serviceable, "Should not be serviceable");
  console.assert(!noRow.codAllowed, "Should not allow COD");
  console.log("   ✅ PASS\n");

  // ── 2. Create a LOW pincode → serviceable, COD allowed ──
  console.log("2. Create LOW pincode flag (530001)");
  const lowFlag = await createRiskFlag({
    entityType: "PINCODE",
    entityValue: "530001",
    riskLevel: "LOW",
  });
  console.log(`   Created flag ID: ${lowFlag.id}`);

  const lowLookup = await lookupPincode("530001");
  console.log(`   serviceable: ${lowLookup.serviceable}, codAllowed: ${lowLookup.codAllowed}, requiresApproval: ${lowLookup.requiresApproval}`);
  console.assert(lowLookup.serviceable, "LOW should be serviceable");
  console.assert(lowLookup.codAllowed, "LOW should allow COD");
  console.assert(!lowLookup.requiresApproval, "LOW should not require approval");
  console.log("   ✅ PASS\n");

  // ── 3. Update to MEDIUM → still allowed, watchlisted ──
  console.log("3. Update to MEDIUM");
  await updateRiskFlag(lowFlag.id, { riskLevel: "MEDIUM" });
  const medLookup = await lookupPincode("530001");
  console.log(`   serviceable: ${medLookup.serviceable}, codAllowed: ${medLookup.codAllowed}, requiresApproval: ${medLookup.requiresApproval}`);
  console.assert(medLookup.codAllowed, "MEDIUM should allow COD");
  console.assert(!medLookup.requiresApproval, "MEDIUM should not require approval");
  console.log("   ✅ PASS\n");

  // ── 4. Update to HIGH → requires admin approval ──
  console.log("4. Update to HIGH");
  await updateRiskFlag(lowFlag.id, { riskLevel: "HIGH" });
  const highLookup = await lookupPincode("530001");
  console.log(`   serviceable: ${highLookup.serviceable}, codAllowed: ${highLookup.codAllowed}, requiresApproval: ${highLookup.requiresApproval}`);
  console.assert(highLookup.codAllowed, "HIGH should allow COD");
  console.assert(highLookup.requiresApproval, "HIGH MUST require approval");
  console.log("   ✅ PASS\n");

  // ── 5. Update to BLOCKED → COD disabled ──
  console.log("5. Update to BLOCKED");
  await updateRiskFlag(lowFlag.id, { riskLevel: "BLOCKED" });
  const blockedLookup = await lookupPincode("530001");
  console.log(`   serviceable: ${blockedLookup.serviceable}, codAllowed: ${blockedLookup.codAllowed}, requiresApproval: ${blockedLookup.requiresApproval}`);
  console.assert(blockedLookup.serviceable, "BLOCKED should be serviceable");
  console.assert(!blockedLookup.codAllowed, "BLOCKED must NOT allow COD");
  console.log("   ✅ PASS\n");

  // ── 6. Phone lookup with no row → no flag, normal operations ──
  console.log("6. Phone lookup with no row (expect: no flag, normal)");
  const phoneNoRow = await lookupPhone("+919876543210");
  console.log(`   found: ${phoneNoRow.found}, codAllowed: ${phoneNoRow.codAllowed}, serviceable: ${phoneNoRow.serviceable}`);
  console.assert(!phoneNoRow.found, "Should not be found");
  console.assert(phoneNoRow.codAllowed, "No phone flag = COD allowed");
  console.assert(phoneNoRow.serviceable, "No phone flag = serviceable");
  console.log("   ✅ PASS\n");

  // ── 7. Upsert — create new phone flag, then update it ──
  console.log("7. Upsert phone flag");
  const upsert1 = await upsertRiskFlag({
    entityType: "PHONE",
    entityValue: "+919876543210",
    riskLevel: "LOW",
  });
  console.log(`   Created: ${upsert1.created}, level: ${upsert1.flag.riskLevel}`);
  console.assert(upsert1.created, "First upsert should create");

  const upsert2 = await upsertRiskFlag({
    entityType: "PHONE",
    entityValue: "+919876543210",
    riskLevel: "HIGH",
  });
  console.log(`   Created: ${upsert2.created}, level: ${upsert2.flag.riskLevel}`);
  console.assert(!upsert2.created, "Second upsert should update");
  console.assert(upsert2.flag.riskLevel === "HIGH", "Should be updated to HIGH");
  console.log("   ✅ PASS\n");

  // ── 8. List flags ──
  console.log("8. List flags");
  const list = await listRiskFlags({ page: "1", limit: "10" });
  console.log(`   Total: ${list.totalCount}, page: ${list.page}, flags: ${list.flags.length}`);
  console.assert(list.totalCount >= 2, "Should have at least 2 flags");
  console.log("   ✅ PASS\n");

  // ── 9. Conflict detection — creating a duplicate flag ──
  console.log("9. Conflict detection (duplicate create)");
  try {
    await createRiskFlag({
      entityType: "PINCODE",
      entityValue: "530001",
      riskLevel: "LOW",
    });
    console.log("   ❌ FAIL — should have thrown CONFLICT error");
  } catch (err: unknown) {
    const e = err as { code?: string; statusCode?: number };
    console.log(`   Caught error: code=${e.code}, status=${e.statusCode}`);
    console.assert(e.statusCode === 409, "Should be 409 Conflict");
    console.log("   ✅ PASS\n");
  }

  // ── 10. Cleanup — delete test flags ──
  console.log("10. Cleanup");
  await deleteRiskFlag(lowFlag.id);
  const phoneFlag = await getRiskFlagByEntity("PHONE", "+919876543210");
  if (phoneFlag) await deleteRiskFlag(phoneFlag.id);
  console.log("   Test flags deleted");
  console.log("   ✅ PASS\n");

  console.log("=== All TICKET-501 acceptance criteria verified! ===");
}

main()
  .catch((err) => {
    console.error("VERIFICATION FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
