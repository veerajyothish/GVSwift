import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  ListProductsParams,
  PaginatedProductsResult,
  ProductWithVariantsAndImages,
} from "./types";

/**
 * Lists products with pagination and filters.
 * By default, soft-deleted/inactive products are excluded.
 */
export async function listProducts(
  params: ListProductsParams = {}
): Promise<PaginatedProductsResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, Math.min(100, params.limit ?? 20)); // Cap limit at 100
  const skip = (page - 1) * limit;
  const threshold = params.lowStockThreshold ?? 10;

  const where: Prisma.ProductWhereInput = {};

  // Exclude inactive (soft-deleted) products by default
  if (!params.includeInactive) {
    where.isActive = true;
  }

  // Filter by category
  if (params.categoryId) {
    where.categoryId = params.categoryId;
  }

  // Simple search filter (PG ILIKE via Prisma)
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  // Low stock filter: at least one variant below threshold
  if (params.lowStockOnly) {
    where.variants = { some: { stock: { lt: threshold } } };
  }

  // Run count and query in parallel
  const [totalCount, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        variants: true,
        images: {
          orderBy: [
            { isPrimary: "desc" },
            { sortOrder: "asc" },
          ],
        },
      },
      orderBy: { createdAt: "desc" },
    }) as Promise<ProductWithVariantsAndImages[]>,
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    products,
    totalCount,
    page,
    limit,
    totalPages,
  };
}

/**
 * Retrieves a single product by its slug, including variants and images.
 * Returns null if the product is not found or is inactive (when includeInactive is false).
 */
export async function getProductBySlug(
  slug: string,
  includeInactive = false
): Promise<ProductWithVariantsAndImages | null> {
  const product = (await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: true,
      images: {
        orderBy: [
          { isPrimary: "desc" },
          { sortOrder: "asc" },
        ],
      },
    },
  })) as ProductWithVariantsAndImages | null;

  if (!product) return null;

  // Enforce soft-delete visibility check
  if (!product.isActive && !includeInactive) {
    return null;
  }

  return product;
}

/**
 * Retrieves a single product by its ID, including variants and images.
 */
export async function getProductById(
  id: string,
  includeInactive = false
): Promise<ProductWithVariantsAndImages | null> {
  const product = (await prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
      images: {
        orderBy: [
          { isPrimary: "desc" },
          { sortOrder: "asc" },
        ],
      },
    },
  })) as ProductWithVariantsAndImages | null;

  if (!product) return null;

  if (!product.isActive && !includeInactive) {
    return null;
  }

  return product;
}

/**
 * Lists all categories (flat array).
 */
export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

/**
 * Creates a new product with optional variants and images (typically used by Admin CRUD).
 */
export async function createProduct(data: {
  name: string;
  slug: string;
  description?: string | null;
  basePricePaise: number;
  isActive?: boolean;
  categoryId?: string | null;
  variants?: { sku: string; stock: number; priceDeltaPaise: number }[];
  images?: { url: string; altText?: string | null; isPrimary?: boolean; sortOrder?: number }[];
}): Promise<ProductWithVariantsAndImages> {
  return (await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      basePricePaise: data.basePricePaise,
      isActive: data.isActive ?? true,
      categoryId: data.categoryId,
      variants: data.variants
        ? {
            createMany: {
              data: data.variants,
            },
          }
        : undefined,
      images: data.images
        ? {
            createMany: {
              data: data.images,
            },
          }
        : undefined,
    },
    include: {
      variants: true,
      images: true,
    },
  })) as ProductWithVariantsAndImages;
}

/**
 * Updates an existing product (Admin CRUD).
 */
export async function updateProduct(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string | null;
    basePricePaise?: number;
    isActive?: boolean;
    categoryId?: string | null;
  }
): Promise<ProductWithVariantsAndImages> {
  return (await prisma.product.update({
    where: { id },
    data,
    include: {
      variants: true,
      images: true,
    },
  })) as ProductWithVariantsAndImages;
}

/**
 * Soft-deletes a product by setting isActive to false.
 */
export async function softDeleteProduct(id: string): Promise<ProductWithVariantsAndImages> {
  return (await prisma.product.update({
    where: { id },
    data: { isActive: false },
    include: {
      variants: true,
      images: true,
    },
  })) as ProductWithVariantsAndImages;
}
