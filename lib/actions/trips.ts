"use server";

import { createClient } from "@/lib/supabase/server";
import { tripSchema } from "@/lib/validations/trip";
import { revalidatePath } from "next/cache";

export async function createTrip(formData: FormData) {
  const raw = {
    source: formData.get("source") as string,
    destination: formData.get("destination") as string,
    vehicle_id: formData.get("vehicle_id") as string,
    driver_id: formData.get("driver_id") as string,
    cargo_weight_kg: Number(formData.get("cargo_weight_kg")),
    planned_distance_km: formData.get("planned_distance_km")
      ? Number(formData.get("planned_distance_km"))
      : null,
  };

  const parsed = tripSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Verify vehicle capacity
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("max_load_kg, status")
    .eq("id", parsed.data.vehicle_id)
    .single();

  if (!vehicle) {
    return { error: "Selected vehicle not found." };
  }

  if (vehicle.status !== "available") {
    return { error: "Selected vehicle is not available." };
  }

  if (parsed.data.cargo_weight_kg > vehicle.max_load_kg) {
    return {
      error: `Cargo weight (${parsed.data.cargo_weight_kg} kg) exceeds vehicle capacity (${vehicle.max_load_kg} kg).`,
    };
  }

  // Verify driver availability
  const { data: driver } = await supabase
    .from("drivers")
    .select("status, license_expiry")
    .eq("id", parsed.data.driver_id)
    .single();

  if (!driver) {
    return { error: "Selected driver not found." };
  }

  if (driver.status !== "available") {
    return { error: "Selected driver is not available." };
  }

  if (new Date(driver.license_expiry) < new Date()) {
    return { error: "Selected driver's license has expired." };
  }

  const { error } = await supabase.from("trips").insert({
    source: parsed.data.source,
    destination: parsed.data.destination,
    vehicle_id: parsed.data.vehicle_id,
    driver_id: parsed.data.driver_id,
    cargo_weight_kg: parsed.data.cargo_weight_kg,
    planned_distance_km: parsed.data.planned_distance_km,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/trips");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function dispatchTrip(tripId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("trips").update({ status: "dispatched" }).eq("id", tripId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/trips");
  revalidatePath("/vehicles");
  revalidatePath("/drivers");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function completeTrip(tripId: string, formData: FormData) {
  const actualDistance = Number(formData.get("actual_distance_km") || 0);
  const fuelConsumed = Number(formData.get("fuel_consumed_l") || 0);

  const supabase = await createClient();

  const { error } = await supabase.from("trips").update({ 
    status: "completed",
    actual_distance_km: actualDistance,
    fuel_consumed_l: fuelConsumed
  }).eq("id", tripId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/trips");
  revalidatePath("/vehicles");
  revalidatePath("/drivers");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function cancelTrip(tripId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("trips").update({ status: "cancelled" }).eq("id", tripId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/trips");
  revalidatePath("/vehicles");
  revalidatePath("/drivers");
  revalidatePath("/dashboard");
  return { success: true };
}
