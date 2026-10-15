import type {
  UserProfile,
  FitnessGoalType,
  GoalRecommendationRecord,
  NutritionCalculationResult,
  GoalRoadmapResult,
  WorkoutGoalSuggestion,
} from "@/types/user";
import {
  calculatePersonalizedNutrition,
  calculateGoalRoadmap,
  getWorkoutGoalSuggestion,
} from "@/lib/fitness/calculations";
import type {
  WorkoutSession,
  PersonalRecord,
  WorkoutWeeklyTemplate,
  WeeklyPlanDayOverride,
  ResolvedDayPlan,
  PlannedDayWorkout,
  PlannedExerciseTarget,
  ExerciseDefinition,
  MuscleGroup,
  WorkoutSplitType,
} from "@/types/fitness";
import type { LoggedFoodItem, MealType, FoodItemDefinition, RecipeDefinition, SavedMealTemplate } from "@/types/nutrition";
import type { WaterEntry } from "@/types/water";
import type { SupplementDefinition, SupplementLogEntry } from "@/types/supplements";
import type { BodyMeasurement, ProgressPhoto, ProgressCardData } from "@/types/progress";
import type { FriendRelationship, SocialActivityItem } from "@/types/social";
import type { AppNotification } from "@/types/notifications";
import { generateInviteCode } from "@/lib/utils";

export const OWNER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_OWNER_ADMIN_EMAIL || "owner@sabfitness.app";

// Fresh clean unconfigured athlete state - ZERO fabricated metrics
export const CLEAN_NEW_USER: UserProfile = {
  id: "usr_local_athlete",
  email: "",
  name: "Athlete",
  heightCm: 0,
  weightKg: 0,
  primaryGoal: "maintain_fitness",
  secondaryGoals: [],
  activityLevel: "moderate",
  trainingExperience: "beginner",
  equipment: "full_gym",
  dietaryPreference: "non_vegetarian",
  allergies: [],
  unitSystem: "metric",
  onboardingCompleted: false, // Prompts user to set genuine goals
  isAdmin: false,
  inviteCode: "",
  dailyWaterGoalMl: 0,
  dailyCalorieTarget: 0,
  dailyProteinTargetGrams: 0,
  dailyCarbsTargetGrams: 0,
  dailyFatTargetGrams: 0,
  createdAt: "",
  updatedAt: "",
};

// Storage Keys
const STORAGE_KEYS = {
  USER: "sabfitness_user",
  WORKOUTS: "sabfitness_workouts",
  ACTIVE_WORKOUT: "sabfitness_active_workout",
  PRS: "sabfitness_prs",
  FOOD_LOGS: "sabfitness_food_logs",
  CUSTOM_FOODS: "sabfitness_custom_foods",
  RECIPES: "sabfitness_recipes",
  MEAL_TEMPLATES: "sabfitness_meal_templates",
  WATER_LOGS: "sabfitness_water_logs",
  SUPPLEMENTS: "sabfitness_supplements",
  SUPPLEMENT_LOGS: "sabfitness_supplement_logs",
  MEASUREMENTS: "sabfitness_measurements",
  FRIENDS: "sabfitness_friends",
  ACTIVITY: "sabfitness_activity",
  NOTIFICATIONS: "sabfitness_notifications",
  THEME: "sabfitness_theme",
  DEMO_MODE: "sabfitness_demo_mode",
  WORKOUT_TEMPLATES_WEEKLY: "sabfitness_workout_templates_weekly",
  WORKOUT_DAY_OVERRIDES: "sabfitness_workout_day_overrides",
  CUSTOM_EXERCISES: "sabfitness_custom_exercises",
  FAVORITE_EXERCISES: "sabfitness_favorite_exercises",
  GOAL_RECOMMENDATION_HISTORY: "sabfitness_goal_recommendation_history",
};

export const DEFAULT_WEEKLY_TEMPLATES: WorkoutWeeklyTemplate[] = [
  {
    id: "template_ppl_6day",
    name: "PPL 6-Day Hypertrophy Split",
    description: "High-frequency Push/Pull/Legs 6-day split with built-in active recovery on Sunday.",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    days: [
      {
        dayOfWeek: 0,
        dayName: "Monday",
        isRestDay: false,
        workoutName: "Push Day (Chest, Shoulders & Triceps)",
        splitType: "push",
        muscleGroups: ["chest", "shoulders", "triceps"],
        exercises: [
          {
            id: "pe_ppl_m1",
            exerciseId: "ex_ch_bb_flat",
            exerciseName: "Barbell Bench Press — Flat",
            muscleGroup: "chest",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 4,
            targetRepsMin: 6,
            targetRepsMax: 8,
            targetWeightKg: 70,
            targetWeightUnit: "kg",
            restTimerSeconds: 120,
            targetRpe: 8,
            notes: "Drive through feet and control the descent to lower sternum.",
          },
          {
            id: "pe_ppl_m2",
            exerciseId: "ex_ch_db_incline_30",
            exerciseName: "Dumbbell Bench Press — Incline (30°)",
            muscleGroup: "chest",
            category: "dumbbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 12,
            targetWeightKg: 24,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
            targetRpe: 8,
            notes: "30-degree bench angle for clavicular upper pec emphasis.",
          },
          {
            id: "pe_ppl_m3",
            exerciseId: "ex_sh_ohp_standing_bb",
            exerciseName: "Standing Barbell Overhead Press (OHP)",
            muscleGroup: "shoulders",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetWeightKg: 40,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
            targetRpe: 8,
            notes: "Squeeze glutes and brace core throughout.",
          },
          {
            id: "pe_ppl_m4",
            exerciseId: "ex_tri_1",
            exerciseName: "Cable Tricep Pushdown (V-Bar)",
            muscleGroup: "triceps",
            category: "cable",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 10,
            targetRepsMax: 12,
            targetWeightKg: 25,
            targetWeightUnit: "kg",
            restTimerSeconds: 60,
            targetRpe: 9,
            notes: "Keep elbows tucked close to ribcage.",
          },
        ],
      },
      {
        dayOfWeek: 1,
        dayName: "Tuesday",
        isRestDay: false,
        workoutName: "Pull Day (Back, Rear Delts & Biceps)",
        splitType: "pull",
        muscleGroups: ["back", "biceps"],
        exercises: [
          {
            id: "pe_ppl_t1",
            exerciseId: "ex_bk_conv_dl",
            exerciseName: "Conventional Barbell Deadlift",
            muscleGroup: "back",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 4,
            targetRepsMin: 5,
            targetRepsMax: 6,
            targetWeightKg: 100,
            targetWeightUnit: "kg",
            restTimerSeconds: 150,
            targetRpe: 8,
            notes: "Pull slack out of the barbell before leg drive.",
          },
          {
            id: "pe_ppl_t2",
            exerciseId: "ex_bk_pd_1",
            exerciseName: "Wide-Grip Lat Pulldown",
            muscleGroup: "back",
            category: "cable",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 10,
            targetRepsMax: 12,
            targetWeightKg: 55,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
            targetRpe: 8,
            notes: "Initiate with lats, drive elbows down toward pockets.",
          },
          {
            id: "pe_ppl_t3",
            exerciseId: "ex_bi_1",
            exerciseName: "Standing Barbell Bicep Curl",
            muscleGroup: "biceps",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 10,
            targetRepsMax: 12,
            targetWeightKg: 25,
            targetWeightUnit: "kg",
            restTimerSeconds: 60,
            targetRpe: 8,
            notes: "Strict form, avoid swinging torso.",
          },
        ],
      },
      {
        dayOfWeek: 2,
        dayName: "Wednesday",
        isRestDay: false,
        workoutName: "Leg Day (Quads, Hamstrings & Calves)",
        splitType: "legs",
        muscleGroups: ["legs_quads", "legs_hamstrings", "calves", "core"],
        exercises: [
          {
            id: "pe_ppl_w1",
            exerciseId: "ex_lg_sq_back_squat_high_bar",
            exerciseName: "Barbell Back Squat (High Bar)",
            muscleGroup: "legs_quads",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 4,
            targetRepsMin: 6,
            targetRepsMax: 8,
            targetWeightKg: 80,
            targetWeightUnit: "kg",
            restTimerSeconds: 120,
            targetRpe: 8,
            notes: "Descend below parallel with controlled knee travel.",
          },
          {
            id: "pe_ppl_w2",
            exerciseId: "ex_lg_ham_1",
            exerciseName: "Romanian Deadlift (Barbell RDL)",
            muscleGroup: "legs_hamstrings",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetWeightKg: 75,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
            targetRpe: 8,
            notes: "Hinge hips backward, keep bar close to shins.",
          },
          {
            id: "pe_ppl_w3",
            exerciseId: "ex_calf_1",
            exerciseName: "Standing Barbell Calf Raise",
            muscleGroup: "calves",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 4,
            targetRepsMin: 12,
            targetRepsMax: 15,
            targetWeightKg: 60,
            targetWeightUnit: "kg",
            restTimerSeconds: 60,
            targetRpe: 8,
            notes: "2-second pause at bottom stretch on every rep.",
          },
          {
            id: "pe_ppl_w4",
            exerciseId: "ex_core_1",
            exerciseName: "Standard Forearm Plank",
            muscleGroup: "core",
            category: "bodyweight",
            trackingMode: "time_duration",
            targetSets: 3,
            targetDurationSeconds: 60,
            restTimerSeconds: 60,
            notes: "Maintain neutral spine, active abdominal brace.",
          },
        ],
      },
      {
        dayOfWeek: 3,
        dayName: "Thursday",
        isRestDay: false,
        workoutName: "Push Hypertrophy (Chest & Delts)",
        splitType: "push",
        muscleGroups: ["chest", "shoulders", "triceps"],
        exercises: [
          {
            id: "pe_ppl_th1",
            exerciseId: "ex_ch_db_flat",
            exerciseName: "Dumbbell Bench Press — Flat",
            muscleGroup: "chest",
            category: "dumbbell",
            trackingMode: "reps_weight",
            targetSets: 4,
            targetRepsMin: 8,
            targetRepsMax: 12,
            targetWeightKg: 26,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
            targetRpe: 8,
            notes: "Full stretch at bottom, squeeze chest at peak.",
          },
          {
            id: "pe_ppl_th2",
            exerciseId: "ex_ch_bb_incline_30",
            exerciseName: "Barbell Bench Press — Incline (30°)",
            muscleGroup: "chest",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetWeightKg: 60,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
            targetRpe: 8,
          },
          {
            id: "pe_ppl_th3",
            exerciseId: "ex_tri_1",
            exerciseName: "Cable Tricep Pushdown (V-Bar)",
            muscleGroup: "triceps",
            category: "cable",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 12,
            targetRepsMax: 15,
            targetWeightKg: 20,
            targetWeightUnit: "kg",
            restTimerSeconds: 60,
          },
        ],
      },
      {
        dayOfWeek: 4,
        dayName: "Friday",
        isRestDay: false,
        workoutName: "Pull Hypertrophy (Back & Biceps)",
        splitType: "pull",
        muscleGroups: ["back", "biceps", "core"],
        exercises: [
          {
            id: "pe_ppl_f1",
            exerciseId: "ex_bk_pu_1",
            exerciseName: "Standard Overhand Pull-Up",
            muscleGroup: "back",
            category: "bodyweight",
            trackingMode: "reps_only",
            targetSets: 4,
            targetRepsMin: 6,
            targetRepsMax: 10,
            restTimerSeconds: 90,
            targetRpe: 8,
            notes: "Dead hang to chin over bar.",
          },
          {
            id: "pe_ppl_f2",
            exerciseId: "ex_bk_pd_1",
            exerciseName: "Wide-Grip Lat Pulldown",
            muscleGroup: "back",
            category: "cable",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 10,
            targetRepsMax: 12,
            targetWeightKg: 50,
            targetWeightUnit: "kg",
            restTimerSeconds: 75,
          },
          {
            id: "pe_ppl_f3",
            exerciseId: "ex_bi_1",
            exerciseName: "Standing Barbell Bicep Curl",
            muscleGroup: "biceps",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 12,
            targetRepsMax: 15,
            targetWeightKg: 20,
            targetWeightUnit: "kg",
            restTimerSeconds: 60,
          },
        ],
      },
      {
        dayOfWeek: 5,
        dayName: "Saturday",
        isRestDay: false,
        workoutName: "Leg Hypertrophy & Posterior Chain",
        splitType: "legs",
        muscleGroups: ["legs_quads", "legs_hamstrings", "calves"],
        exercises: [
          {
            id: "pe_ppl_s1",
            exerciseId: "ex_lg_sq_back_squat_high_bar",
            exerciseName: "Barbell Back Squat (High Bar)",
            muscleGroup: "legs_quads",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetWeightKg: 70,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
          },
          {
            id: "pe_ppl_s2",
            exerciseId: "ex_lg_ham_1",
            exerciseName: "Romanian Deadlift (Barbell RDL)",
            muscleGroup: "legs_hamstrings",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 10,
            targetRepsMax: 12,
            targetWeightKg: 65,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
          },
          {
            id: "pe_ppl_s3",
            exerciseId: "ex_calf_1",
            exerciseName: "Standing Barbell Calf Raise",
            muscleGroup: "calves",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 4,
            targetRepsMin: 15,
            targetRepsMax: 15,
            targetWeightKg: 50,
            targetWeightUnit: "kg",
            restTimerSeconds: 60,
          },
        ],
      },
      {
        dayOfWeek: 6,
        dayName: "Sunday",
        isRestDay: true,
        restNotes: "Scheduled rest day. Focus on 8+ hours sleep, hydration, and light walking/mobility.",
        workoutName: "Rest & Active Recovery",
        splitType: "custom",
        muscleGroups: ["mobility"],
        exercises: [],
      },
    ],
  },
  {
    id: "template_upper_lower_4day",
    name: "Upper / Lower 4-Day Strength",
    description: "Time-efficient 4-day split balancing upper power and lower body development with 3 recovery days.",
    isActive: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    days: [
      {
        dayOfWeek: 0,
        dayName: "Monday",
        isRestDay: false,
        workoutName: "Upper Body Power",
        splitType: "upper",
        muscleGroups: ["chest", "back", "shoulders"],
        exercises: [
          {
            id: "pe_ul_m1",
            exerciseId: "ex_ch_bb_flat",
            exerciseName: "Barbell Bench Press — Flat",
            muscleGroup: "chest",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 4,
            targetRepsMin: 6,
            targetRepsMax: 8,
            targetWeightKg: 75,
            targetWeightUnit: "kg",
            restTimerSeconds: 120,
          },
          {
            id: "pe_ul_m2",
            exerciseId: "ex_bk_conv_dl",
            exerciseName: "Conventional Barbell Deadlift",
            muscleGroup: "back",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 4,
            targetRepsMin: 5,
            targetRepsMax: 6,
            targetWeightKg: 105,
            targetWeightUnit: "kg",
            restTimerSeconds: 150,
          },
          {
            id: "pe_ul_m3",
            exerciseId: "ex_sh_ohp_standing_bb",
            exerciseName: "Standing Barbell Overhead Press (OHP)",
            muscleGroup: "shoulders",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetWeightKg: 42.5,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
          },
        ],
      },
      {
        dayOfWeek: 1,
        dayName: "Tuesday",
        isRestDay: false,
        workoutName: "Lower Body Power",
        splitType: "lower",
        muscleGroups: ["legs_quads", "legs_hamstrings", "calves"],
        exercises: [
          {
            id: "pe_ul_t1",
            exerciseId: "ex_lg_sq_back_squat_high_bar",
            exerciseName: "Barbell Back Squat (High Bar)",
            muscleGroup: "legs_quads",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 4,
            targetRepsMin: 6,
            targetRepsMax: 8,
            targetWeightKg: 85,
            targetWeightUnit: "kg",
            restTimerSeconds: 120,
          },
          {
            id: "pe_ul_t2",
            exerciseId: "ex_lg_ham_1",
            exerciseName: "Romanian Deadlift (Barbell RDL)",
            muscleGroup: "legs_hamstrings",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetWeightKg: 80,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
          },
          {
            id: "pe_ul_t3",
            exerciseId: "ex_calf_1",
            exerciseName: "Standing Barbell Calf Raise",
            muscleGroup: "calves",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 4,
            targetRepsMin: 12,
            targetRepsMax: 15,
            targetWeightKg: 60,
            targetWeightUnit: "kg",
            restTimerSeconds: 60,
          },
        ],
      },
      {
        dayOfWeek: 2,
        dayName: "Wednesday",
        isRestDay: true,
        restNotes: "Midweek recovery. Hydrate, stretch, and get quality nutrition.",
        workoutName: "Rest & Active Recovery",
        splitType: "custom",
        muscleGroups: ["mobility"],
        exercises: [],
      },
      {
        dayOfWeek: 3,
        dayName: "Thursday",
        isRestDay: false,
        workoutName: "Upper Body Hypertrophy",
        splitType: "upper",
        muscleGroups: ["chest", "back", "biceps", "triceps"],
        exercises: [
          {
            id: "pe_ul_th1",
            exerciseId: "ex_ch_db_incline_30",
            exerciseName: "Dumbbell Bench Press — Incline (30°)",
            muscleGroup: "chest",
            category: "dumbbell",
            trackingMode: "reps_weight",
            targetSets: 4,
            targetRepsMin: 8,
            targetRepsMax: 12,
            targetWeightKg: 24,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
          },
          {
            id: "pe_ul_th2",
            exerciseId: "ex_bk_pd_1",
            exerciseName: "Wide-Grip Lat Pulldown",
            muscleGroup: "back",
            category: "cable",
            trackingMode: "reps_weight",
            targetSets: 4,
            targetRepsMin: 10,
            targetRepsMax: 12,
            targetWeightKg: 55,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
          },
          {
            id: "pe_ul_th3",
            exerciseId: "ex_bi_1",
            exerciseName: "Standing Barbell Bicep Curl",
            muscleGroup: "biceps",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 10,
            targetRepsMax: 12,
            targetWeightKg: 25,
            targetWeightUnit: "kg",
            restTimerSeconds: 60,
          },
        ],
      },
      {
        dayOfWeek: 4,
        dayName: "Friday",
        isRestDay: false,
        workoutName: "Lower Body Hypertrophy",
        splitType: "lower",
        muscleGroups: ["legs_quads", "legs_hamstrings", "core"],
        exercises: [
          {
            id: "pe_ul_f1",
            exerciseId: "ex_lg_sq_back_squat_high_bar",
            exerciseName: "Barbell Back Squat (High Bar)",
            muscleGroup: "legs_quads",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 10,
            targetRepsMax: 12,
            targetWeightKg: 70,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
          },
          {
            id: "pe_ul_f2",
            exerciseId: "ex_lg_ham_1",
            exerciseName: "Romanian Deadlift (Barbell RDL)",
            muscleGroup: "legs_hamstrings",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 10,
            targetRepsMax: 12,
            targetWeightKg: 65,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
          },
          {
            id: "pe_ul_f3",
            exerciseId: "ex_core_1",
            exerciseName: "Standard Forearm Plank",
            muscleGroup: "core",
            category: "bodyweight",
            trackingMode: "time_duration",
            targetSets: 3,
            targetDurationSeconds: 60,
            restTimerSeconds: 60,
          },
        ],
      },
      {
        dayOfWeek: 5,
        dayName: "Saturday",
        isRestDay: true,
        restNotes: "Weekend recovery day.",
        workoutName: "Rest & Active Recovery",
        splitType: "custom",
        muscleGroups: ["mobility"],
        exercises: [],
      },
      {
        dayOfWeek: 6,
        dayName: "Sunday",
        isRestDay: true,
        restNotes: "Rest, food prep, and weekly review.",
        workoutName: "Rest & Active Recovery",
        splitType: "custom",
        muscleGroups: ["mobility"],
        exercises: [],
      },
    ],
  },
  {
    id: "template_full_body_3day",
    name: "Full Body 3-Day Foundation",
    description: "Classic Monday/Wednesday/Friday full-body stimulus ideal for steady progress and maximum recovery.",
    isActive: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    days: [
      {
        dayOfWeek: 0,
        dayName: "Monday",
        isRestDay: false,
        workoutName: "Full Body A (Squat & Press Focus)",
        splitType: "full_body",
        muscleGroups: ["legs_quads", "chest", "back"],
        exercises: [
          {
            id: "pe_fb_m1",
            exerciseId: "ex_lg_sq_back_squat_high_bar",
            exerciseName: "Barbell Back Squat (High Bar)",
            muscleGroup: "legs_quads",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 6,
            targetRepsMax: 8,
            targetWeightKg: 75,
            targetWeightUnit: "kg",
            restTimerSeconds: 120,
          },
          {
            id: "pe_fb_m2",
            exerciseId: "ex_ch_bb_flat",
            exerciseName: "Barbell Bench Press — Flat",
            muscleGroup: "chest",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 6,
            targetRepsMax: 8,
            targetWeightKg: 65,
            targetWeightUnit: "kg",
            restTimerSeconds: 120,
          },
          {
            id: "pe_fb_m3",
            exerciseId: "ex_bk_pd_1",
            exerciseName: "Wide-Grip Lat Pulldown",
            muscleGroup: "back",
            category: "cable",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetWeightKg: 55,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
          },
        ],
      },
      {
        dayOfWeek: 1,
        dayName: "Tuesday",
        isRestDay: true,
        restNotes: "Rest day.",
        workoutName: "Rest & Active Recovery",
        splitType: "custom",
        muscleGroups: ["mobility"],
        exercises: [],
      },
      {
        dayOfWeek: 2,
        dayName: "Wednesday",
        isRestDay: false,
        workoutName: "Full Body B (Hinge & Overhead Focus)",
        splitType: "full_body",
        muscleGroups: ["legs_hamstrings", "shoulders", "back"],
        exercises: [
          {
            id: "pe_fb_w1",
            exerciseId: "ex_bk_conv_dl",
            exerciseName: "Conventional Barbell Deadlift",
            muscleGroup: "back",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 5,
            targetRepsMax: 6,
            targetWeightKg: 95,
            targetWeightUnit: "kg",
            restTimerSeconds: 150,
          },
          {
            id: "pe_fb_w2",
            exerciseId: "ex_sh_ohp_standing_bb",
            exerciseName: "Standing Barbell Overhead Press (OHP)",
            muscleGroup: "shoulders",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetWeightKg: 40,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
          },
          {
            id: "pe_fb_w3",
            exerciseId: "ex_bk_pu_1",
            exerciseName: "Standard Overhand Pull-Up",
            muscleGroup: "back",
            category: "bodyweight",
            trackingMode: "reps_only",
            targetSets: 3,
            targetRepsMin: 6,
            targetRepsMax: 8,
            restTimerSeconds: 90,
          },
        ],
      },
      {
        dayOfWeek: 3,
        dayName: "Thursday",
        isRestDay: true,
        restNotes: "Rest day.",
        workoutName: "Rest & Active Recovery",
        splitType: "custom",
        muscleGroups: ["mobility"],
        exercises: [],
      },
      {
        dayOfWeek: 4,
        dayName: "Friday",
        isRestDay: false,
        workoutName: "Full Body C (Hypertrophy & Core)",
        splitType: "full_body",
        muscleGroups: ["legs_quads", "chest", "core"],
        exercises: [
          {
            id: "pe_fb_f1",
            exerciseId: "ex_lg_ham_1",
            exerciseName: "Romanian Deadlift (Barbell RDL)",
            muscleGroup: "legs_hamstrings",
            category: "barbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetWeightKg: 70,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
          },
          {
            id: "pe_fb_f2",
            exerciseId: "ex_ch_db_incline_30",
            exerciseName: "Dumbbell Bench Press — Incline (30°)",
            muscleGroup: "chest",
            category: "dumbbell",
            trackingMode: "reps_weight",
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 12,
            targetWeightKg: 22,
            targetWeightUnit: "kg",
            restTimerSeconds: 90,
          },
          {
            id: "pe_fb_f3",
            exerciseId: "ex_core_1",
            exerciseName: "Standard Forearm Plank",
            muscleGroup: "core",
            category: "bodyweight",
            trackingMode: "time_duration",
            targetSets: 3,
            targetDurationSeconds: 60,
            restTimerSeconds: 60,
          },
        ],
      },
      {
        dayOfWeek: 5,
        dayName: "Saturday",
        isRestDay: true,
        restNotes: "Weekend recovery.",
        workoutName: "Rest & Active Recovery",
        splitType: "custom",
        muscleGroups: ["mobility"],
        exercises: [],
      },
      {
        dayOfWeek: 6,
        dayName: "Sunday",
        isRestDay: true,
        restNotes: "Rest and weekly prep.",
        workoutName: "Rest & Active Recovery",
        splitType: "custom",
        muscleGroups: ["mobility"],
        exercises: [],
      },
    ],
  },
];

// Safe Local Storage Accessor
class LocalStateManager {
  private get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("localStorage quota exceeded or blocked:", e);
    }
  }

  // Demo Mode toggle - OFF by default
  public isDemoMode(): boolean {
    return this.get<boolean>(STORAGE_KEYS.DEMO_MODE, false);
  }

  public setDemoMode(enabled: boolean): void {
    this.set(STORAGE_KEYS.DEMO_MODE, enabled);
  }

  public getUser(): UserProfile {
    const user = this.get<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (!user) {
      if (typeof window === "undefined") {
        return {
          ...CLEAN_NEW_USER,
          inviteCode: "SAB-INVITE",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        };
      }
      return {
        ...CLEAN_NEW_USER,
        inviteCode: generateInviteCode(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return user;
  }

  public saveUser(userUpdate: Partial<UserProfile>): UserProfile {
    const current = this.getUser();
    const updated: UserProfile = {
      ...current,
      ...userUpdate,
      updatedAt: new Date().toISOString(),
    };

    // If user's email matches the configured Owner Admin, enforce server/owner check
    if (updated.email && updated.email.toLowerCase().trim() === OWNER_ADMIN_EMAIL.toLowerCase()) {
      updated.isAdmin = true;
    }

    this.set(STORAGE_KEYS.USER, updated);
    return updated;
  }

  // Workouts - returns empty array by default unless genuine records exist
  public getWorkouts(): WorkoutSession[] {
    return this.get<WorkoutSession[]>(STORAGE_KEYS.WORKOUTS, []);
  }

  public saveWorkout(workout: WorkoutSession): void {
    const workouts = this.getWorkouts();
    const existingIndex = workouts.findIndex((w) => w.id === workout.id);
    if (existingIndex >= 0) {
      workouts[existingIndex] = workout;
    } else {
      workouts.unshift(workout);
    }
    this.set(STORAGE_KEYS.WORKOUTS, workouts);
  }

  public deleteWorkout(id: string): void {
    const workouts = this.getWorkouts().filter((w) => w.id !== id);
    this.set(STORAGE_KEYS.WORKOUTS, workouts);
  }

  // Active in-progress workout session
  public getActiveWorkout(): WorkoutSession | null {
    return this.get<WorkoutSession | null>(STORAGE_KEYS.ACTIVE_WORKOUT, null);
  }

  public saveActiveWorkout(workout: WorkoutSession | null): void {
    this.set(STORAGE_KEYS.ACTIVE_WORKOUT, workout);
  }

  // PRs - returns empty array by default
  public getPRs(): PersonalRecord[] {
    return this.get<PersonalRecord[]>(STORAGE_KEYS.PRS, []);
  }

  public savePR(pr: PersonalRecord): void {
    const prs = this.getPRs();
    prs.unshift(pr);
    this.set(STORAGE_KEYS.PRS, prs);
  }

  // Food Logs - returns empty array by default
  public getFoodLogs(dateStr?: string): LoggedFoodItem[] {
    const all = this.get<LoggedFoodItem[]>(STORAGE_KEYS.FOOD_LOGS, []);
    if (!dateStr) return all;
    return all.filter((f) => f.loggedAt.startsWith(dateStr));
  }

  public addFoodLog(item: LoggedFoodItem): void {
    const all = this.get<LoggedFoodItem[]>(STORAGE_KEYS.FOOD_LOGS, []);
    all.unshift(item);
    this.set(STORAGE_KEYS.FOOD_LOGS, all);
  }

  public updateFoodLog(id: string, updates: Partial<LoggedFoodItem>): LoggedFoodItem | null {
    const all = this.get<LoggedFoodItem[]>(STORAGE_KEYS.FOOD_LOGS, []);
    const idx = all.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates };
    this.set(STORAGE_KEYS.FOOD_LOGS, all);
    return all[idx];
  }

  public deleteFoodLog(id: string): void {
    const all = this.get<LoggedFoodItem[]>(STORAGE_KEYS.FOOD_LOGS, []).filter((f) => f.id !== id);
    this.set(STORAGE_KEYS.FOOD_LOGS, all);
  }

  // Copy previous day's meals or a specific meal as independent records
  public copyDayFoodLogs(sourceDateStr: string, targetDateStr: string, mealType?: MealType): LoggedFoodItem[] {
    const all = this.get<LoggedFoodItem[]>(STORAGE_KEYS.FOOD_LOGS, []);
    const sourceItems = all.filter((f) => {
      const matchDate = f.loggedAt.startsWith(sourceDateStr);
      return mealType ? matchDate && f.mealType === mealType : matchDate;
    });

    if (sourceItems.length === 0) return [];

    const nowIso = new Date().toISOString();
    const clonedItems: LoggedFoodItem[] = sourceItems.map((item, index) => ({
      ...item,
      id: `flog_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
      loggedAt: `${targetDateStr}T${nowIso.split("T")[1] || "12:00:00.000Z"}`,
    }));

    // Prepend newly cloned independent items
    const updatedAll = [...clonedItems, ...all];
    this.set(STORAGE_KEYS.FOOD_LOGS, updatedAll);
    return clonedItems;
  }

  // --- Custom Foods ---
  public getCustomFoods(): FoodItemDefinition[] {
    return this.get<FoodItemDefinition[]>(STORAGE_KEYS.CUSTOM_FOODS, []);
  }

  public saveCustomFood(food: FoodItemDefinition): FoodItemDefinition {
    const list = this.getCustomFoods();
    const existingIndex = list.findIndex((f) => f.id === food.id);
    const updatedFood: FoodItemDefinition = {
      ...food,
      source: "custom_user",
      id: food.id || `custom_food_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = updatedFood;
    } else {
      list.unshift(updatedFood);
    }
    this.set(STORAGE_KEYS.CUSTOM_FOODS, list);
    return updatedFood;
  }

  public deleteCustomFood(id: string): void {
    const list = this.getCustomFoods().filter((f) => f.id !== id);
    this.set(STORAGE_KEYS.CUSTOM_FOODS, list);
  }

  // --- Recipes ---
  public getRecipes(): RecipeDefinition[] {
    return this.get<RecipeDefinition[]>(STORAGE_KEYS.RECIPES, []);
  }

  public getRecipeById(id: string): RecipeDefinition | undefined {
    return this.getRecipes().find((r) => r.id === id);
  }

  public saveRecipe(recipe: RecipeDefinition): RecipeDefinition {
    const list = this.getRecipes();
    const existingIndex = list.findIndex((r) => r.id === recipe.id);
    const nowIso = new Date().toISOString();
    const updatedRecipe: RecipeDefinition = {
      ...recipe,
      id: recipe.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: recipe.createdAt || nowIso,
      updatedAt: nowIso,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = updatedRecipe;
    } else {
      list.unshift(updatedRecipe);
    }
    this.set(STORAGE_KEYS.RECIPES, list);
    return updatedRecipe;
  }

  public deleteRecipe(id: string): void {
    const list = this.getRecipes().filter((r) => r.id !== id);
    this.set(STORAGE_KEYS.RECIPES, list);
  }

  public duplicateRecipe(id: string): RecipeDefinition | null {
    const orig = this.getRecipeById(id);
    if (!orig) return null;
    const nowIso = new Date().toISOString();
    const duplicated: RecipeDefinition = {
      ...orig,
      id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${orig.name} (Copy)`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    return this.saveRecipe(duplicated);
  }

  // --- Meal Templates ---
  public getMealTemplates(): SavedMealTemplate[] {
    return this.get<SavedMealTemplate[]>(STORAGE_KEYS.MEAL_TEMPLATES, []);
  }

  public saveMealTemplate(template: SavedMealTemplate): SavedMealTemplate {
    const list = this.getMealTemplates();
    const existingIndex = list.findIndex((t) => t.id === template.id);
    const updated: SavedMealTemplate = {
      ...template,
      id: template.id || `mt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: template.createdAt || new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      list[existingIndex] = updated;
    } else {
      list.unshift(updated);
    }
    this.set(STORAGE_KEYS.MEAL_TEMPLATES, list);
    return updated;
  }

  public deleteMealTemplate(id: string): void {
    const list = this.getMealTemplates().filter((t) => t.id !== id);
    this.set(STORAGE_KEYS.MEAL_TEMPLATES, list);
  }

  public logMealTemplate(
    templateId: string,
    targetDateStr: string,
    mealType: MealType
  ): LoggedFoodItem[] {
    const templates = this.getMealTemplates();
    const template = templates.find((t) => t.id === templateId);
    if (!template || !template.items.length) return [];

    const nowIso = new Date().toISOString();
    const targetTimestamp = `${targetDateStr}T${nowIso.split("T")[1] || "12:00:00.000Z"}`;

    const clonedItems: LoggedFoodItem[] = template.items.map((item, index) => ({
      ...item,
      id: `flog_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
      mealType,
      loggedAt: targetTimestamp,
    }));

    const all = this.get<LoggedFoodItem[]>(STORAGE_KEYS.FOOD_LOGS, []);
    const updatedAll = [...clonedItems, ...all];
    this.set(STORAGE_KEYS.FOOD_LOGS, updatedAll);
    return clonedItems;
  }

  // Water Logs - returns empty array by default
  public getWaterLogs(dateStr?: string): WaterEntry[] {
    const all = this.get<WaterEntry[]>(STORAGE_KEYS.WATER_LOGS, []);
    if (!dateStr) return all;
    return all.filter((w) => w.date === dateStr);
  }

  public addWaterLog(amountMl: number, dateStr?: string): WaterEntry {
    const targetDate = dateStr || new Date().toISOString().split("T")[0];
    const all = this.get<WaterEntry[]>(STORAGE_KEYS.WATER_LOGS, []);
    const newEntry: WaterEntry = {
      id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: this.getUser().id,
      date: targetDate,
      amountMl: Math.max(1, Math.round(amountMl)),
      timestamp: new Date().toISOString(),
    };
    all.push(newEntry);
    this.set(STORAGE_KEYS.WATER_LOGS, all);
    return newEntry;
  }

  public updateWaterLog(id: string, newAmountMl: number): WaterEntry | null {
    const all = this.get<WaterEntry[]>(STORAGE_KEYS.WATER_LOGS, []);
    const idx = all.findIndex((w) => w.id === id);
    if (idx === -1) return null;
    all[idx].amountMl = Math.max(1, Math.round(newAmountMl));
    this.set(STORAGE_KEYS.WATER_LOGS, all);
    return all[idx];
  }

  public deleteWaterLog(id: string): WaterEntry | null {
    const all = this.get<WaterEntry[]>(STORAGE_KEYS.WATER_LOGS, []);
    const target = all.find((w) => w.id === id) || null;
    const filtered = all.filter((w) => w.id !== id);
    this.set(STORAGE_KEYS.WATER_LOGS, filtered);
    return target;
  }

  // Supplements - returns empty array by default
  public getSupplements(includeArchived = false): SupplementDefinition[] {
    const list = this.get<SupplementDefinition[]>(STORAGE_KEYS.SUPPLEMENTS, []);
    if (includeArchived) return list;
    return list.filter((s) => !s.isArchived);
  }

  public saveSupplement(supplement: SupplementDefinition): void {
    const list = this.get<SupplementDefinition[]>(STORAGE_KEYS.SUPPLEMENTS, []);
    const idx = list.findIndex((s) => s.id === supplement.id);
    if (idx >= 0) {
      list[idx] = supplement;
    } else {
      list.push(supplement);
    }
    this.set(STORAGE_KEYS.SUPPLEMENTS, list);
  }

  public pauseSupplement(id: string, isPaused: boolean): void {
    const list = this.get<SupplementDefinition[]>(STORAGE_KEYS.SUPPLEMENTS, []);
    const sup = list.find((s) => s.id === id);
    if (sup) {
      sup.isPaused = isPaused;
      this.set(STORAGE_KEYS.SUPPLEMENTS, list);
    }
  }

  // Soft delete / archive supplement to strictly preserve historical check-ins
  public deleteSupplement(id: string): void {
    const list = this.get<SupplementDefinition[]>(STORAGE_KEYS.SUPPLEMENTS, []);
    const target = list.find((s) => s.id === id);
    if (target) {
      target.isArchived = true;
      target.archivedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.SUPPLEMENTS, list);
    }
  }

  public getSupplementLogs(dateStr?: string): SupplementLogEntry[] {
    const all = this.get<SupplementLogEntry[]>(STORAGE_KEYS.SUPPLEMENT_LOGS, []);
    if (!dateStr) return all;
    return all.filter((s) => s.date === dateStr);
  }

  public toggleSupplementStatus(supplementId: string, status: "taken" | "skipped" | "pending", dateStr?: string): void {
    const targetDate = dateStr || new Date().toISOString().split("T")[0];
    const all = this.get<SupplementLogEntry[]>(STORAGE_KEYS.SUPPLEMENT_LOGS, []);
    const idx = all.findIndex((s) => s.supplementId === supplementId && s.date === targetDate);
    if (idx >= 0) {
      all[idx].status = status;
      all[idx].loggedAt = status === "taken" ? new Date().toISOString() : undefined;
    } else {
      const sup = this.getSupplements(true).find((s) => s.id === supplementId);
      all.push({
        id: `suplog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: this.getUser().id,
        supplementId,
        supplementName: sup?.name || "Supplement",
        dosage: sup?.dosage || "",
        date: targetDate,
        status,
        loggedAt: status === "taken" ? new Date().toISOString() : undefined,
      });
    }
    this.set(STORAGE_KEYS.SUPPLEMENT_LOGS, all);
  }

  public updateSupplementLogQuantity(supplementId: string, actualQuantity: string, dateStr?: string): void {
    const targetDate = dateStr || new Date().toISOString().split("T")[0];
    const all = this.get<SupplementLogEntry[]>(STORAGE_KEYS.SUPPLEMENT_LOGS, []);
    const idx = all.findIndex((s) => s.supplementId === supplementId && s.date === targetDate);
    if (idx >= 0) {
      all[idx].actualQuantity = actualQuantity;
    } else {
      const sup = this.getSupplements(true).find((s) => s.id === supplementId);
      all.push({
        id: `suplog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: this.getUser().id,
        supplementId,
        supplementName: sup?.name || "Supplement",
        dosage: sup?.dosage || "",
        actualQuantity,
        date: targetDate,
        status: "pending",
      });
    }
    this.set(STORAGE_KEYS.SUPPLEMENT_LOGS, all);
  }

  // Measurements - returns empty array by default
  public getMeasurements(): BodyMeasurement[] {
    return this.get<BodyMeasurement[]>(STORAGE_KEYS.MEASUREMENTS, []);
  }

  public addMeasurement(m: BodyMeasurement): void {
    const list = this.getMeasurements();
    list.push(m);
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    this.set(STORAGE_KEYS.MEASUREMENTS, list);
  }

  // Social
  public getFriends(): FriendRelationship[] {
    return this.get<FriendRelationship[]>(STORAGE_KEYS.FRIENDS, []);
  }

  public getActivity(): SocialActivityItem[] {
    return this.get<SocialActivityItem[]>(STORAGE_KEYS.ACTIVITY, []);
  }

  public addReaction(activityId: string, emoji: "🔥" | "💪" | "👏" | "⚡" | "🎯"): void {
    const activity = this.getActivity();
    const item = activity.find((a) => a.id === activityId);
    if (item) {
      item.reactions.push({ userId: this.getUser().id, emoji });
      this.set(STORAGE_KEYS.ACTIVITY, activity);
    }
  }

  public addComment(activityId: string, text: string): void {
    const activity = this.getActivity();
    const item = activity.find((a) => a.id === activityId);
    if (item) {
      item.comments.push({
        id: `c_${Date.now()}`,
        userId: this.getUser().id,
        userName: this.getUser().name,
        text,
        createdAt: "Just now",
      });
      this.set(STORAGE_KEYS.ACTIVITY, activity);
    }
  }

  // Notifications - returns empty array by default
  public getNotifications(): AppNotification[] {
    return this.get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  public markNotificationAsRead(id: string): void {
    const notifs = this.getNotifications();
    const target = notifs.find((n) => n.id === id);
    if (target) {
      target.read = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  }

  // --- Weekly Workout Planner & Template Management ---

  public getWeeklyTemplates(): WorkoutWeeklyTemplate[] {
    const templates = this.get<WorkoutWeeklyTemplate[]>(STORAGE_KEYS.WORKOUT_TEMPLATES_WEEKLY, []);
    if (!templates || templates.length === 0) {
      this.set(STORAGE_KEYS.WORKOUT_TEMPLATES_WEEKLY, DEFAULT_WEEKLY_TEMPLATES);
      return DEFAULT_WEEKLY_TEMPLATES;
    }
    return templates;
  }

  public getActiveWeeklyTemplate(): WorkoutWeeklyTemplate {
    const templates = this.getWeeklyTemplates();
    return templates.find((t) => t.isActive) || templates[0] || DEFAULT_WEEKLY_TEMPLATES[0];
  }

  public setActiveWeeklyTemplate(id: string): void {
    const templates = this.getWeeklyTemplates();
    const updated = templates.map((t) => ({
      ...t,
      isActive: t.id === id,
      updatedAt: new Date().toISOString(),
    }));
    this.set(STORAGE_KEYS.WORKOUT_TEMPLATES_WEEKLY, updated);
  }

  public saveWeeklyTemplate(template: WorkoutWeeklyTemplate): void {
    const templates = this.getWeeklyTemplates();
    const idx = templates.findIndex((t) => t.id === template.id);
    const updatedTemplate = {
      ...template,
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      templates[idx] = updatedTemplate;
    } else {
      templates.push(updatedTemplate);
    }
    this.set(STORAGE_KEYS.WORKOUT_TEMPLATES_WEEKLY, templates);
  }

  public deleteWeeklyTemplate(id: string): void {
    const templates = this.getWeeklyTemplates();
    const filtered = templates.filter((t) => t.id !== id);
    if (filtered.length > 0 && !filtered.some((t) => t.isActive)) {
      filtered[0].isActive = true;
    }
    this.set(STORAGE_KEYS.WORKOUT_TEMPLATES_WEEKLY, filtered);
  }

  public duplicateWeeklyTemplate(id: string): WorkoutWeeklyTemplate {
    const templates = this.getWeeklyTemplates();
    const original = templates.find((t) => t.id === id) || templates[0];
    const newId = `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const cloned: WorkoutWeeklyTemplate = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      name: `${original.name} (Copy)`,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    templates.push(cloned);
    this.set(STORAGE_KEYS.WORKOUT_TEMPLATES_WEEKLY, templates);
    return cloned;
  }

  // --- Day Overrides (Single-Week Independence) ---

  public getDayOverrides(): Record<string, WeeklyPlanDayOverride> {
    return this.get<Record<string, WeeklyPlanDayOverride>>(STORAGE_KEYS.WORKOUT_DAY_OVERRIDES, {});
  }

  public getDayOverride(dateStr: string): WeeklyPlanDayOverride | null {
    const overrides = this.getDayOverrides();
    return overrides[dateStr] || null;
  }

  public saveDayOverride(override: WeeklyPlanDayOverride): void {
    const overrides = this.getDayOverrides();
    overrides[override.date] = {
      ...override,
      updatedAt: new Date().toISOString(),
    };
    this.set(STORAGE_KEYS.WORKOUT_DAY_OVERRIDES, overrides);
  }

  public deleteDayOverride(dateStr: string): void {
    const overrides = this.getDayOverrides();
    if (overrides[dateStr]) {
      delete overrides[dateStr];
      this.set(STORAGE_KEYS.WORKOUT_DAY_OVERRIDES, overrides);
    }
  }

  public resetWeekToTemplate(weekStartStr: string): void {
    const overrides = this.getDayOverrides();
    const base = new Date(weekStartStr + "T12:00:00Z");
    let changed = false;
    for (let i = 0; i < 7; i++) {
      const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
      const ds = d.toISOString().split("T")[0];
      if (overrides[ds]) {
        delete overrides[ds];
        changed = true;
      }
    }
    if (changed) {
      this.set(STORAGE_KEYS.WORKOUT_DAY_OVERRIDES, overrides);
    }
  }

  // --- Plan Resolution ---

  public getResolvedDayPlan(dateStr: string): ResolvedDayPlan {
    const overrides = this.getDayOverrides();
    const override = overrides[dateStr];

    const d = new Date(dateStr + "T12:00:00Z");
    const jsDay = d.getUTCDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // 0 = Mon, 6 = Sun
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayName = dayNames[dayOfWeek] || "Monday";

    // Check for genuinely logged completed workout
    const workouts = this.getWorkouts();
    const completedWorkout = workouts.find(
      (w) =>
        w.status === "completed" &&
        (w.planDate === dateStr || (w.startTime && w.startTime.startsWith(dateStr)))
    );

    if (override) {
      const status: "planned" | "completed" | "skipped" | "rest" = completedWorkout
        ? "completed"
        : override.status || (override.isRestDay ? "rest" : "planned");

      return {
        date: dateStr,
        dayOfWeek,
        dayName,
        isOverride: true,
        isRestDay: override.isRestDay,
        restNotes: override.restNotes,
        workoutName: override.workoutName || (override.isRestDay ? "Rest & Recovery" : "Scheduled Workout"),
        splitType: override.splitType || "custom",
        muscleGroups: override.muscleGroups || [],
        exercises: override.exercises || [],
        status,
        skipReason: override.skipReason,
        workoutSessionId: completedWorkout?.id || override.workoutSessionId,
        completedWorkout,
      };
    }

    const activeTemplate = this.getActiveWeeklyTemplate();
    const templateDay = activeTemplate.days.find((td) => td.dayOfWeek === dayOfWeek);

    if (templateDay) {
      const status: "planned" | "completed" | "skipped" | "rest" = completedWorkout
        ? "completed"
        : templateDay.isRestDay
        ? "rest"
        : "planned";

      return {
        date: dateStr,
        dayOfWeek,
        dayName,
        isOverride: false,
        isRestDay: templateDay.isRestDay,
        restNotes: templateDay.restNotes,
        workoutName: templateDay.workoutName || (templateDay.isRestDay ? "Rest & Recovery" : "Scheduled Workout"),
        splitType: templateDay.splitType || "custom",
        muscleGroups: templateDay.muscleGroups || [],
        exercises: templateDay.exercises || [],
        status,
        workoutSessionId: completedWorkout?.id,
        completedWorkout,
      };
    }

    return {
      date: dateStr,
      dayOfWeek,
      dayName,
      isOverride: false,
      isRestDay: true,
      restNotes: "Rest Day",
      workoutName: "Rest & Recovery",
      splitType: "custom",
      muscleGroups: [],
      exercises: [],
      status: completedWorkout ? "completed" : "rest",
      workoutSessionId: completedWorkout?.id,
      completedWorkout,
    };
  }

  public getWeeklyPlannerStats(weekStartStr: string) {
    const days: ResolvedDayPlan[] = [];
    const base = new Date(weekStartStr + "T12:00:00Z");

    for (let i = 0; i < 7; i++) {
      const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
      const ds = d.toISOString().split("T")[0];
      days.push(this.getResolvedDayPlan(ds));
    }

    const plannedWorkoutDays = days.filter((d) => !d.isRestDay).length;
    const restDays = days.filter((d) => d.isRestDay).length;
    const completedDays = days.filter((d) => d.status === "completed").length;
    const skippedDays = days.filter((d) => d.status === "skipped").length;

    // Planned rest days NEVER penalize consistency!
    const consistencyPercentage =
      plannedWorkoutDays > 0
        ? Math.min(100, Math.round((completedDays / plannedWorkoutDays) * 100))
        : completedDays > 0
        ? 100
        : 100;

    return {
      weekStart: weekStartStr,
      totalDays: 7,
      plannedWorkoutDays,
      restDays,
      completedDays,
      skippedDays,
      consistencyPercentage,
      days,
    };
  }

  // --- Custom Exercises & Favorites ---

  public getCustomExercises(): ExerciseDefinition[] {
    return this.get<ExerciseDefinition[]>(STORAGE_KEYS.CUSTOM_EXERCISES, []);
  }

  public saveCustomExercise(
    exercise: Omit<ExerciseDefinition, "id" | "isCustom" | "createdAt"> & { id?: string }
  ): ExerciseDefinition {
    const list = this.getCustomExercises();
    const id = exercise.id || `custom_ex_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const full: ExerciseDefinition = {
      ...exercise,
      id,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    const idx = list.findIndex((e) => e.id === id);
    if (idx >= 0) {
      list[idx] = full;
    } else {
      list.unshift(full);
    }
    this.set(STORAGE_KEYS.CUSTOM_EXERCISES, list);
    return full;
  }

  public deleteCustomExercise(id: string): void {
    const list = this.getCustomExercises().filter((e) => e.id !== id);
    this.set(STORAGE_KEYS.CUSTOM_EXERCISES, list);
  }

  public getFavoriteExerciseIds(): string[] {
    return this.get<string[]>(STORAGE_KEYS.FAVORITE_EXERCISES, []);
  }

  public isExerciseFavorite(id: string): boolean {
    return this.getFavoriteExerciseIds().includes(id);
  }

  public toggleFavoriteExercise(id: string): boolean {
    const favs = this.getFavoriteExerciseIds();
    const exists = favs.includes(id);
    const updated = exists ? favs.filter((f) => f !== id) : [...favs, id];
    this.set(STORAGE_KEYS.FAVORITE_EXERCISES, updated);
    return !exists;
  }

  // --- Goal Recommendations, Calculator & Roadmap ---

  public getGoalRecommendationHistory(): GoalRecommendationRecord[] {
    return this.get<GoalRecommendationRecord[]>(STORAGE_KEYS.GOAL_RECOMMENDATION_HISTORY, []);
  }

  public saveGoalRecommendation(rec: GoalRecommendationRecord): void {
    const list = this.getGoalRecommendationHistory();
    list.unshift(rec);
    this.set(STORAGE_KEYS.GOAL_RECOMMENDATION_HISTORY, list);
  }

  public getLatestGoalRecommendation(): GoalRecommendationRecord | null {
    const list = this.getGoalRecommendationHistory();
    return list.length > 0 ? list[0] : null;
  }

  public calculateGoalPreview(updated: Partial<UserProfile>): {
    previous: NutritionCalculationResult | null;
    proposed: NutritionCalculationResult;
    diffExplanation: string[];
  } {
    const current = this.getUser();
    const merged: UserProfile = { ...current, ...updated };
    const latestRec = this.getLatestGoalRecommendation();

    const previous: NutritionCalculationResult | null = latestRec
      ? latestRec.recommendations
      : current.dailyCalorieTarget > 0
      ? {
          bmr: 0,
          tdee: 0,
          targetCalories: current.dailyCalorieTarget,
          calorieAdjustment: 0,
          adjustmentType: "maintenance",
          proteinGrams: current.dailyProteinTargetGrams,
          proteinPerKg:
            current.weightKg > 0
              ? Math.round((current.dailyProteinTargetGrams / current.weightKg) * 10) / 10
              : 1.6,
          carbsGrams: current.dailyCarbsTargetGrams,
          fatGrams: current.dailyFatTargetGrams,
          fatPercentOfCalories:
            current.dailyCalorieTarget > 0
              ? Math.round(((current.dailyFatTargetGrams * 9) / current.dailyCalorieTarget) * 100)
              : 25,
          fiberGrams: Math.round((current.dailyCalorieTarget / 1000) * 14),
          waterGoalMl: current.dailyWaterGoalMl || 2500,
          isMinor: (current.age || 25) < 18,
          safeCalorieTargetProvided: (current.age || 25) >= 18,
          assumptions: ["Previous active targets"],
          limitations: [],
          version: current.activeRecommendationVersion || "legacy",
          calculatedAt: current.updatedAt,
        }
      : null;

    const proposed = calculatePersonalizedNutrition({
      weightKg: merged.weightKg || 70,
      heightCm: merged.heightCm || 175,
      age: merged.age || 25,
      gender: merged.gender,
      activityLevel: merged.activityLevel || "moderate",
      workoutFrequencyPerWeek: merged.workoutFrequencyPerWeek || 4,
      primaryGoal: merged.primaryGoal || "maintain_fitness",
      dietaryPreference: merged.dietaryPreference,
      goalWeightKg: merged.goalWeightKg,
      targetDate: merged.targetDate,
    });
    const diffExplanation: string[] = [];

    if (previous) {
      const calDiff = proposed.targetCalories - previous.targetCalories;
      if (calDiff !== 0) {
        diffExplanation.push(
          `Target calories ${calDiff > 0 ? "increased" : "reduced"} by ${Math.abs(calDiff)} kcal/day (from ${previous.targetCalories} to ${proposed.targetCalories} kcal).`
        );
      } else {
        diffExplanation.push(`Target calories remain steady at ${proposed.targetCalories} kcal/day.`);
      }

      const pDiff = proposed.proteinGrams - previous.proteinGrams;
      if (pDiff !== 0) {
        diffExplanation.push(
          `Protein target shifted by ${pDiff > 0 ? "+" : ""}${pDiff}g (${proposed.proteinGrams}g total, ~${proposed.proteinPerKg}g/kg body weight).`
        );
      }

      const cDiff = proposed.carbsGrams - previous.carbsGrams;
      const fDiff = proposed.fatGrams - previous.fatGrams;
      if (cDiff !== 0 || fDiff !== 0) {
        diffExplanation.push(
          `Macronutrient balance recalculated: Carbs ${proposed.carbsGrams}g (${proposed.carbsGrams * 4} kcal), Healthy Fats ${proposed.fatGrams}g (${proposed.fatPercentOfCalories}% of energy).`
        );
      }
    } else {
      diffExplanation.push(
        `Initial evidence-based target established: ${proposed.targetCalories} kcal/day with ${proposed.proteinGrams}g Protein, ${proposed.carbsGrams}g Carbs, and ${proposed.fatGrams}g Fat.`
      );
    }

    if (proposed.isMinor) {
      diffExplanation.push(
        `Under-18 Adolescent Protocol Active: Restrictive deficits are strictly bypassed to protect growth, development, and bone mineralization.`
      );
    } else if (proposed.adjustmentType === "deficit") {
      diffExplanation.push(
        `Preserved safe adult deficit of ${Math.abs(proposed.calorieAdjustment)} kcal/day below estimated TDEE (${proposed.tdee} kcal).`
      );
    } else if (proposed.adjustmentType === "surplus") {
      diffExplanation.push(
        `Applied lean mass surplus of +${proposed.calorieAdjustment} kcal/day above estimated TDEE (${proposed.tdee} kcal).`
      );
    }

    return { previous, proposed, diffExplanation };
  }

  public applyGoalChange(
    updated: Partial<UserProfile>,
    reason?: string
  ): { profile: UserProfile; recommendation: GoalRecommendationRecord } {
    const current = this.getUser();
    const merged: UserProfile = { ...current, ...updated };
    const recommendation = calculatePersonalizedNutrition({
      weightKg: merged.weightKg || 70,
      heightCm: merged.heightCm || 175,
      age: merged.age || 25,
      gender: merged.gender,
      activityLevel: merged.activityLevel || "moderate",
      workoutFrequencyPerWeek: merged.workoutFrequencyPerWeek || 4,
      primaryGoal: merged.primaryGoal || "maintain_fitness",
      dietaryPreference: merged.dietaryPreference,
      goalWeightKg: merged.goalWeightKg,
      targetDate: merged.targetDate,
    });

    const savedUser = this.saveUser({
      ...updated,
      dailyCalorieTarget: recommendation.targetCalories,
      dailyProteinTargetGrams: recommendation.proteinGrams,
      dailyCarbsTargetGrams: recommendation.carbsGrams,
      dailyFatTargetGrams: recommendation.fatGrams,
      dailyWaterGoalMl: recommendation.waterGoalMl,
      activeRecommendationVersion: recommendation.version,
    });

    const record: GoalRecommendationRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: savedUser.id,
      version: recommendation.version,
      effectiveDate: new Date().toISOString().split("T")[0],
      inputs: {
        weightKg: savedUser.weightKg,
        goalWeightKg: savedUser.goalWeightKg,
        heightCm: savedUser.heightCm,
        age: savedUser.age || 25,
        gender: savedUser.gender,
        activityLevel: savedUser.activityLevel,
        workoutFrequencyPerWeek: savedUser.workoutFrequencyPerWeek || 4,
        primaryGoal: savedUser.primaryGoal,
        dietaryPreference: savedUser.dietaryPreference,
        targetDate: savedUser.targetDate,
      },
      recommendations: recommendation,
      reasonForChange: reason || "Recalculated goal parameters",
      createdAt: new Date().toISOString(),
    };

    this.saveGoalRecommendation(record);
    return { profile: savedUser, recommendation: record };
  }

  public getActiveGoalRoadmap(): GoalRoadmapResult {
    const user = this.getUser();
    const measurements = this.getMeasurements();
    return calculateGoalRoadmap({
      currentWeightKg: user.weightKg || 70,
      goalWeightKg: user.goalWeightKg || user.weightKg || 70,
      primaryGoal: user.primaryGoal || "maintain_fitness",
      age: user.age || 25,
      weightHistory: measurements,
    });
  }

  public getActiveWorkoutSuggestion(): WorkoutGoalSuggestion {
    const user = this.getUser();
    return getWorkoutGoalSuggestion(user.primaryGoal, user.workoutFrequencyPerWeek || 4);
  }

  // Reset / Clear / Delete Account
  public deleteAccount(): void {
    if (typeof window === "undefined") return;
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
}

export const localStore = new LocalStateManager();
