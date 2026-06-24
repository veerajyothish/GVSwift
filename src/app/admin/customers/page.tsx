import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import CustomerTable from "./CustomerTable";

const PAGE_SIZE = 20;

interface CustomersPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export const metadata = {
  title: "Customer Management — GVSwift Admin",
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const { search = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const skip = (pageNum - 1) * PAGE_SIZE;

  const where: Prisma.UserWhereInput = {
    role: { not: "ADMIN" },
    ...(search.trim()
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [customers, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        blocked: true,
        role: true,
        _count: {
          select: {
            orders: true,
            addresses: true,
          },
        },
        orders: {
          where: { status: "DELIVERED" },
          select: { totalPaise: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Compute total spend per customer (sum of DELIVERED order totals)
  const enrichedCustomers = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    createdAt: c.createdAt.toISOString(),
    blocked: c.blocked,
    role: c.role,
    orderCount: c._count.orders,
    addressCount: c._count.addresses,
    totalSpendPaise: c.orders.reduce((sum, o) => sum + o.totalPaise, 0),
  }));

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Customers</h1>
          <p className="admin-page-subtitle">
            {totalCount} customer{totalCount !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      <CustomerTable
        customers={enrichedCustomers}
        search={search}
        currentPage={pageNum}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </div>
  );
}
