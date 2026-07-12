"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function openMaintenance(formData: FormData) {
  const vehicleId = formData.get("vehicle_id") as string;
  const description = formData.get("description") as string;
  const cost = Number(formData.get("cost") || 0);

  if (!vehicleId || !description) {
    return { error: "Vehicle and description are required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("maintenance_logs").insert({
    vehicle_id: vehicleId,
    description: description,
    cost: cost,
    status: "active"
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/maintenance");
  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function closeMaintenance(logId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("maintenance_logs").update({ status: "closed" }).eq("id", logId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/maintenance");
  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
  return { success: true };
}
