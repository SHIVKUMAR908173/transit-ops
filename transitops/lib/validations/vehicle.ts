import { z } from "zod";

export const vehicleSchema = z.object({
  registration_number: z
    .string()
    .min(1, "Registration number is required")
    .max(20, "Registration number too long"),
  name: z
    .string()
    .min(1, "Vehicle name is required")
    .max(100, "Name too long"),
  type: z
    .string()
    .min(1, "Vehicle type is required"),
  max_load_kg: z
    .number()
    .positive("Max load must be positive"),
  odometer: z
    .number()
    .min(0, "Odometer cannot be negative")
    .default(0),
  acquisition_cost: z
    .number()
    .min(0, "Cost cannot be negative")
    .nullable()
    .optional(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
