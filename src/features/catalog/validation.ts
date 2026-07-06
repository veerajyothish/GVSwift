import { z } from "zod";

export const ProductQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : undefined)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, Math.min(100, parseInt(val, 10))) : undefined)),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  search: z.string().max(100, "Search query too long").optional(),
  sort: z.string().optional(),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(0, parseInt(val, 10)) : undefined)),
  shopId: z.string().uuid("Invalid shop ID").optional(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  brand: z.string().max(100, "Brand name cannot exceed 100 characters").nullable().optional(),
  description: z.string().max(2000, "Description cannot exceed 2000 characters").nullable().optional(),
  basePricePaise: z.number().int("Price must be an integer").nonnegative("Price cannot be negative"),
  isActive: z.boolean().optional(),
  categoryId: z.string().uuid("Invalid category ID").nullable().optional(),
  shopId: z.string().uuid("Invalid shop ID").nullable().optional(),
  variants: z
    .array(
      z.object({
        sku: z.string().min(3, "SKU must be at least 3 characters").max(50),
        stock: z.number().int("Stock must be an integer").nonnegative("Stock cannot be negative"),
        priceDeltaPaise: z.number().int("Price delta must be an integer"),
      })
    )
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string().url("Invalid image URL"),
        altText: z.string().max(200, "Alt text too long").nullable().optional(),
        isPrimary: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial().omit({
  variants: true,
  images: true,
});

export const EditProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters").max(100).optional(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens")
    .optional(),
  brand: z.string().max(100, "Brand name cannot exceed 100 characters").nullable().optional(),
  description: z.string().max(2000, "Description cannot exceed 2000 characters").nullable().optional(),
  basePricePaise: z.number().int("Price must be an integer").nonnegative("Price cannot be negative").optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().uuid("Invalid category ID").nullable().optional(),
  shopId: z.string().uuid("Invalid shop ID").nullable().optional(),
  variants: z
    .array(
      z.object({
        id: z.string().uuid("Invalid variant ID").optional(),
        sku: z.string().min(3, "SKU must be at least 3 characters").max(50),
        stock: z.number().int("Stock must be an integer").nonnegative("Stock cannot be negative"),
        priceDeltaPaise: z.number().int("Price delta must be an integer"),
      })
    )
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string().url("Invalid image URL"),
        altText: z.string().max(200, "Alt text too long").nullable().optional(),
        isPrimary: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .optional(),
});

export const CreateShopSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  brandImage: z.string().url("Invalid brand image URL"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  tagline: z.string().max(200, "Tagline cannot exceed 200 characters").nullable().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const UpdateShopSchema = CreateShopSchema.partial();


