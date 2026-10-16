import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { localStore, OWNER_ADMIN_EMAIL } from "@/lib/storage/localState";
import type { FitnessGoalType } from "@/types/user";

export function mapFitnessGoalToPrimaryGoal(goal?: string | null): FitnessGoalType {
  if (!goal) return "maintain_fitness";
  const normalized = goal.toLowerCase().trim();
  if (normalized.includes("lose") || normalized.includes("fat") || normalized.includes("weight")) {
    return "fat_loss";
  }
  if (normalized.includes("muscle") || normalized.includes("build") || normalized.includes("hypertrophy")) {
    return "muscle_gain";
  }
  if (normalized.includes("endurance") || normalized.includes("stamina") || normalized.includes("cardio")) {
    return "general_fitness_stamina";
  }
  if (normalized.includes("strength")) {
    return "strength_improvement";
  }
  return "maintain_fitness";
}

/**
 * On first login after confirmation (or any login/auth callback),
 * saves full_name, fitness_goal, and target_weight_kg into the existing
 * public.profiles table in Supabase and syncs local storage.
 */
export async function syncProfileFromUserMetadata(user: User): Promise<void> {
  const meta = user.user_metadata || {};
  const fullName =
    meta.full_name ||
    meta.name ||
    (user.email ? user.email.split("@")[0] : "Athlete");
  const fitnessGoal = meta.fitness_goal || "Stay fit";
  const targetWeightKg =
    meta.target_weight_kg != null ? Number(meta.target_weight_kg) : null;

  const isOwner =
    Boolean(user.email) &&
    user.email!.toLowerCase().trim() === OWNER_ADMIN_EMAIL.toLowerCase();

  const primaryGoal = mapFitnessGoalToPrimaryGoal(fitnessGoal);

  // Sync locally first
  localStore.saveUser({
    id: user.id,
    email: user.email || "",
    name: fullName,
    fullName: fullName,
    fitnessGoal: fitnessGoal,
    targetWeightKg: targetWeightKg || undefined,
    primaryGoal,
    weightKg: targetWeightKg || 75,
    isAdmin: isOwner,
  });

  // If Supabase is configured, sync to public.profiles table
  if (isSupabaseConfigured && supabase) {
    try {
      const payload: Record<string, any> = {
        id: user.id,
        email: user.email,
        name: fullName,
        full_name: fullName,
        fitness_goal: fitnessGoal,
        target_weight_kg: targetWeightKg,
        primary_goal: primaryGoal,
        updated_at: new Date().toISOString(),
      };

      if (targetWeightKg) {
        payload.weight_kg = targetWeightKg;
      }

      // Upsert into existing profiles table
      const { error } = await supabase.from("profiles").upsert(payload, {
        onConflict: "id",
      });

      if (error) {
        console.warn("Could not upsert profile to Supabase:", error.message);
      }
    } catch (err) {
      console.error("Error syncing profile to Supabase profiles table:", err);
    }
  }
}
