import { AppError } from "@/lib/errors";
import * as repository from "./repository";
import { CreateProductSchema, ProductQuerySchema, UpdateProductSchema } from "./validation";
import { ListProductsParams } from "./types";

/**
 * Validates request query params and returns paginated products.
 */
export async function getProducts(query: unknown) {
  const parsed = ProductQuerySchema.safeParse(query);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid query parameters",
      400
    );
  }

  const params: ListProductsParams = {
    page: parsed.data.page,
    limit: parsed.data.limit,
    categoryId: parsed.data.categoryId,
    search: parsed.data.search,
    sort: parsed.data.sort,
    maxPrice: parsed.data.maxPrice,
  };

  return repository.listProducts(params);
}

/**
 * Returns a single product by slug. Throws 404 if not found or inactive.
 */
export async function getProductBySlug(slug: string) {
  if (!slug) {
    throw new AppError("VALIDATION_ERROR", "Slug is required", 400);
  }

  const product = await repository.getProductBySlug(slug);
  if (!product) {
    throw new AppError("NOT_FOUND", "Product not found", 404);
  }

  return product;
}

/**
 * Returns a single product by ID. Throws 404 if not found or inactive.
 */
export async function getProductById(id: string) {
  if (!id) {
    throw new AppError("VALIDATION_ERROR", "Product ID is required", 400);
  }

  const product = await repository.getProductById(id);
  if (!product) {
    throw new AppError("NOT_FOUND", "Product not found", 404);
  }

  return product;
}

/**
 * Returns all active categories.
 */
export async function getCategories() {
  return repository.listCategories();
}

/**
 * Creates a new product (Admin action).
 */
export async function adminCreateProduct(input: unknown) {
  const parsed = CreateProductSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid product data",
      400
    );
  }

  // Check if slug is already taken
  const existing = await repository.getProductBySlug(parsed.data.slug, true);
  if (existing) {
    throw new AppError(
      "CONFLICT",
      "A product with this slug already exists.",
      409
    );
  }

  return repository.createProduct(parsed.data);
}

/**
 * Updates a product (Admin action).
 */
export async function adminUpdateProduct(id: string, input: unknown) {
  if (!id) {
    throw new AppError("VALIDATION_ERROR", "Product ID is required", 400);
  }

  const parsed = UpdateProductSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid product data",
      400
    );
  }

  // Check if the product exists
  const existing = await repository.getProductById(id, true);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Product not found", 404);
  }

  // If updating slug, make sure it is not taken
  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const slugOwner = await repository.getProductBySlug(parsed.data.slug, true);
    if (slugOwner) {
      throw new AppError(
        "CONFLICT",
        "A product with this slug already exists.",
        409
      );
    }
  }

  return repository.updateProduct(id, parsed.data);
}

/**
 * Soft deletes a product (Admin action).
 */
export async function adminDeleteProduct(id: string) {
  if (!id) {
    throw new AppError("VALIDATION_ERROR", "Product ID is required", 400);
  }

  const existing = await repository.getProductById(id, true);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Product not found", 404);
  }

  return repository.softDeleteProduct(id);
}

/**
 * Returns active related products in the same category.
 */
export async function getRelatedProducts(categoryId: string, excludeProductId: string, limit = 4) {
  if (!categoryId) return [];
  return repository.getRelatedProducts(categoryId, excludeProductId, limit);
}
