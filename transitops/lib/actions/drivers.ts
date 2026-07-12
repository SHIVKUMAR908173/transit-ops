"use server";

import { createClient } from "@/lib/supabase/server";
import { driverSchema } from "@/lib/validations/driver";
import { revalidatePath } from "next/cache";

export async function createDriver(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    license_number: formData.get("license_number") as string,
    license_category: (formData.get("license_category") as string) || null,
    license_expiry: formData.get("license_expiry") as string,
    contact_number: (formData.get("contact_number") as string) || null,
    safety_score: Number(formData.get("safety_score") || 100),
  };

  const parsed = driverSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("drivers").insert({
    name: parsed.data.name,
    license_number: parsed.data.license_number,
    license_category: parsed.data.license_category,
    license_expiry: parsed.data.license_expiry,
    contact_number: parsed.data.contact_number,
    safety_score: parsed.data.safety_score,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/drivers");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateDriver(id: string, formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    license_number: formData.get("license_number") as string,
    license_category: (formData.get("license_category") as string) || null,
    license_expiry: formData.get("license_expiry") as string,
    contact_number: (formData.get("contact_number") as string) || null,
    safety_score: Number(formData.get("safety_score") || 100),
  };

  const parsed = driverSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("drivers")
    .update({
      name: parsed.data.name,
      license_number: parsed.data.license_number,
      license_category: parsed.data.license_category,
      license_expiry: parsed.data.license_expiry,
      contact_number: parsed.data.contact_number,
      safety_score: parsed.data.safety_score,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/drivers");
  revalidatePath("/dashboard");
  return { success: true };
}
