import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { invalidateCollectionCache } from "@/features/catalog/repository";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** GET /api/v1/admin/categories — list all categories with product count */
export async function GET() {
  const { errorResponse } = await requireAdminForApi();
  if (errorResponse) return errorResponse;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json(categories);
}

/** POST /api/v1/admin/categories — create a new category */
export async function POST(req: Request) {
  const { errorResponse } = await requireAdminForApi();
  if (errorResponse) return errorResponse;

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : slugify(name);

  if (!name) {
    return NextResponse.json({ error: "Category name is required." }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ error: "Slug is required." }, { status: 400 });
  }

  // Check for slug uniqueness
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: `Slug "${slug}" is already taken. Please choose a different name.` },
      { status: 409 }
    );
  }

  const category = await prisma.category.create({
    data: { name, slug },
  });

  await invalidateCollectionCache();

  return NextResponse.json(category, { status: 201 });
}
