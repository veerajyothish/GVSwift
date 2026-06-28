import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import {
  ListProductsParams,
  PaginatedProductsResult,
  ProductWithVariantsAndImages,
} from "./types";

/**
 * Direct database query function to list products.
 */
async function fetchProductsDirect(
  params: ListProductsParams
): Promise<PaginatedProductsResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? params.limit ?? 12));
  const take = params.limit ?? pageSize;
  const skip = params.limit ? 0 : (page - 1) * pageSize;
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

  // Filter by price
  if (params.maxPricePaise !== undefined) {
    where.basePricePaise = { lte: params.maxPricePaise };
  } else if (params.maxPrice !== undefined) {
    where.basePricePaise = { lte: params.maxPrice * 100 };
  }

  // Dynamic sorting
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (params.sort === "price-asc") {
    orderBy = { basePricePaise: "asc" };
  } else if (params.sort === "price-desc") {
    orderBy = { basePricePaise: "desc" };
  }

  // Run count and query in parallel
  const [totalCount, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take,
      include: {
        variants: true,
        images: {
          orderBy: [
            { isPrimary: "desc" },
            { sortOrder: "asc" },
          ],
        },
      },
      orderBy,
    }) as Promise<ProductWithVariantsAndImages[]>,
  ]);

  let productsWithRatings = products;
  if (products.length > 0) {
    const ratingAggregates = await prisma.productReview.groupBy({
      by: ["productId"],
      where: {
        productId: { in: products.map((p) => p.id) },
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    productsWithRatings = products.map((product) => {
      const match = ratingAggregates.find((r) => r.productId === product.id);
      return {
        ...product,
        avgRating: match?._avg.rating ?? null,
        reviewCount: match?._count.id ?? 0,
      };
    });
  }

  const totalPages = Math.ceil(totalCount / take);

  return {
    products: productsWithRatings,
    total: totalCount,
    totalCount,
    page,
    limit: take,
    pageSize: take,
    totalPages,
    hasNextPage: !params.limit && page * pageSize < totalCount,
  };
}

const listProductsCached = unstable_cache(
  async (serializedParams: string) => {
    const params = JSON.parse(serializedParams) as ListProductsParams;
    return fetchProductsDirect(params);
  },
  ["products-list"],
  { revalidate: 120, tags: ["products"] }
);

/**
 * Lists products with pagination and filters.
 * By default, soft-deleted/inactive products are excluded.
 */
export async function listProducts(
  params: ListProductsParams = {},
  bypassCache = false
): Promise<PaginatedProductsResult> {
  if (bypassCache) {
    return fetchProductsDirect(params);
  }
  const sortedParams: Record<string, unknown> = {};
  Object.keys(params)
    .sort()
    .forEach((key) => {
      sortedParams[key] = (params as Record<string, unknown>)[key];
    });
  const serialized = JSON.stringify(sortedParams);
  return listProductsCached(serialized);
}

const getProductBySlugCached = unstable_cache(
  async (slug: string) => {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        variants: true,
        images: {
          orderBy: [
            { isPrimary: "desc" },
            { sortOrder: "asc" },
          ],
        },
        category: true,
      },
    }) as Promise<ProductWithVariantsAndImages | null>;
  },
  ["product-by-slug"],
  { revalidate: 120, tags: ["products"] }
);

/**
 * Retrieves a single product by its slug, including variants and images.
 * Returns null if the product is not found or is inactive (when includeInactive is false).
 */
export async function getProductBySlug(
  slug: string,
  includeInactive = false,
  bypassCache = false
): Promise<ProductWithVariantsAndImages | null> {
  const product = (includeInactive || bypassCache)
    ? ((await prisma.product.findUnique({
        where: { slug },
        include: {
          variants: true,
          images: {
            orderBy: [
              { isPrimary: "desc" },
              { sortOrder: "asc" },
            ],
          },
          category: true,
        },
      })) as ProductWithVariantsAndImages | null)
    : await getProductBySlugCached(slug);

  if (!product) return null;

  // Enforce soft-delete visibility check
  if (!product.isActive && !includeInactive) {
    return null;
  }

  return product;
}

const getProductByIdCached = unstable_cache(
  async (id: string) => {
    return prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        images: {
          orderBy: [
            { isPrimary: "desc" },
            { sortOrder: "asc" },
          ],
        },
        category: true,
      },
    }) as Promise<ProductWithVariantsAndImages | null>;
  },
  ["product-by-id"],
  { revalidate: 120, tags: ["products"] }
);

/**
 * Retrieves a single product by its ID, including variants and images.
 */
export async function getProductById(
  id: string,
  includeInactive = false
): Promise<ProductWithVariantsAndImages | null> {
  const product = includeInactive
    ? ((await prisma.product.findUnique({
        where: { id },
        include: {
          variants: true,
          images: {
            orderBy: [
              { isPrimary: "desc" },
              { sortOrder: "asc" },
            ],
          },
          category: true,
        },
      })) as ProductWithVariantsAndImages | null)
    : await getProductByIdCached(id);

  if (!product) return null;

  if (!product.isActive && !includeInactive) {
    return null;
  }

  return product;
}

const listCategoriesCached = unstable_cache(
  async () => {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
    });
  },
  ["categories-list"],
  { revalidate: 3600, tags: ["categories"] }
);

/**
 * Lists all categories (flat array).
 */
export async function listCategories(bypassCache = false) {
  if (bypassCache) {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
    });
  }
  return listCategoriesCached();
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

/**
 * Fetches active products in the same category, excluding the current one, capped at limit.
 */
export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 4
): Promise<ProductWithVariantsAndImages[]> {
  const products = (await prisma.product.findMany({
    where: {
      categoryId,
      id: { not: excludeProductId },
      isActive: true,
    },
    take: limit,
    include: {
      variants: true,
      images: {
        orderBy: [
          { isPrimary: "desc" },
          { sortOrder: "asc" },
        ],
      },
      category: true,
    },
  })) as ProductWithVariantsAndImages[];

  if (products.length === 0) return [];

  const ratingAggregates = await prisma.productReview.groupBy({
    by: ["productId"],
    where: {
      productId: { in: products.map((p) => p.id) },
    },
    _avg: {
      rating: true,
    },
  });

  return products.map((product) => {
    const match = ratingAggregates.find((r) => r.productId === product.id);
    return {
      ...product,
      avgRating: match?._avg.rating ?? null,
    };
  });
}
