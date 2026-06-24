import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { z } from "zod";
import { phoneSchema, textField } from "@/lib/validation/common";

export const ProfileUpdateSchema = z.object({
  name: textField("Name", 100),
  phone: phoneSchema,
});

export async function updateUserProfile(userId: string, data: { name: string; phone: string }) {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  const parsed = ProfileUpdateSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid profile data",
      400
    );
  }

  const { name, phone } = parsed.data;

  // Check phone uniqueness if it's changing
  const existingWithPhone = await prisma.user.findFirst({
    where: {
      phone,
      id: { not: userId },
    },
  });

  if (existingWithPhone) {
    throw new AppError("CONFLICT", "An account with this phone number already exists.", 409);
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      name,
      phone,
    },
  });
}
