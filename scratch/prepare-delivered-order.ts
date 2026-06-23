import { PrismaClient, OrderStatus, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find the first user (usually the one logged in)
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" }
  });

  if (!user) {
    console.error("No user found in the database. Please run the app or register first.");
    process.exit(1);
  }

  console.log(`Found user: ${user.email} (ID: ${user.id})`);

  // Find or create a product and variant
  let product = await prisma.product.findFirst();
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: "Premium Gold Blazer",
        slug: "premium-gold-blazer",
        basePricePaise: 499900,
        isActive: true,
      }
    });
  }

  let variant = await prisma.productVariant.findFirst({
    where: { productId: product.id }
  });
  if (!variant) {
    variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: "GOLD-BLZ-M",
        stock: 10,
        priceDeltaPaise: 0
      }
    });
  }

  // Find or create an address for this user
  let address = await prisma.address.findFirst({
    where: { userId: user.id }
  });
  if (!address) {
    address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: "Veera Jyothish",
        line1: "Flat 402, Gold Crest Apartments",
        city: "Visakhapatnam",
        state: "Andhra Pradesh",
        pincode: "530003",
        phone: "+919876543210"
      }
    });
  }

  // Create a DELIVERED order
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      addressId: address.id,
      status: OrderStatus.DELIVERED,
      subtotalPaise: product.basePricePaise,
      totalPaise: product.basePricePaise,
      items: {
        create: {
          productId: product.id,
          variantId: variant.id,
          quantity: 1,
          unitPricePaise: product.basePricePaise,
          lineTotalPaise: product.basePricePaise,
        }
      }
    }
  });

  // Create the history entries: PLACED -> CONFIRMED -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED
  const steps = [
    { from: null, to: OrderStatus.PLACED, reason: "Order placed" },
    { from: OrderStatus.PLACED, to: OrderStatus.CONFIRMED, reason: "Confirmed by admin" },
    { from: OrderStatus.CONFIRMED, to: OrderStatus.SHIPPED, reason: "Shipped via partner courier" },
    { from: OrderStatus.SHIPPED, to: OrderStatus.OUT_FOR_DELIVERY, reason: "Out for delivery" },
    { from: OrderStatus.OUT_FOR_DELIVERY, to: OrderStatus.DELIVERED, reason: "Delivered package to customer" },
  ];

  let timeOffset = 4 * 60 * 60 * 1000; // 4 hours ago
  for (const step of steps) {
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: step.from,
        toStatus: step.to,
        reason: step.reason,
        changedById: null, // system/admin
        createdAt: new Date(Date.now() - timeOffset)
      }
    });
    timeOffset -= 45 * 60 * 1000; // increments of 45 mins
  }

  console.log(`Successfully created DELIVERED order!`);
  console.log(`Order ID: ${order.id}`);
  console.log(`View it at: http://localhost:3000/orders/${order.id}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
