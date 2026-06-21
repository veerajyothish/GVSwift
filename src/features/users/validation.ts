/**
 * features/users/validation.ts — Validation schemas for address management
 */

import { z } from "zod";
import { pincodeSchema, phoneSchema, textField } from "@/lib/validation/common";

export const AddressSchema = z.object({
  fullName: textField("Full name", 100),
  line1: textField("Address line 1", 200),
  line2: z
    .string()
    .trim()
    .max(200, "Address line 2 must be at most 200 characters")
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  city: textField("City", 100),
  state: textField("State", 100),
  pincode: pincodeSchema,
  phone: phoneSchema,
  isDefault: z.boolean().optional().default(false),
});

export const CreateAddressSchema = AddressSchema;

export const UpdateAddressSchema = AddressSchema.partial();
