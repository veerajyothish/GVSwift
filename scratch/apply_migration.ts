import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Applying FTS migration to the database...");

  // 1. Add generated column
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product" 
      ADD COLUMN IF NOT EXISTS "search_vector" tsvector 
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))) STORED;
    `);
    console.log("Generated column added successfully.");
  } catch (err) {
    console.error("Error adding generated column:", err);
  }

  // 2. Create GIN index
  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS product_search_vector_idx ON "Product" USING gin(search_vector);
    `);
    console.log("GIN index created successfully.");
  } catch (err) {
    console.error("Error creating GIN index:", err);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
