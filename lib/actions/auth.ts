"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Surface the real error — "Email not confirmed" is a common one
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Email not confirmed yet. Check your inbox, or ask your admin to confirm your account in the Supabase dashboard." };
    }
    if (error.message.toLowerCase().includes("invalid login")) {
      return { error: "Invalid email or password. Please try again." };
    }
    return { error: error.message };
  }

  if (!data.session) {
    return { error: "Login succeeded but no session was created. Please try again." };
  }

  return { success: true };
}

export async function signUp(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "An account with this email already exists. Please sign in instead." };
    }
    return { error: error.message };
  }

  // If session exists → email confirmation is disabled (or auto-confirmed). Log them in.
  if (data.session) {
    return { success: true };
  }

  // No session → Supabase sent a confirmation email
  return {
    error: "Account created! Check your email to confirm your account, then come back and sign in.\n\nTip: If you don't see it, check spam. Or go to Supabase → Authentication → Users and manually confirm.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getUserRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Default to fleet_manager if the table doesn't exist yet or no row
  return (profile?.role as string) ?? "fleet_manager";
}
