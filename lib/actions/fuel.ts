"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createFuelLog(formData: FormData) {
  const supabase = await createClient();

  const vehicle_id = formData.get("vehicle_id") as string;
  const trip_id = formData.get("trip_id") as string;
  const type = formData.get("type") as string;
  const litersStr = formData.get("liters") as string;
  const costStr = formData.get("cost") as string;
  const log_date = formData.get("log_date") as string;

  if (!vehicle_id) {
    return { error: "Vehicle is required." };
  }
  if (!costStr) {
    return { error: "Cost is required." };
  }

  const cost = parseFloat(costStr);
  if (isNaN(cost)) {
    return { error: "Cost must be a valid number." };
  }

  const liters = litersStr ? parseFloat(litersStr) : null;

  const insertData: any = {
    vehicle_id,
    type: type || 'fuel',
    cost,
  };

  if (trip_id && trip_id.trim() !== "") {
    insertData.trip_id = trip_id;
  }
  if (liters !== null && !isNaN(liters)) {
    insertData.liters = liters;
  }
  if (log_date) {
    insertData.log_date = log_date;
  }

  const { error } = await supabase.from("fuel_logs").insert(insertData);

  if (error) {
    console.error("Fuel Log Insert Error:", error);
    return { error: error.message };
  }

  revalidatePath("/fuel");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { success: true };
}

export async function deleteFuelLog(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("fuel_logs").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/fuel");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { success: true };
}
