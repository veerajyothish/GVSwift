import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orderId = "b448021b-991f-4682-8143-46ca5476eb39";
  
  await prisma.orderStatusHistory.deleteMany({ where: { orderId } });
  await prisma.orderItem.deleteMany({ where: { orderId } });
  await prisma.order.deleteMany({ where: { id: orderId } });

  console.log(`Cleaned up temp order ${orderId} successfully.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
