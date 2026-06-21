/**
 * POST /api/v1/admin/products/upload
 *
 * Secure server-side image upload endpoint. Requires ADMIN role.
 * Enforces:
 *   - MIME type allowlist: image/jpeg, image/png, image/webp (rejects image/svg+xml and everything else)
 *   - File signature verification (magic numbers) to reject renamed executables/scripts
 *   - Max file size: 5MB
 *   - Stores in Supabase Storage 'product-images' bucket
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { toSafeError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate & Authorize Admin
    const { errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    // 2. Read Multipart Form Data
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { error: "Invalid multipart form data", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No file provided in field 'file'", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // 3. Size Validation (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB limit", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // 4. File Signature/Magic Numbers Validation
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imageType = detectImageMimeType(buffer);
    if (!imageType) {
      return NextResponse.json(
        { error: "Disallowed or invalid file type. Only JPEG, PNG, and WEBP images are accepted.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // 5. Upload to Supabase Storage using Admin Client
    const supabase = createSupabaseAdminClient();
    const fileName = `${crypto.randomUUID()}.${imageType.ext}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, buffer, {
        contentType: imageType.mime,
        duplex: "half",
      });

    if (uploadError) {
      console.error("[StorageUpload] Supabase upload failed:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image to storage server.", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    // 6. Get Public URL
    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return NextResponse.json(
      {
        url: urlData.publicUrl,
        filePath,
      },
      { status: 200 }
    );
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}

/**
 * Validates the file header magic numbers for JPEG, PNG, and WEBP.
 * Returns the detected mime type and extension, or null if invalid.
 */
function detectImageMimeType(buffer: Buffer): { mime: string; ext: string } | null {
  if (buffer.length < 4) return null;

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { mime: "image/png", ext: "png" };
  }

  // JPEG: FF D8
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  // WEBP: Starts with 'RIFF' and has 'WEBP' at offset 8
  if (
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46    // F
  ) {
    if (
      buffer.length >= 12 &&
      buffer[8] === 0x57 && // W
      buffer[9] === 0x45 && // E
      buffer[10] === 0x42 && // B
      buffer[11] === 0x50   // P
    ) {
      return { mime: "image/webp", ext: "webp" };
    }
  }

  return null;
}

