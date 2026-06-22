import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orderId = "6ff1d88e-5ffb-4172-90d4-8866e7429fa2";

  await prisma.orderStatusHistory.deleteMany({ where: { orderId } });
  await prisma.orderItem.deleteMany({ where: { orderId } });
  const result = await prisma.order.deleteMany({ where: { id: orderId } });

  if (result.count > 0) {
    console.log(`Cleaned up TICKET-305 test order ${orderId} successfully.`);
  } else {
    console.log(`Order ${orderId} not found (may have already been cleaned up).`);
  }

  // Also clean up the PINCODE risk flag used for testing
  await prisma.riskFlag.deleteMany({
    where: { entityType: "PINCODE", entityValue: "400001" },
  });

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
