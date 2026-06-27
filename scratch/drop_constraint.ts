import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Dropping wishlists_user_id_fkey constraint...');
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE public.wishlists DROP CONSTRAINT IF EXISTS wishlists_user_id_fkey;'
    );
    console.log('Constraint dropped successfully!');
  } catch (err) {
    console.error('Failed to drop constraint:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
