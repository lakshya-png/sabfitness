import type {
  FitnessGoalType,
  ActivityLevel,
  DietaryPreference,
  NutritionCalculationResult,
  GoalRoadmapResult,
  RoadmapMilestone,
  WorkoutGoalSuggestion,
} from "@/types/user";
import type { BodyMeasurement } from "@/types/progress";

// Estimate One Rep Max (1RM) using Brzycki and Epley
export function calculateEstimated1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;

  // Brzycki formula
  const brzycki = weightKg / (1.0278 - 0.0278 * Math.min(reps, 15));
  // Epley formula
  const epley = weightKg * (1 + 0.0333 * reps);

  // Return realistic rounded average
  return Math.round(((brzycki + epley) / 2) * 10) / 10;
}

/**
 * Basal Metabolic Rate (Mifflin-St Jeor Equation)
 * Validated clinical formula for estimating resting metabolic energy.
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female" | "other" | "prefer_not_to_say" = "male"
): number {
  const safeWeight = Math.max(30, weightKg);
  const safeHeight = Math.max(100, heightCm);
  const safeAge = Math.max(12, age);

  const base = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge;
  const bmr = gender === "female" ? base - 161 : base + 5;
  return Math.round(bmr);
}

// Physical Activity Level (PAL) standard multipliers
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

/**
 * Total Daily Energy Expenditure (TDEE) with workout frequency tuning
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: ActivityLevel,
  workoutFrequencyPerWeek: number = 3
): number {
  let multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.4;

  // Fine-tune slightly based on verified workout frequency
  if (workoutFrequencyPerWeek >= 6 && activityLevel !== "extra_active") {
    multiplier = Math.min(1.85, multiplier + 0.075);
  } else if (workoutFrequencyPerWeek <= 1 && activityLevel !== "sedentary") {
    multiplier = Math.max(1.2, multiplier - 0.05);
  }

  return Math.round(bmr * multiplier);
}

export interface PersonalizedNutritionParams {
  weightKg: number;
  heightCm: number;
  age: number;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  activityLevel: ActivityLevel;
  workoutFrequencyPerWeek?: number;
  primaryGoal: FitnessGoalType;
  dietaryPreference?: DietaryPreference;
  goalWeightKg?: number;
  targetDate?: string;
  currentDate?: string;
}

/**
 * Comprehensive Evidence-Based Nutrition & Calorie Calculation
 * Incorporates strict adolescent/minor protections, safety floors, and internal consistency.
 */
export function calculatePersonalizedNutrition(
  params: PersonalizedNutritionParams
): NutritionCalculationResult {
  const {
    weightKg,
    heightCm,
    age,
    gender = "male",
    activityLevel,
    workoutFrequencyPerWeek = 4,
    primaryGoal,
    dietaryPreference = "non_vegetarian",
  } = params;

  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel, workoutFrequencyPerWeek);
  const isMinor = age < 18;

  let calorieAdjustment = 0;
  let adjustmentType: "deficit" | "surplus" | "maintenance" = "maintenance";
  let targetCalories = tdee;
  let safeCalorieTargetProvided = true;
  let minorGuidance: string | undefined = undefined;

  // --- MINOR / ADOLESCENT SAFETY CHECK (< 18) ---
  if (isMinor) {
    if (primaryGoal === "fat_loss") {
      // Strictly prevent calorie deficits for individuals under 18!
      safeCalorieTargetProvided = false;
      adjustmentType = "maintenance";
      calorieAdjustment = 0;
      targetCalories = tdee;
      minorGuidance =
        "For athletes and youth under 18, restrictive calorie deficits or rapid weight-loss targets are not recommended due to critical pubertal growth, hormonal development, and bone mineral accrual demands. We advise focusing on nutrient-dense whole foods, hydration, regular athletics, and consulting a pediatrician or registered sports dietitian.";
    } else if (primaryGoal === "muscle_gain") {
      // Conservative growth-support surplus
      adjustmentType = "surplus";
      calorieAdjustment = 200;
      targetCalories = tdee + calorieAdjustment;
      minorGuidance =
        "For developing youth athletes, lean growth is supported by balanced meals, adequate sleep, and consistent training without extreme hyper-caloric bulking.";
    } else {
      adjustmentType = "maintenance";
      calorieAdjustment = 0;
      targetCalories = tdee;
      minorGuidance =
        "Focus on athletic stamina, foundational strength, hydration, and wholesome balanced meals.";
    }
  } else {
    // --- ADULT CALCULATIONS ---
    switch (primaryGoal) {
      case "fat_loss": {
        adjustmentType = "deficit";
        // Conservative ~15-20% deficit, bounded between 300 and 500 kcal/day
        const rawDeficit = Math.round(tdee * 0.18);
        calorieAdjustment = -Math.min(500, Math.max(300, rawDeficit));

        // Absolute Safety Floors: Women: 1200 kcal, Men: 1500 kcal
        const minFloor = gender === "female" ? 1200 : 1500;
        targetCalories = Math.max(minFloor, tdee + calorieAdjustment);
        calorieAdjustment = targetCalories - tdee;
        break;
      }
      case "muscle_gain": {
        adjustmentType = "surplus";
        // Lean hypertrophy surplus: +250 to +350 kcal/day (approx 10% surplus)
        const rawSurplus = Math.round(tdee * 0.10);
        calorieAdjustment = Math.min(380, Math.max(250, rawSurplus));
        targetCalories = tdee + calorieAdjustment;
        break;
      }
      case "strength_improvement": {
        adjustmentType = "surplus";
        calorieAdjustment = 200;
        targetCalories = tdee + calorieAdjustment;
        break;
      }
      case "maintain_fitness":
      case "general_fitness_stamina":
      case "improve_consistency":
      case "custom":
      default: {
        adjustmentType = "maintenance";
        calorieAdjustment = 0;
        targetCalories = tdee;
        break;
      }
    }
  }

  // --- EVIDENCE-BASED MACRONUTRIENT DISTRIBUTION ---
  // Protein per kg of bodyweight
  let proteinPerKg = 1.6;
  if (primaryGoal === "fat_loss") {
    proteinPerKg = isMinor ? 1.5 : 2.0; // Preserves lean mass during deficit
  } else if (primaryGoal === "muscle_gain") {
    proteinPerKg = isMinor ? 1.6 : 1.9; // Maximizes muscle protein synthesis
  } else if (primaryGoal === "strength_improvement") {
    proteinPerKg = 1.8;
  } else {
    proteinPerKg = isMinor ? 1.4 : 1.5;
  }

  // Dietary adjustment note: plant-based diets benefit from diverse amino acid blending
  let proteinGrams = Math.round(weightKg * proteinPerKg);
  // Cap protein so it never exceeds 35% of total energy
  const maxProteinGrams = Math.round((targetCalories * 0.35) / 4);
  proteinGrams = Math.min(proteinGrams, maxProteinGrams);
  const proteinCalories = proteinGrams * 4;

  // Fat: 25% to 30% of total calories (minimum 0.7g/kg for hormonal health)
  const minFatGrams = Math.round(weightKg * 0.7);
  const fatCaloriesRaw = targetCalories * 0.27;
  const fatGrams = Math.max(minFatGrams, Math.round(fatCaloriesRaw / 9));
  const fatCalories = fatGrams * 9;

  // Carbohydrates: remaining calories (guaranteeing exact mathematical internal consistency)
  const remainingCaloriesForCarbs = Math.max(160, targetCalories - proteinCalories - fatCalories);
  const carbsGrams = Math.round(remainingCaloriesForCarbs / 4);

  // Reconcile targetCalories to match exact sum of macros (P*4 + C*4 + F*9)
  const reconciledCalories = proteinGrams * 4 + carbsGrams * 4 + fatGrams * 9;
  const fatPercentOfCalories = Math.round(((fatGrams * 9) / reconciledCalories) * 100);

  // Fiber: ~14g per 1,000 kcal (bounded between 25g and 45g)
  const fiberGrams = Math.min(45, Math.max(25, Math.round((reconciledCalories / 1000) * 14)));

  // Hydration: 35ml/kg baseline + 250ml per training session above 2 days/week
  const rawWater = weightKg * 35 + (workoutFrequencyPerWeek >= 4 ? 500 : 250);
  const waterGoalMl = Math.min(4500, Math.max(2000, Math.round(rawWater / 250) * 250));

  return {
    bmr,
    tdee,
    targetCalories: reconciledCalories,
    calorieAdjustment,
    adjustmentType,
    proteinGrams,
    proteinPerKg,
    carbsGrams,
    fatGrams,
    fatPercentOfCalories,
    fiberGrams,
    waterGoalMl,
    isMinor,
    safeCalorieTargetProvided,
    minorGuidance,
    assumptions: [
      "BMR estimated using the Mifflin-St Jeor equation: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + (5 for men / -161 for women).",
      "Total Daily Energy Expenditure (TDEE) accounts for Physical Activity Level (PAL) modulated by weekly resistance training frequency.",
      "Energy deficits are capped between 300 and 500 kcal/day with strict absolute safety floors (1,200 kcal for women, 1,500 kcal for men).",
      "Protein targets adhere to ISSN and ACSM guidelines (1.6–2.2 g/kg for resistance training, 1.2–1.6 g/kg for general fitness).",
    ],
    limitations: [
      "Metabolic equations estimate group averages; individual Non-Exercise Activity Thermogenesis (NEAT), lean body mass %, and endocrine factors cause real-world variations.",
      "Metabolic adaptation occurs over time; progress and targets should be reassessed every 2–4 weeks rather than followed indefinitely.",
      "These figures are evidence-based starting estimates for athletic lifestyle management, not clinical medical prescriptions.",
    ],
    version: "v2026.2",
    calculatedAt: params.currentDate || "2026-01-01T00:00:00.000Z",
  };
}

/**
 * Backward compatibility wrapper for existing code
 */
export function calculatePersonalizedTargets(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  activityLevel: ActivityLevel;
  primaryGoal: FitnessGoalType;
}): {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterGoalMl: number;
  isUnder18Notice: boolean;
} {
  const result = calculatePersonalizedNutrition(params);
  return {
    calories: result.targetCalories,
    proteinGrams: result.proteinGrams,
    carbsGrams: result.carbsGrams,
    fatGrams: result.fatGrams,
    waterGoalMl: result.waterGoalMl,
    isUnder18Notice: result.isMinor,
  };
}

/**
 * Calculates a progressive goal weight roadmap using actual logged history.
 * Never fabricates future measurements; clearly demarks estimated milestone projections.
 */
export function calculateGoalRoadmap(params: {
  currentWeightKg: number;
  goalWeightKg?: number;
  startingWeightKg?: number;
  primaryGoal: FitnessGoalType;
  age: number;
  weightHistory?: BodyMeasurement[];
  currentDate?: string;
}): GoalRoadmapResult {
  const { currentWeightKg, goalWeightKg = currentWeightKg, startingWeightKg, primaryGoal, age, weightHistory = [], currentDate } = params;
  const isMinor = age < 18;
  const deltaKg = Math.round((goalWeightKg - currentWeightKg) * 10) / 10;
  const startWeight = startingWeightKg || (weightHistory.length > 0 && weightHistory[0].weightKg ? weightHistory[0].weightKg : currentWeightKg);

  // Calculate actual weight trend rate (kg/week) if genuine history exists
  let weightTrendKgPerWeek = 0;
  if (weightHistory.length >= 2) {
    const sorted = [...weightHistory]
      .filter((m) => m.weightKg && m.weightKg > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sorted.length >= 2) {
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const daysDiff = Math.max(1, (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24));
      const totalWeightDiff = (last.weightKg || 0) - (first.weightKg || 0);
      weightTrendKgPerWeek = Math.round(((totalWeightDiff / daysDiff) * 7) * 10) / 10;
    }
  }

  // Calculate Progress Percentage towards goal
  let progressPercent = 0;
  if (startWeight !== goalWeightKg) {
    const totalDistance = Math.abs(goalWeightKg - startWeight);
    const coveredDistance = Math.abs(currentWeightKg - startWeight);
    progressPercent = Math.min(100, Math.max(0, Math.round((coveredDistance / Math.max(0.5, totalDistance)) * 100)));
  } else {
    progressPercent = 100;
  }

  // Reference date: uses provided date or deterministic fallback
  const today = currentDate ? new Date(currentDate) : new Date("2026-01-01T00:00:00.000Z");

  // Suggested Review Date: exactly 21 days from today
  const reviewDate = new Date(today);
  reviewDate.setDate(reviewDate.getDate() + 21);
  const suggestedReviewDate = reviewDate.toISOString().split("T")[0];

  // Conservative safe milestones (4 projected checkpoints)
  const milestones: RoadmapMilestone[] = [];

  // Conservative rates:
  // Fat loss: ~0.45 kg/week (adults). Minors: habit-focused without forced numerical targets.
  // Muscle gain: ~0.25 kg/week (adults).
  const weeklyRate = isMinor
    ? 0
    : primaryGoal === "fat_loss"
    ? -0.45
    : primaryGoal === "muscle_gain"
    ? 0.22
    : primaryGoal === "strength_improvement"
    ? 0.15
    : 0;

  const milestoneWeeks = [2, 4, 8, 12];
  const habitThemes = [
    "Establish baseline nutrition & consistent logging",
    "Progressive overload & structured hydration routine",
    "Metabolic adaptation check & strength benchmarks",
    "Long-term habit consolidation & physique review",
  ];

  milestoneWeeks.forEach((wk, idx) => {
    const projDate = new Date(today);
    projDate.setDate(projDate.getDate() + wk * 7);

    let projWeight: number | undefined = undefined;
    if (!isMinor && Math.abs(deltaKg) > 0.5 && weeklyRate !== 0) {
      const expectedShift = weeklyRate * wk;
      if (deltaKg < 0) {
        projWeight = Math.max(goalWeightKg, Math.round((currentWeightKg + expectedShift) * 10) / 10);
      } else {
        projWeight = Math.min(goalWeightKg, Math.round((currentWeightKg + expectedShift) * 10) / 10);
      }
    }

    milestones.push({
      weekNumber: wk,
      projectedDate: projDate.toISOString().split("T")[0],
      targetWeightKg: projWeight,
      milestoneTitle: `Week ${wk} Checkpoint`,
      focusHabit: habitThemes[idx] || "Consistency and recovery",
      isEstimated: true,
    });
  });

  const roadmapSummary = isMinor
    ? "Youth roadmap prioritizes athletic performance, consistent training, adequate sleep, and wholesome nutrition rather than aggressive weight loss."
    : Math.abs(deltaKg) <= 0.5
    ? "You are currently at your target weight equilibrium! Focus on body recomposition, strength, and stamina."
    : deltaKg < 0
    ? `Targeting a conservative fat loss of ${Math.abs(deltaKg)} kg at a sustainable pace (~0.4 - 0.5 kg/week).`
    : `Targeting lean muscle growth of ${deltaKg} kg with a controlled surplus to minimize fat gain.`;

  return {
    currentWeightKg,
    goalWeightKg,
    deltaKg,
    startingWeightKg: startWeight,
    weightTrendKgPerWeek,
    progressPercent,
    suggestedReviewDate,
    weeklyMilestones: milestones,
    isMinor,
    roadmapSummary,
  };
}

/**
 * Connects the active fitness goal to workout split and frequency recommendations
 */
export function getWorkoutGoalSuggestion(
  primaryGoal: FitnessGoalType | string,
  workoutFrequency: number = 4
): WorkoutGoalSuggestion {
  const normalizedGoal: FitnessGoalType =
    primaryGoal === "strength" ? "strength_improvement" : (primaryGoal as FitnessGoalType);

  switch (normalizedGoal) {
    case "muscle_gain":
      return {
        primaryGoal: normalizedGoal,
        recommendedSplitId: workoutFrequency >= 5 ? "template_ppl_6day" : "template_upper_lower_4day",
        recommendedSplitName: workoutFrequency >= 5 ? "PPL 6-Day Hypertrophy Split" : "Upper / Lower 4-Day Strength",
        suggestedFrequencyDays: Math.max(4, Math.min(6, workoutFrequency)),
        trainingFocus: "Hypertrophy-focused volume with 8–12 rep ranges, targeting each muscle group twice weekly.",
        progressionStrategy: "Progressive overload: add 1 rep or 1.25–2.5 kg once top of rep range is completed with clean form.",
        suggestedCardioProtocol: "1–2 low-intensity recovery walks (30 min) per week to maintain work capacity without impeding recovery.",
        recoveryNotes: "Ensure at least 1 full rest day weekly. Prioritize 8 hours of sleep for muscle protein synthesis.",
      };

    case "fat_loss":
      return {
        primaryGoal: normalizedGoal,
        recommendedSplitId: workoutFrequency >= 4 ? "template_upper_lower_4day" : "template_full_body_3day",
        recommendedSplitName: workoutFrequency >= 4 ? "Upper / Lower 4-Day Strength" : "Full Body 3-Day Foundation",
        suggestedFrequencyDays: Math.max(3, Math.min(5, workoutFrequency)),
        trainingFocus: "Heavy compound resistance training (6–10 reps) to signal the body to preserve lean muscle tissue in a deficit.",
        progressionStrategy: "Maintain working weights on core lifts; avoid dropping intensity just because you are in a deficit.",
        suggestedCardioProtocol: "Daily 8,000–10,000 steps (NEAT) plus optional 20–25 min zone 2 cardio 2x/week.",
        recoveryNotes: "Deficits increase fatigue. Never skip scheduled rest days. Hydrate with electrolytes.",
      };

    case "strength_improvement":
      return {
        primaryGoal: normalizedGoal,
        recommendedSplitId: "template_upper_lower_4day",
        recommendedSplitName: "Upper / Lower 4-Day Strength",
        suggestedFrequencyDays: 4,
        trainingFocus: "Neuromuscular efficiency on the Squat, Bench, Deadlift, and Overhead Press in the 4–6 rep range.",
        progressionStrategy: "Linear or wave periodization with 2–3 minute rest periods between heavy working sets.",
        suggestedCardioProtocol: "Low-impact mobility and light cycling (15–20 min) on off-days to promote blood flow.",
        recoveryNotes: "CNS recovery is paramount. Deload every 6–8 weeks or when bar speed significantly degrades.",
      };

    case "general_fitness_stamina":
    case "maintain_fitness":
    case "improve_consistency":
    case "custom":
    default:
      return {
        primaryGoal: normalizedGoal,
        recommendedSplitId: "template_full_body_3day",
        recommendedSplitName: "Full Body 3-Day Foundation",
        suggestedFrequencyDays: Math.max(3, Math.min(4, workoutFrequency)),
        trainingFocus: "Balanced full-body stimulus combining compound lifts, core stability, and functional mobility.",
        progressionStrategy: "Steady consistency: complete all scheduled sets with RPE 7–8 and sound biomechanics.",
        suggestedCardioProtocol: "2–3 sessions of moderate cardio, jogging, cycling, or swimming (25–35 min).",
        recoveryNotes: "Strive for 7–8 hours of quality sleep and active recovery stretching on alternate days.",
      };
  }
}
