import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_CATEGORIES = [
  { name: "Women", slug: "women" },
  { name: "Men", slug: "men" },
  { name: "Accessories", slug: "accessories" },
  { name: "Gifts & Decor", slug: "gifts-decor" },
];

async function main() {
  console.log("Normalizing categories...");

  // Upsert the 4 required categories
  const targetCategoryIds: string[] = [];
  for (const cat of TARGET_CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    });
    targetCategoryIds.push(created.id);
  }

  // Fetch all categories from DB after upserting the correct ones
  const allCategories = await prisma.category.findMany();
  
  // Find invalid categories
  const validSlugs = TARGET_CATEGORIES.map(c => c.slug);
  const invalidCategories = allCategories.filter(c => !validSlugs.includes(c.slug));

  let totalReassigned = 0;

  for (const invalidCat of invalidCategories) {
    // Determine target mapping
    let mappedSlug = "women"; // default fallback
    const lowerName = invalidCat.name.toLowerCase();
    const lowerSlug = invalidCat.slug.toLowerCase();
    
    if (lowerName.includes("men") && !lowerName.includes("women") || lowerSlug.includes("men") && !lowerSlug.includes("women")) {
      mappedSlug = "men";
    } else if (lowerName.includes("women") || lowerSlug.includes("women")) {
      mappedSlug = "women";
    } else if (lowerName.includes("access") || lowerSlug.includes("access")) {
      mappedSlug = "accessories";
    } else if (lowerName.includes("gift") || lowerName.includes("decor") || lowerSlug.includes("gift") || lowerSlug.includes("decor")) {
      mappedSlug = "gifts-decor";
    } else if (lowerName.includes("apparel") || lowerSlug.includes("apparel")) {
      mappedSlug = "women"; // Map generic 'apparel' to 'women'
    } else if (lowerName.includes("footwear") || lowerSlug.includes("footwear")) {
      mappedSlug = "accessories"; // Map generic 'footwear' to 'accessories'
    }

    const mappedCategory = allCategories.find(c => c.slug === mappedSlug) 
      || allCategories.find(c => c.id === targetCategoryIds[0]);

    if (!mappedCategory) continue;

    // Update products assigned to the invalid category
    const updateResult = await prisma.product.updateMany({
      where: { categoryId: invalidCat.id },
      data: { categoryId: mappedCategory.id }
    });

    console.log(`Reassigned ${updateResult.count} products from '${invalidCat.name}' to '${mappedCategory.name}'`);
    totalReassigned += updateResult.count;

    // Delete the invalid category
    await prisma.category.delete({
      where: { id: invalidCat.id }
    });
    console.log(`Deleted category: ${invalidCat.name} (${invalidCat.slug})`);
  }

  console.log(`\nNormalization complete!`);
  console.log(`Valid categories: ${TARGET_CATEGORIES.map(c => c.slug).join(', ')}`);
  console.log(`Total products reassigned: ${totalReassigned}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
