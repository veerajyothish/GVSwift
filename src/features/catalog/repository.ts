import { prisma } from "@/lib/prisma";
import { Prisma, Category, Shop } from "@prisma/client";
import { redis } from "@/lib/redis";
import { withRetry } from "@/lib/retry";
import {
  ListProductsParams,
  PaginatedProductsResult,
  ProductWithVariantsAndImages,
} from "./types";

// Invalidation helpers
export async function invalidateProductCache(slug?: string) {
  await redis.del("products:featured");
  if (slug) {
    await redis.del(`product:${slug}`);
  }
  // Scan and delete all products:* keys
  let cursor = "0";
  do {
    const [nextCursor, keys] = await redis.scan(cursor, { match: "products:*", count: 100 });
    cursor = nextCursor;
    if (keys && keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== "0");
}

export async function invalidateCollectionCache() {
  await redis.del("collections:all");
  await invalidateProductCache();
}

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

  // Filter by shop
  if (params.shopId) {
    where.shopId = params.shopId;
  }

  // PostgreSQL Full Text Search
  let matchingIds: string[] | null = null;
  if (params.search) {
    const rawResults = await withRetry(() =>
      prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Product"
        WHERE search_vector @@ websearch_to_tsquery('english', ${params.search})
        AND "isActive" = true
      `
    );
    matchingIds = rawResults.map((r) => r.id);
  }

  if (matchingIds !== null) {
    where.id = { in: matchingIds };
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
    withRetry(() => prisma.product.count({ where })),
    withRetry(() =>
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
          shop: true,
        },
        orderBy,
      })
    ) as Promise<ProductWithVariantsAndImages[]>,
  ]);

  let productsWithRatings = products;
  if (products.length > 0) {
    const ratingAggregates = await withRetry(() =>
      prisma.productReview.groupBy({
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
      })
    );

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

export async function getCachedProducts(
  params: ListProductsParams = {}
): Promise<PaginatedProductsResult> {
  const sortedParams: Record<string, unknown> = {};
  Object.keys(params)
    .sort()
    .forEach((key) => {
      sortedParams[key] = (params as Record<string, unknown>)[key];
    });
  const key = `products:${JSON.stringify(sortedParams)}`;
  const cached = await redis.get<PaginatedProductsResult>(key);
  if (cached) return cached;

  const data = await fetchProductsDirect(params);
  await redis.setex(key, 60, data);
  return data;
}

export async function getFeaturedProducts(): Promise<PaginatedProductsResult> {
  const key = "products:featured";
  const cached = await redis.get<PaginatedProductsResult>(key);
  if (cached) return cached;

  const data = await fetchProductsDirect({ limit: 8 });
  await redis.setex(key, 300, data);
  return data;
}

export async function getCollections(): Promise<Category[]> {
  const key = "collections:all";
  const cached = await redis.get<Category[]>(key);
  if (cached) return cached;

  const data = await withRetry(() =>
    prisma.category.findMany({
      orderBy: { name: "asc" },
    })
  );
  await redis.setex(key, 300, data);
  return data;
}

/**
 * Lists products with pagination and filters.
 */
export async function listProducts(
  params: ListProductsParams = {},
  bypassCache = false
): Promise<PaginatedProductsResult> {
  if (bypassCache) {
    return fetchProductsDirect(params);
  }
  return getCachedProducts(params);
}

/**
 * Retrieves a single product by its slug, including variants and images.
 */
export async function getProductBySlug(
  slug: string,
  includeInactive = false,
  bypassCache = false
): Promise<ProductWithVariantsAndImages | null> {
  if (includeInactive || bypassCache) {
    return (await withRetry(() =>
      prisma.product.findUnique({
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
          shop: true,
        },
      })
    )) as ProductWithVariantsAndImages | null;
  }

  const key = `product:${slug}`;
  const cached = await redis.get<ProductWithVariantsAndImages | null>(key);
  if (cached) {
    if (cached && !cached.isActive && !includeInactive) {
      return null;
    }
    return cached;
  }

  const product = (await withRetry(() =>
    prisma.product.findUnique({
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
        shop: true,
      },
    })
  )) as ProductWithVariantsAndImages | null;

  if (product) {
    await redis.setex(key, 120, product);
  }

  if (product && !product.isActive && !includeInactive) {
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
  const product = (await withRetry(() =>
    prisma.product.findUnique({
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
        shop: true,
      },
    })
  )) as ProductWithVariantsAndImages | null;

  if (product && !product.isActive && !includeInactive) {
    return null;
  }
  return product;
}

/**
 * Lists all categories (flat array).
 */
export async function listCategories(bypassCache = false) {
  if (bypassCache) {
    return withRetry(() =>
      prisma.category.findMany({
        orderBy: { name: "asc" },
      })
    );
  }
  return getCollections();
}

/**
 * Lists categories that contain active products belonging to a specific shop.
 */
export async function listCategoriesForShop(shopId: string): Promise<Category[]> {
  const products = await withRetry(() =>
    prisma.product.findMany({
      where: {
        shopId,
        isActive: true,
        category: { isNot: null },
      },
      select: {
        category: true,
      },
    })
  );

  const categories: Category[] = [];
  const seenIds = new Set<string>();

  for (const p of products) {
    if (p.category && !seenIds.has(p.category.id)) {
      seenIds.add(p.category.id);
      categories.push(p.category);
    }
  }

  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Creates a new product with optional variants and images (typically used by Admin CRUD).
 */
export async function createProduct(data: {
  name: string;
  slug: string;
  brand?: string | null;
  description?: string | null;
  basePricePaise: number;
  isActive?: boolean;
  categoryId?: string | null;
  shopId?: string | null;
  variants?: { sku: string; stock: number; priceDeltaPaise: number }[];
  images?: { url: string; altText?: string | null; isPrimary?: boolean; sortOrder?: number }[];
}): Promise<ProductWithVariantsAndImages> {
  const product = (await withRetry(() =>
    prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        brand: data.brand,
        description: data.description,
        basePricePaise: data.basePricePaise,
        isActive: data.isActive ?? true,
        categoryId: data.categoryId,
        shopId: data.shopId,
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
        shop: true,
      },
    })
  )) as ProductWithVariantsAndImages;

  await invalidateProductCache(product.slug);
  return product;
}

/**
 * Updates an existing product (Admin CRUD).
 */
export async function updateProduct(
  id: string,
  data: {
    name?: string;
    slug?: string;
    brand?: string | null;
    description?: string | null;
    basePricePaise?: number;
    isActive?: boolean;
    categoryId?: string | null;
    shopId?: string | null;
  }
): Promise<ProductWithVariantsAndImages> {
  const existing = await withRetry(() =>
    prisma.product.findUnique({
      where: { id },
      select: { slug: true },
    })
  );

  const product = (await withRetry(() =>
    prisma.product.update({
      where: { id },
      data,
      include: {
        variants: true,
        images: true,
        shop: true,
      },
    })
  )) as ProductWithVariantsAndImages;

  await invalidateProductCache(existing?.slug);
  if (product.slug !== existing?.slug) {
    await invalidateProductCache(product.slug);
  }
  return product;
}

/**
 * Soft-deletes a product by setting isActive to false.
 */
export async function softDeleteProduct(id: string): Promise<ProductWithVariantsAndImages> {
  const existing = await withRetry(() =>
    prisma.product.findUnique({
      where: { id },
      select: { slug: true },
    })
  );

  const product = (await withRetry(() =>
    prisma.product.update({
      where: { id },
      data: { isActive: false },
      include: {
        variants: true,
        images: true,
      },
    })
  )) as ProductWithVariantsAndImages;

  await invalidateProductCache(existing?.slug);
  return product;
}

/**
 * Fetches active products in the same category, excluding the current one, capped at limit.
 */
export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 4
): Promise<ProductWithVariantsAndImages[]> {
  const products = (await withRetry(() =>
    prisma.product.findMany({
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
    })
  )) as ProductWithVariantsAndImages[];

  if (products.length === 0) return [];

  const ratingAggregates = await withRetry(() =>
    prisma.productReview.groupBy({
      by: ["productId"],
      where: {
        productId: { in: products.map((p) => p.id) },
      },
      _avg: {
        rating: true,
      },
    })
  );

  return products.map((product) => {
    const match = ratingAggregates.find((r) => r.productId === product.id);
    return {
      ...product,
      avgRating: match?._avg.rating ?? null,
    };
  });
}

// --- Shop Repository Actions ---

export async function invalidateShopCache(slug?: string) {
  await redis.del("shops:active");
  await redis.del("shops:featured");
  if (slug) {
    await redis.del(`shop:${slug}`);
  }
}

export async function listShops(params: { isActive?: boolean; isFeatured?: boolean } = {}) {
  const key = `shops:${JSON.stringify(params)}`;
  const cached = await redis.get<Shop[]>(key);
  if (cached) return cached;

  const where: Prisma.ShopWhereInput = {};
  if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }
  if (params.isFeatured !== undefined) {
    where.isFeatured = params.isFeatured;
  }

  const shops = await withRetry(() =>
    prisma.shop.findMany({
      where,
      orderBy: { name: "asc" },
    })
  );

  await redis.setex(key, 300, shops);
  return shops;
}

export async function getShopBySlug(slug: string) {
  const key = `shop:${slug}`;
  const cached = await redis.get<Shop | null>(key);
  if (cached) return cached;

  const shop = await withRetry(() =>
    prisma.shop.findUnique({
      where: { slug },
    })
  );

  await redis.setex(key, 300, shop);
  return shop;
}

export async function getShopById(id: string) {
  return withRetry(() =>
    prisma.shop.findUnique({
      where: { id },
    })
  );
}

export async function createShop(data: {
  name: string;
  slug: string;
  brandImage: string;
  description: string;
  tagline?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
}) {
  const shop = await withRetry(() =>
    prisma.shop.create({
      data: {
        name: data.name,
        slug: data.slug,
        brandImage: data.brandImage,
        description: data.description,
        tagline: data.tagline,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
      },
    })
  );
  await invalidateShopCache(shop.slug);
  return shop;
}

export async function updateShop(
  id: string,
  data: {
    name?: string;
    slug?: string;
    brandImage?: string;
    description?: string;
    tagline?: string | null;
    isActive?: boolean;
    isFeatured?: boolean;
  }
) {
  const existing = await withRetry(() =>
    prisma.shop.findUnique({
      where: { id },
      select: { slug: true },
    })
  );
  const shop = await withRetry(() =>
    prisma.shop.update({
      where: { id },
      data,
    })
  );
  await invalidateShopCache(existing?.slug);
  if (shop.slug !== existing?.slug) {
    await invalidateShopCache(shop.slug);
  }
  return shop;
}

