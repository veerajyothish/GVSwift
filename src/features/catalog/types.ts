import { Product, ProductVariant, ProductImage } from "@prisma/client";

export type ProductWithVariantsAndImages = Product & {
  variants: ProductVariant[];
  images: ProductImage[];
};

export interface ListProductsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  includeInactive?: boolean;
  search?: string;
}

export interface PaginatedProductsResult {
  products: ProductWithVariantsAndImages[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}
