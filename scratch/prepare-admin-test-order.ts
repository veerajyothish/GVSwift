import { PrismaClient, OrderStatus, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "admin@gvswift.com" }
  });

  if (!user) {
    console.error("Admin user not found. Run dev seed first.");
    process.exit(1);
  }

  // Find or create address
  let address = await prisma.address.findFirst({ where: { userId: user.id } });
  if (!address) {
    address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: "Admin Test",
        line1: "123 Admin St",
        city: "Visakhapatnam",
        state: "Andhra Pradesh",
        pincode: "530003",
        phone: "+919876543210"
      }
    });
  }

  // Create a PLACED order
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      addressId: address.id,
      status: OrderStatus.PLACED,
      subtotalPaise: 250000,
      totalPaise: 250000,
    }
  });

  // Create a risk flag to show in the assessment box
  await prisma.riskFlag.deleteMany({
    where: { entityType: "PINCODE", entityValue: "530003" }
  });
  await prisma.riskFlag.create({
    data: {
      entityType: "PINCODE",
      entityValue: "530003",
      riskLevel: "HIGH"
    }
  });

  console.log(`Created test PLACED order with ID: ${order.id}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
