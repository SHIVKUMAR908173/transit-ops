"use server";

import { createClient } from "@/lib/supabase/server";
import { vehicleSchema } from "@/lib/validations/vehicle";
import { revalidatePath } from "next/cache";

export async function createVehicle(formData: FormData) {
  const raw = {
    registration_number: formData.get("registration_number") as string,
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    max_load_kg: Number(formData.get("max_load_kg")),
    odometer: Number(formData.get("odometer") || 0),
    acquisition_cost: formData.get("acquisition_cost")
      ? Number(formData.get("acquisition_cost"))
      : null,
  };

  const parsed = vehicleSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("vehicles").insert({
    registration_number: parsed.data.registration_number,
    name: parsed.data.name,
    type: parsed.data.type,
    max_load_kg: parsed.data.max_load_kg,
    odometer: parsed.data.odometer,
    acquisition_cost: parsed.data.acquisition_cost,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A vehicle with this registration number already exists." };
    }
    return { error: error.message };
  }

  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateVehicle(id: string, formData: FormData) {
  const raw = {
    registration_number: formData.get("registration_number") as string,
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    max_load_kg: Number(formData.get("max_load_kg")),
    odometer: Number(formData.get("odometer") || 0),
    acquisition_cost: formData.get("acquisition_cost")
      ? Number(formData.get("acquisition_cost"))
      : null,
  };

  const parsed = vehicleSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("vehicles")
    .update({
      registration_number: parsed.data.registration_number,
      name: parsed.data.name,
      type: parsed.data.type,
      max_load_kg: parsed.data.max_load_kg,
      odometer: parsed.data.odometer,
      acquisition_cost: parsed.data.acquisition_cost,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "A vehicle with this registration number already exists." };
    }
    return { error: error.message };
  }

  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
  return { success: true };
}
