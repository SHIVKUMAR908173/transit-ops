import { z } from "zod";

export const tripSchema = z.object({
  source: z
    .string()
    .min(1, "Source is required"),
  destination: z
    .string()
    .min(1, "Destination is required"),
  vehicle_id: z
    .string()
    .uuid("Please select a vehicle"),
  driver_id: z
    .string()
    .uuid("Please select a driver"),
  cargo_weight_kg: z
    .number()
    .positive("Cargo weight must be positive"),
  planned_distance_km: z
    .number()
    .positive("Distance must be positive")
    .nullable()
    .optional(),
});

export type TripFormData = z.infer<typeof tripSchema>;
