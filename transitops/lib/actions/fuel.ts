"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createFuelLog(formData: FormData) {
  const supabase = await createClient();

  const vehicle_id = formData.get("vehicle_id") as string;
  const trip_id = formData.get("trip_id") as string || null;
  const type = formData.get("type") as string;
  const liters = formData.get("liters") ? parseFloat(formData.get("liters") as string) : null;
  const cost = parseFloat(formData.get("cost") as string);
  const log_date = formData.get("log_date") as string;

  const { error } = await supabase.from("fuel_logs").insert({
    vehicle_id,
    trip_id,
    type,
    liters,
    cost,
    log_date,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/fuel");
  return { success: true };
}

export async function deleteFuelLog(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("fuel_logs").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/fuel");
  return { success: true };
}
