import re

with open('src/features/catalog/repository.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = re.sub(r'import \{ redis \} from "@/lib/redis";\n', '', content)
content = re.sub(r'import \{ withRetry \} from "@/lib/retry";\n', 'import { unstable_cache, revalidateTag } from "next/cache";\n', content)

# 2. Invalidate Cache
content = re.sub(
    r'export async function invalidateProductCache\(.*?\}',
    'export async function invalidateProductCache(slug?: string) {\n  revalidateTag("products");\n  if (slug) revalidateTag(`product-${slug}`);\n}',
    content, flags=re.DOTALL
)

content = re.sub(
    r'export async function invalidateCollectionCache\(.*?\}',
    'export async function invalidateCollectionCache() {\n  revalidateTag("collections");\n  revalidateTag("products");\n}',
    content, flags=re.DOTALL
)

content = re.sub(
    r'export async function invalidateShopCache\(.*?\}',
    'export async function invalidateShopCache(slug?: string) {\n  revalidateTag("shops");\n  if (slug) revalidateTag(`shop-${slug}`);\n}',
    content, flags=re.DOTALL
)

# 3. getCachedProducts
content = re.sub(
    r'export async function getCachedProducts\(.*?return data;\n\}',
    'export const getCachedProducts = unstable_cache(\n  async (params: ListProductsParams = {}) => fetchProductsDirect(params),\n  ["products-list"],\n  { tags: ["products"], revalidate: 60 }\n);',
    content, flags=re.DOTALL
)

# 4. getFeaturedProducts
content = re.sub(
    r'export async function getFeaturedProducts\(\): Promise<PaginatedProductsResult> \{.*?return data;\n\}',
    'export const getFeaturedProducts = unstable_cache(\n  async () => fetchProductsDirect({ limit: 8 }),\n  ["featured-products"],\n  { tags: ["products"], revalidate: 300 }\n);',
    content, flags=re.DOTALL
)

# 5. getCollections
content = re.sub(
    r'export async function getCollections\(\): Promise<Category\[\]> \{.*?return data;\n\}',
    'export const getCollections = unstable_cache(\n  async () => {\n    return prisma.category.findMany({ orderBy: { name: "asc" } });\n  },\n  ["collections-all"],\n  { tags: ["collections"], revalidate: 300 }\n);',
    content, flags=re.DOTALL
)

# 6. getProductBySlug
product_by_slug_new = '''export const getCachedProductBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        variants: true,
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        category: true,
        shop: true,
      },
    }) as Promise<ProductWithVariantsAndImages | null>;
  },
  ["product-by-slug"],
  { tags: ["products"] }
);

export async function getProductBySlug(
  slug: string,
  includeInactive = false,
  bypassCache = false
): Promise<ProductWithVariantsAndImages | null> {
  let product: ProductWithVariantsAndImages | null = null;
  if (includeInactive || bypassCache) {
    product = (await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: true,
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        category: true,
        shop: true,
      },
    })) as ProductWithVariantsAndImages | null;
  } else {
    product = await getCachedProductBySlug(slug);
  }

  if (product && !product.isActive && !includeInactive) {
    return null;
  }
  return product;
}'''
content = re.sub(r'export async function getProductBySlug\(.*?return product;\n\}', product_by_slug_new, content, flags=re.DOTALL)

# 7. getShopBySlug
shop_by_slug_new = '''export const getCachedShopBySlug = unstable_cache(
  async (slug: string) => prisma.shop.findUnique({ where: { slug } }),
  ["shop-by-slug"],
  { tags: ["shops"], revalidate: 300 }
);

export async function getShopBySlug(slug: string) {
  return getCachedShopBySlug(slug);
}'''
content = re.sub(r'export async function getShopBySlug\(slug: string\) \{.*?return shop;\n\}', shop_by_slug_new, content, flags=re.DOTALL)

# 8. listShops
list_shops_new = '''export const getCachedShops = unstable_cache(
  async (params: { isActive?: boolean; isFeatured?: boolean } = {}) => {
    const where: Prisma.ShopWhereInput = {};
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured;
    return prisma.shop.findMany({ where, orderBy: { name: "asc" } });
  },
  ["shops-list"],
  { tags: ["shops"], revalidate: 300 }
);

export async function listShops(params: { isActive?: boolean; isFeatured?: boolean } = {}) {
  return getCachedShops(params);
}'''
content = re.sub(r'export async function listShops\(params.*?return shops;\n\}', list_shops_new, content, flags=re.DOTALL)

# 9. getRelatedProducts
related_products_new = '''export const getCachedRelatedProducts = unstable_cache(
  async (categoryId: string, excludeProductId: string, limit = 4) => {
    const products = (await prisma.product.findMany({
      where: { categoryId, id: { not: excludeProductId }, isActive: true },
      take: limit,
      include: {
        variants: true,
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        category: true,
      },
    })) as ProductWithVariantsAndImages[];

    if (products.length === 0) return [];

    const ratingAggregates = await prisma.productReview.groupBy({
      by: ["productId"],
      where: { productId: { in: products.map((p) => p.id) } },
      _avg: { rating: true },
    });

    return products.map((product) => {
      const match = ratingAggregates.find((r) => r.productId === product.id);
      return { ...product, avgRating: match?._avg.rating ?? null };
    });
  },
  ["related-products"],
  { tags: ["products"] }
);

export async function getRelatedProducts(categoryId: string, excludeProductId: string, limit = 4) {
  return getCachedRelatedProducts(categoryId, excludeProductId, limit);
}'''
content = re.sub(r'export async function getRelatedProducts\(.*?return products\.map.*?\}\);\n\}', related_products_new, content, flags=re.DOTALL)

# 10. Clean up remaining withRetry calls
content = re.sub(r'await withRetry\(\(\) =>\s*([\s\S]*?)\n\s*\)', r'await \1', content)
content = re.sub(r'await withRetry\(\s*async \(\) =>\s*([\s\S]*?)\n\s*\)', r'await \1', content)
content = re.sub(r'withRetry\(\(\) =>\s*([\s\S]*?)\n\s*\)', r'\1', content)

# 11. Add getCachedCategories for page compatibility
content += "\nexport const getCachedCategories = getCollections;\n"

with open('src/features/catalog/repository.ts', 'w', encoding='utf-8') as f:
    f.write(content)
