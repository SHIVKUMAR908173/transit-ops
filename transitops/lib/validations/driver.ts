import { z } from "zod";

export const driverSchema = z.object({
  name: z
    .string()
    .min(1, "Driver name is required")
    .max(100, "Name too long"),
  license_number: z
    .string()
    .min(1, "License number is required")
    .max(30, "License number too long"),
  license_category: z
    .string()
    .nullable()
    .optional(),
  license_expiry: z
    .string()
    .min(1, "License expiry date is required"),
  contact_number: z
    .string()
    .nullable()
    .optional(),
  safety_score: z
    .number()
    .min(0, "Score cannot be negative")
    .max(100, "Score cannot exceed 100")
    .default(100),
});

export type DriverFormData = z.infer<typeof driverSchema>;
