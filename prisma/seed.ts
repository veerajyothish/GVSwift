/**
 * prisma/seed.ts — Database seed script
 *
 * Seeds:
 *   1. Default Settings rows (COD limit, return window, cancellation cutoff,
 *      max delivery attempts) per Operations & Support Document §2.
 *   2. Serviceable pincode RiskFlag rows (absence = not serviceable).
 *
 * Run with: npm run db:seed
 *
 * This is idempotent — safe to re-run; uses upsert so existing rows
 * aren't duplicated.
 *
 * Note: TICKET-601 implements the typed Settings service wrapper.
 * These seed values are the defaults that service reads.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── 1. Default Settings ──────────────────────────────────────────────
  // Values from Operations & Support Document §2.
  // All monetary values in paise (1 INR = 100 paise).

  const settings = [
    {
      key: "cod_limit_paise",
      value: JSON.stringify(1_000_000), // ₹10,000
    },
    {
      key: "return_window_days",
      value: JSON.stringify(7), // 7 days from delivery
    },
    {
      key: "cancellation_cutoff_status",
      value: JSON.stringify("SHIPPED"), // customer can cancel up to (not including) SHIPPED
    },
    {
      key: "max_delivery_attempts",
      value: JSON.stringify(3), // auto-RTO after 3 failed delivery attempts
    },
    {
      key: "auto_flag_failed_delivery_threshold",
      value: JSON.stringify(3), // flag address after 3 failures in 90 days
    },
    {
      key: "auto_flag_cancellation_threshold",
      value: JSON.stringify(3), // flag user after 3 post-confirmation cancellations
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {}, // don't overwrite admin-customized values
      create: setting,
    });
  }

  console.log(`✅ Seeded ${settings.length} default settings`);

  // ── 2. Serviceable Pincodes ───────────────────────────────────────────
  // A pincode with no RiskFlag row = "not serviceable" (per Database Design §2.2).
  // Seed initial serviceable pincodes with riskLevel = LOW.
  //
  // Replace/extend this list with real serviceable pincodes before launch.
  // Pincodes are intentionally kept minimal here — operations team should
  // manage the full list via the Admin Risk UI (TICKET-503).

  const serviceablePincodes = [
    "110001", // New Delhi
    "400001", // Mumbai
    "560001", // Bangalore
    "600001", // Chennai
    "700001", // Kolkata
    "500001", // Hyderabad
    "411001", // Pune
    "380001", // Ahmedabad
  ];

  for (const pincode of serviceablePincodes) {
    await prisma.riskFlag.upsert({
      where: {
        // upsert by the composite index
        // RiskFlag has no unique constraint on entityType+entityValue,
        // so we find-or-create manually
        id: await getOrCreateRiskFlagId(pincode),
      },
      update: {},
      create: {
        entityType: "PINCODE",
        entityValue: pincode,
        riskLevel: "LOW",
      },
    });
  }

  console.log(`✅ Seeded ${serviceablePincodes.length} serviceable pincodes`);

  // ── 3. Sample Categories and Products ─────────────────────────────────
  const apparelCategory = await prisma.category.upsert({
    where: { slug: "apparel" },
    update: {},
    create: {
      name: "Apparel",
      slug: "apparel",
    },
  });

  const footwearCategory = await prisma.category.upsert({
    where: { slug: "footwear" },
    update: {},
    create: {
      name: "Footwear",
      slug: "footwear",
    },
  });

  console.log("✅ Seeded categories");

  // Premium Jacket Product
  const jacketProduct = await prisma.product.upsert({
    where: { slug: "stitch-gold-trimmed-premium-jacket" },
    update: {},
    create: {
      name: "Stitch Gold-Trimmed Premium Jacket",
      slug: "stitch-gold-trimmed-premium-jacket",
      description: "A premium, stylish black jacket with subtle gold zipper and stitching details. Part of the exclusive Stitch Launch collection.",
      basePricePaise: 499900, // ₹4,999.00
      isActive: true,
      categoryId: apparelCategory.id,
      variants: {
        createMany: {
          data: [
            { sku: "STITCH-JKT-BLK-S", stock: 15, priceDeltaPaise: 0 },
            { sku: "STITCH-JKT-BLK-M", stock: 20, priceDeltaPaise: 0 },
            { sku: "STITCH-JKT-BLK-L", stock: 10, priceDeltaPaise: 0 },
            { sku: "STITCH-JKT-BLK-XL", stock: 5, priceDeltaPaise: 50000 }, // XL is ₹5,499.00 (+₹500.00 delta)
          ],
        },
      },
      images: {
        createMany: {
          data: [
            {
              url: "/fashion_product_mockup.png",
              altText: "Front view of Stitch Gold-Trimmed Premium Jacket",
              isPrimary: true,
              sortOrder: 0,
            },
          ],
        },
      },
    },
  });

  console.log(`✅ Seeded product: ${jacketProduct.name}`);
  console.log("🌱 Seed complete.");
}

/**
 * Helper to find an existing RiskFlag id for a pincode or return a
 * non-existent ID so the upsert create-branch is taken.
 */
async function getOrCreateRiskFlagId(pincode: string): Promise<string> {
  const existing = await prisma.riskFlag.findFirst({
    where: { entityType: "PINCODE", entityValue: pincode },
    select: { id: true },
  });
  return existing?.id ?? "00000000-0000-0000-0000-000000000000"; // sentinel — triggers create
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
