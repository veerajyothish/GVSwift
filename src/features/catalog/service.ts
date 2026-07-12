import { AppError } from "@/lib/errors";
import * as repository from "./repository";
import { CreateProductSchema, ProductQuerySchema, UpdateProductSchema, CreateShopSchema, UpdateShopSchema } from "./validation";
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
    shopId: parsed.data.shopId,
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

  // Check for duplicate SKUs within the request itself
  if (parsed.data.variants && parsed.data.variants.length > 0) {
    const skusInRequest = parsed.data.variants.map((v) => v.sku);
    const uniqueSkusInRequest = new Set(skusInRequest);
    if (skusInRequest.length !== uniqueSkusInRequest.size) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Duplicate SKUs are not allowed within the same product.",
        400
      );
    }

    // Check if any variant SKU is already taken by another product
    const duplicateSkus = await repository.getDuplicateSkus(skusInRequest);
    if (duplicateSkus.length > 0) {
      throw new AppError(
        "CONFLICT",
        `Variant SKU '${duplicateSkus[0]}' is already in use by another product.`,
        409
      );
    }
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
 * Hard deletes a product (Admin action).
 */
export async function adminHardDeleteProduct(id: string) {
  if (!id) {
    throw new AppError("VALIDATION_ERROR", "Product ID is required", 400);
  }
  
  try {
    await repository.hardDeleteProduct(id);
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message.includes("Cannot permanently delete")) {
      throw new AppError("CONFLICT", error.message, 409);
    }
    throw error;
  }
}

/**
 * Returns active related products in the same category.
 */
export async function getRelatedProducts(categoryId: string, excludeProductId: string, limit = 4) {
  if (!categoryId) return [];
  return repository.getRelatedProducts(categoryId, excludeProductId, limit);
}

// --- Shop Service Actions ---

export async function getShops(query: { isActive?: boolean; isFeatured?: boolean } = {}) {
  return repository.listShops(query);
}

export async function getShopBySlug(slug: string) {
  if (!slug) {
    throw new AppError("VALIDATION_ERROR", "Shop slug is required", 400);
  }
  const shop = await repository.getShopBySlug(slug);
  if (!shop) {
    throw new AppError("NOT_FOUND", "Shop not found", 404);
  }
  return shop;
}

export async function getCategoriesForShop(shopId: string) {
  if (!shopId) {
    throw new AppError("VALIDATION_ERROR", "Shop ID is required", 400);
  }
  return repository.listCategoriesForShop(shopId);
}

export async function getShopById(id: string) {
  if (!id) {
    throw new AppError("VALIDATION_ERROR", "Shop ID is required", 400);
  }
  const shop = await repository.getShopById(id);
  if (!shop) {
    throw new AppError("NOT_FOUND", "Shop not found", 404);
  }
  return shop;
}

export async function adminCreateShop(input: unknown) {
  const parsed = CreateShopSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid shop data",
      400
    );
  }

  // Check unique slug
  const existing = await repository.getShopBySlug(parsed.data.slug);
  if (existing) {
    throw new AppError(
      "CONFLICT",
      "A shop with this slug already exists.",
      409
    );
  }

  return repository.createShop(parsed.data);
}

export async function adminUpdateShop(id: string, input: unknown) {
  if (!id) {
    throw new AppError("VALIDATION_ERROR", "Shop ID is required", 400);
  }

  const parsed = UpdateShopSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid shop data",
      400
    );
  }

  const existing = await repository.getShopById(id);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Shop not found", 404);
  }

  // Check unique slug if slug is being updated
  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const slugOwner = await repository.getShopBySlug(parsed.data.slug);
    if (slugOwner) {
      throw new AppError(
        "CONFLICT",
        "A shop with this slug already exists.",
        409
      );
    }
  }

  return repository.updateShop(id, parsed.data);
}

