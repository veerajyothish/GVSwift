import { Product, ProductVariant, ProductImage, Category } from "@prisma/client";

export type ProductWithVariantsAndImages = Product & {
  variants: ProductVariant[];
  images: ProductImage[];
  avgRating?: number | null;
  category?: Category | null;
};

export interface ListProductsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  includeInactive?: boolean;
  search?: string;
  lowStockOnly?: boolean;
  lowStockThreshold?: number;
  sort?: string;
  maxPrice?: number;
}

export interface PaginatedProductsResult {
  products: ProductWithVariantsAndImages[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}
