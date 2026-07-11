/**
 * PUT /api/v1/admin/products/[id]
 * DELETE /api/v1/admin/products/[id]
 *
 * Handles updating and deactivating products. Requires ADMIN role.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { adminDeleteProduct } from "@/features/catalog/service";
import { prisma } from "@/lib/prisma";
import { toSafeError } from "@/lib/errors";
import { EditProductSchema } from "@/features/catalog/validation";
import { invalidateProductCache } from "@/features/catalog/repository";
import { logAuditEvent } from "@/features/admin/audit-log";
import { revalidatePath } from "next/cache";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Validate body using EditProductSchema
    const parsed = EditProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid product data", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (parsed.data.variants && parsed.data.variants.length > 0) {
      const skusInRequest = parsed.data.variants.map((v) => v.sku);
      const uniqueSkusInRequest = new Set(skusInRequest);
      if (skusInRequest.length !== uniqueSkusInRequest.size) {
        return NextResponse.json(
          { error: "Duplicate SKUs are not allowed within the same product.", code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }

      // Check if any variant SKU is already taken by a variant of another product
      const duplicates = await prisma.productVariant.findMany({
        where: {
          sku: { in: skusInRequest },
          productId: { not: id },
        },
        select: { sku: true },
      });
      if (duplicates.length > 0) {
        return NextResponse.json(
          { error: `Variant SKU '${duplicates[0].sku}' is already in use by another product.`, code: "CONFLICT" },
          { status: 409 }
        );
      }
    }


    // Critical security check: max 8 images per product
    if (body.images && Array.isArray(body.images) && body.images.length > 8) {
      return NextResponse.json(
        { error: "A product can have a maximum of 8 images.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Critical security check: alt text is required per image
    if (body.images && Array.isArray(body.images)) {
      for (const img of body.images) {
        if (!img.altText || typeof img.altText !== "string" || img.altText.trim() === "") {
          return NextResponse.json(
            { error: "Alt text is required for every uploaded image.", code: "VALIDATION_ERROR" },
            { status: 400 }
          );
        }
      }
    }

    const oldProduct = await prisma.product.findUnique({
      where: { id },
      select: { slug: true },
    });

    // Transaction to update product details, sync variants and images
    const updatedProduct = await prisma.$transaction(
      async (tx) => {
        // 1. Update basic product details
        await tx.product.update({
          where: { id },
          data: {
            name: body.name,
            slug: body.slug,
            brand: body.brand,
            description: body.description,
            basePricePaise: body.basePricePaise,
            isActive: body.isActive,
            categoryId: body.categoryId,
            shopId: body.shopId,
          },
        });

        // 2. Sync variants if provided
        if (body.variants && Array.isArray(body.variants)) {
          const existingVariants = await tx.productVariant.findMany({
            where: { productId: id },
          });
          const existingIds = existingVariants.map((v) => v.id);
          const incomingIds = body.variants.map((v: { id?: string }) => v.id).filter(Boolean);

          // Delete variants that are no longer present (fall back to stock: 0 if restricted)
          const toDeleteIds = existingIds.filter((eid) => !incomingIds.includes(eid));
          for (const deleteId of toDeleteIds) {
            try {
              await tx.productVariant.delete({ where: { id: deleteId } });
            } catch {
              await tx.productVariant.update({
                where: { id: deleteId },
                data: { stock: 0 },
              });
            }
          }

          // Upsert incoming variants
          for (const variant of body.variants) {
            if (variant.id) {
              await tx.productVariant.update({
                where: { id: variant.id },
                data: {
                  sku: variant.sku,
                  stock: variant.stock,
                  priceDeltaPaise: variant.priceDeltaPaise,
                },
              });
            } else {
              await tx.productVariant.create({
                data: {
                  productId: id,
                  sku: variant.sku,
                  stock: variant.stock,
                  priceDeltaPaise: variant.priceDeltaPaise,
                },
              });
            }
          }
        }

        // 3. Sync images if provided (delete all and recreate)
        if (body.images && Array.isArray(body.images)) {
          await tx.productImage.deleteMany({
            where: { productId: id },
          });

          if (body.images.length > 0) {
            await tx.productImage.createMany({
              data: body.images.map((img: { url: string; altText?: string | null; isPrimary?: boolean; sortOrder?: number }) => ({
                productId: id,
                url: img.url,
                altText: img.altText,
                isPrimary: img.isPrimary ?? false,
                sortOrder: img.sortOrder ?? 0,
              })),
            });
          }
        }

        return tx.product.findUnique({
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
        });
      },
      {
        timeout: 20000,
      }
    );

    if (oldProduct) {
      await invalidateProductCache(oldProduct.slug);
    }
    if (updatedProduct) {
      await invalidateProductCache(updatedProduct.slug);
    }

    if (updatedProduct) {
      logAuditEvent({
        actorId: user?.id ?? "",
        action: "PRODUCT_UPDATE",
        targetType: "PRODUCT",
        targetId: id,
        details: {
          name: updatedProduct.name,
          slug: updatedProduct.slug,
        },
      });
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");
    if (updatedProduct) {
      revalidatePath(`/products/${updatedProduct.slug}`);
      if (updatedProduct.shopId) {
        revalidatePath(`/shops/${updatedProduct.shopId}`);
      }
    }
    if (oldProduct && oldProduct.slug !== updatedProduct?.slug) {
      revalidatePath(`/products/${oldProduct.slug}`);
    }
    revalidatePath("/");

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const product = await adminDeleteProduct(id);
    if (product) {
      await invalidateProductCache(product.slug);
      logAuditEvent({
        actorId: user?.id ?? "",
        action: "PRODUCT_DELETE",
        targetType: "PRODUCT",
        targetId: id,
        details: {
          name: product.name,
          slug: product.slug,
        },
      });
      revalidatePath("/admin/products");
      revalidatePath("/products");
      revalidatePath(`/products/${product.slug}`);
      if (product.shopId) {
        revalidatePath(`/shops/${product.shopId}`);
      }
      revalidatePath("/");
    }

    return NextResponse.json(
      { message: "Product deactivated successfully", product },
      { status: 200 }
    );
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
