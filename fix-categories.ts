import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const categories = await prisma.category.findMany();
  console.log('Existing categories:', categories.map(c => c.slug));

  // Find gifts and decor
  const gifts = categories.find(c => c.slug === 'gifts');
  const decor = categories.find(c => c.slug === 'decor');

  if (gifts && decor) {
    // Delete decor, rename gifts to gifts-decor
    await prisma.category.delete({ where: { id: decor.id } });
    await prisma.category.update({
      where: { id: gifts.id },
      data: { name: 'Gifts & Decor', slug: 'gifts-decor' }
    });
    console.log('Merged gifts and decor into gifts-decor');
  } else if (gifts && !decor) {
    await prisma.category.update({
      where: { id: gifts.id },
      data: { name: 'Gifts & Decor', slug: 'gifts-decor' }
    });
    console.log('Renamed gifts to gifts-decor');
  } else if (!gifts && decor) {
    await prisma.category.update({
      where: { id: decor.id },
      data: { name: 'Gifts & Decor', slug: 'gifts-decor' }
    });
    console.log('Renamed decor to gifts-decor');
  }

  // Find other ones that might be wrong
  for (const c of categories) {
    if (c.slug === 'accessories') continue;
    if (c.slug === 'women') continue;
    if (c.slug === 'men') continue;
    if (c.slug === 'gifts') continue;
    if (c.slug === 'decor') continue;
    if (c.slug === 'gifts-decor') continue;
    // Just logging what else is there
    console.log('Unknown category found:', c.slug, c.name);
  }
}
main().finally(() => prisma.$disconnect());
