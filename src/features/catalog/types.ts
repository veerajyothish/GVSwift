import { Product, ProductVariant, ProductImage, Category, Shop } from "@prisma/client";

export type ProductWithVariantsAndImages = Product & {
  variants: ProductVariant[];
  images: ProductImage[];
  avgRating?: number | null;
  reviewCount?: number;
  category?: Category | null;
  shop?: Shop | null;
};

export interface ListProductsParams {
  page?: number;
  limit?: number;
  pageSize?: number;
  categoryId?: string;
  shopId?: string;
  includeInactive?: boolean;
  search?: string;
  lowStockOnly?: boolean;
  lowStockThreshold?: number;
  sort?: string;
  maxPrice?: number;
  maxPricePaise?: number;
  featured?: boolean;
}

export interface PaginatedProductsResult {
  products: ProductWithVariantsAndImages[];
  totalCount: number;
  total?: number;
  page: number;
  limit: number;
  pageSize?: number;
  totalPages: number;
  hasNextPage?: boolean;
}
