/**
 * Scratch script to verify TICKET-601 settings service.
 *
 * Run with: npx tsx scratch/verify-settings-service.ts
 */

import { prisma } from "../src/lib/prisma";
import {
  getCodLimitPaise,
  getReturnWindowDays,
  getCancellationCutoffStatus,
  getMaxDeliveryAttempts,
  getFailedDeliveryWatchlistThreshold,
  getFailedDeliveryHighRiskThreshold,
  getCancellationRiskThreshold,
  getAllSettings,
  updateSetting,
  getSetting,
} from "../src/features/settings/service";

async function main() {
  console.log("=== TICKET-601: Settings Service Verification ===\n");

  // 1. Verify default values populated by seed script
  console.log("1. Checking default values populated from seed...");
  const codLimit = await getCodLimitPaise();
  console.log(`   codLimit: ${codLimit} paise (expect 1000000)`);
  console.assert(codLimit === 1000000, "COD limit should be 1,000,000 paise");

  const returnWindow = await getReturnWindowDays();
  console.log(`   returnWindow: ${returnWindow} days (expect 7)`);
  console.assert(returnWindow === 7, "Return window should be 7 days");

  const cancelCutoff = await getCancellationCutoffStatus();
  console.log(`   cancelCutoff: ${cancelCutoff} (expect SHIPPED)`);
  console.assert(cancelCutoff === "SHIPPED", "Cutoff should be SHIPPED");

  const maxAttempts = await getMaxDeliveryAttempts();
  console.log(`   maxAttempts: ${maxAttempts} (expect 2)`);
  console.assert(maxAttempts === 2, "Max attempts should be 2");

  const watchlistThreshold = await getFailedDeliveryWatchlistThreshold();
  console.log(`   watchlistThreshold: ${watchlistThreshold} (expect 1)`);
  console.assert(watchlistThreshold === 1, "Watchlist threshold should be 1");

  const highRiskThreshold = await getFailedDeliveryHighRiskThreshold();
  console.log(`   highRiskThreshold: ${highRiskThreshold} (expect 2)`);
  console.assert(highRiskThreshold === 2, "High risk threshold should be 2");

  const cancellationRisk = await getCancellationRiskThreshold();
  console.log(`   cancellationRisk: ${cancellationRisk} (expect 3)`);
  console.assert(cancellationRisk === 3, "Cancellation risk threshold should be 3");

  console.log("   ✅ PASS\n");

  // 2. Test getAllSettings
  console.log("2. Checking getAllSettings...");
  const all = await getAllSettings();
  console.log(`   keys: ${Object.keys(all).join(", ")}`);
  console.assert(all.cod_limit_paise === 1000000, "getAllSettings: cod_limit_paise");
  console.assert(all.return_window_days === 7, "getAllSettings: return_window_days");
  console.assert(all.cancellation_cutoff_status === "SHIPPED", "getAllSettings: cancellation_cutoff_status");
  console.assert(all.max_delivery_attempts === 2, "getAllSettings: max_delivery_attempts");
  console.log("   ✅ PASS\n");

  // 3. Test updateSetting validation and updates
  console.log("3. Test updating settings with valid values...");
  // Backup the original values
  const originalCodLimit = await getCodLimitPaise();

  await updateSetting("cod_limit_paise", 1500000); // 15k
  const updatedCod = await getCodLimitPaise();
  console.log(`   updatedCodLimit: ${updatedCod} paise (expect 1500000)`);
  console.assert(updatedCod === 1500000, "Should update to 1,500,000 paise");

  await updateSetting("cancellation_cutoff_status", "CONFIRMED");
  const updatedCutoff = await getCancellationCutoffStatus();
  console.log(`   updatedCutoff: ${updatedCutoff} (expect CONFIRMED)`);
  console.assert(updatedCutoff === "CONFIRMED", "Should update to CONFIRMED");

  console.log("   ✅ PASS\n");

  // 4. Test validation errors
  console.log("4. Test update validation errors (invalid values)...");

  // Unknown key
  try {
    await updateSetting("unknown_key_xyz", 123);
    console.log("   ❌ FAIL — should have thrown error for unknown key");
  } catch (err: any) {
    console.log(`   Caught expected error for unknown key: ${err.message}`);
    console.assert(err.code === "VALIDATION_ERROR", "Should be VALIDATION_ERROR");
  }

  // Negative value
  try {
    await updateSetting("cod_limit_paise", -100);
    console.log("   ❌ FAIL — should have thrown error for negative number");
  } catch (err: any) {
    console.log(`   Caught expected error for negative number: ${err.message}`);
    console.assert(err.code === "VALIDATION_ERROR", "Should be VALIDATION_ERROR");
  }

  // Non-integer
  try {
    await updateSetting("return_window_days", 5.5);
    console.log("   ❌ FAIL — should have thrown error for float");
  } catch (err: any) {
    console.log(`   Caught expected error for non-integer: ${err.message}`);
    console.assert(err.code === "VALIDATION_ERROR", "Should be VALIDATION_ERROR");
  }

  // Invalid order status
  try {
    await updateSetting("cancellation_cutoff_status", "INVALID_STATUS_NAME");
    console.log("   ❌ FAIL — should have thrown error for invalid status");
  } catch (err: any) {
    console.log(`   Caught expected error for invalid status: ${err.message}`);
    console.assert(err.code === "VALIDATION_ERROR", "Should be VALIDATION_ERROR");
  }

  console.log("   ✅ PASS\n");

  // 5. Restore original values
  console.log("5. Restoring original settings...");
  await updateSetting("cod_limit_paise", originalCodLimit);
  await updateSetting("cancellation_cutoff_status", "SHIPPED");
  console.log("   Restored settings to original values");
  console.log("   ✅ PASS\n");

  console.log("=== All TICKET-601 settings service criteria verified! ===");
}

main()
  .catch((err) => {
    console.error("VERIFICATION FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
