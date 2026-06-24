import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** PUT /api/v1/admin/categories/[id] — update name and/or slug */
export async function PUT(req: Request, { params }: RouteParams) {
  const { errorResponse } = await requireAdminForApi();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const slug = typeof body.slug === "string" ? body.slug.trim() : undefined;

  if (!name && !slug) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  // Check slug uniqueness (excluding itself)
  if (slug && slug !== existing.slug) {
    const conflict = await prisma.category.findUnique({ where: { slug } });
    if (conflict) {
      return NextResponse.json(
        { error: `Slug "${slug}" is already taken. Please choose a different slug.` },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(slug ? { slug } : {}),
    },
  });

  return NextResponse.json(updated);
}

/** DELETE /api/v1/admin/categories/[id] — delete if no products assigned */
export async function DELETE(_req: Request, { params }: RouteParams) {
  const { errorResponse } = await requireAdminForApi();
  if (errorResponse) return errorResponse;

  const { id } = await params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  if (category._count.products > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete — ${category._count.products} product${category._count.products !== 1 ? "s are" : " is"} assigned to this category. Reassign them first.`,
      },
      { status: 400 }
    );
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
