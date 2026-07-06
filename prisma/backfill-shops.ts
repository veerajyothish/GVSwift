import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🏪 Backfilling shops data...");

  // 1. Check if default shop already exists (idempotency check)
  const defaultSlug = "gvswift-boutique";
  let defaultShop = await prisma.shop.findUnique({
    where: { slug: defaultSlug },
  });

  if (!defaultShop) {
    console.log("Creating default shop 'GVSwift Boutique'...");
    defaultShop = await prisma.shop.create({
      data: {
        name: "GVSwift Boutique",
        slug: defaultSlug,
        brandImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80",
        description: "The flagship digital storefront of the GVSwift marketplace, curating premium clothing, accessories, and footwear from local craft studios and premium boutiques directly to you.",
        tagline: "Premium Curated Wardrobe & Crafted Essentials",
        isActive: true,
        isFeatured: true,
      },
    });
    console.log(`Default shop created with ID: ${defaultShop.id}`);
  } else {
    console.log("Default shop 'GVSwift Boutique' already exists.");
  }

  // 2. Find all products that don't have a shopId and assign them to the default shop
  const productsWithoutShop = await prisma.product.findMany({
    where: { shopId: null },
  });

  console.log(`Found ${productsWithoutShop.length} products without an assigned shop.`);

  if (productsWithoutShop.length > 0) {
    const updateResult = await prisma.product.updateMany({
      where: { shopId: null },
      data: {
        shopId: defaultShop.id,
      },
    });
    console.log(`Successfully assigned ${updateResult.count} products to the default shop.`);
  }

  console.log("✅ Shops backfill completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error running backfill-shops:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
