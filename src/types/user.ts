export type FitnessGoalType =
  | "muscle_gain"
  | "fat_loss"
  | "maintain_fitness"
  | "strength_improvement"
  | "general_fitness_stamina"
  | "improve_consistency"
  | "custom";

export interface GoalDefinition {
  id: FitnessGoalType;
  title: string;
  tagline: string;
  description: string;
  recommendedCalorieModifier: number; // e.g. +300 for muscle gain, -400 for fat loss
  recommendedProteinPerKg: number; // e.g. 2.0g for muscle, 1.6g for maintain
}

export const FITNESS_GOALS: Record<FitnessGoalType, GoalDefinition> = {
  muscle_gain: {
    id: "muscle_gain",
    title: "Muscle Gain",
    tagline: "Hypertrophy & Lean Bulk",
    description: "Build lean muscle mass with progressive overload and a slight caloric surplus.",
    recommendedCalorieModifier: 300,
    recommendedProteinPerKg: 2.0,
  },
  fat_loss: {
    id: "fat_loss",
    title: "Fat Loss",
    tagline: "Caloric Deficit & Tone",
    description: "Shed body fat while preserving lean muscle through resistance training and balanced nutrition.",
    recommendedCalorieModifier: -400,
    recommendedProteinPerKg: 2.2,
  },
  maintain_fitness: {
    id: "maintain_fitness",
    title: "Maintain Fitness",
    tagline: "Equilibrium & Energy",
    description: "Maintain your current physique, stay energized, and cultivate long-term wellness.",
    recommendedCalorieModifier: 0,
    recommendedProteinPerKg: 1.6,
  },
  strength_improvement: {
    id: "strength_improvement",
    title: "Strength Improvement",
    tagline: "Power & Heavy Lifts",
    description: "Focus on neuromuscular adaptation, compound movements, and hitting new 1RM personal records.",
    recommendedCalorieModifier: 200,
    recommendedProteinPerKg: 1.9,
  },
  general_fitness_stamina: {
    id: "general_fitness_stamina",
    title: "General Fitness & Stamina",
    tagline: "Endurance & Health",
    description: "Boost cardiovascular stamina, mobility, agility, and day-to-day functional performance.",
    recommendedCalorieModifier: 0,
    recommendedProteinPerKg: 1.5,
  },
  improve_consistency: {
    id: "improve_consistency",
    title: "Improve Consistency",
    tagline: "Habit & Momentum",
    description: "Establish regular workout habits, celebrate streaks, and build sustainable routines.",
    recommendedCalorieModifier: 0,
    recommendedProteinPerKg: 1.6,
  },
  custom: {
    id: "custom",
    title: "Custom Goal",
    tagline: "Personalized Protocol",
    description: "Tailor your caloric, macronutrient, and training targets to your specific personal needs.",
    recommendedCalorieModifier: 0,
    recommendedProteinPerKg: 1.8,
  },
};

export type ActivityLevel = "sedentary" | "light" | "moderate" | "very_active" | "extra_active";
export type TrainingExperience = "beginner" | "intermediate" | "advanced";
export type EquipmentAvailability = "full_gym" | "dumbbells_only" | "home_gym" | "calisthenics_bodyweight";
export type DietaryPreference = "non_vegetarian" | "vegetarian" | "vegan" | "eggetarian" | "custom";
export type UnitSystem = "metric" | "imperial";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  birthYear?: number;
  age?: number;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  heightCm: number;
  weightKg: number;
  goalWeightKg?: number;
  workoutFrequencyPerWeek?: number; // 1-7 days per week
  primaryGoal: FitnessGoalType;
  secondaryGoals: FitnessGoalType[];
  activityLevel: ActivityLevel;
  trainingExperience: TrainingExperience;
  equipment: EquipmentAvailability;
  dietaryPreference: DietaryPreference;
  allergies?: string[];
  dietaryRestrictions?: string;
  foodPreferencesNotes?: string;
  targetDate?: string;
  unitSystem: UnitSystem;
  onboardingCompleted: boolean;
  isAdmin: boolean;
  inviteCode: string;
  dailyWaterGoalMl: number;
  dailyCalorieTarget: number;
  dailyProteinTargetGrams: number;
  dailyCarbsTargetGrams: number;
  dailyFatTargetGrams: number;
  fullName?: string;
  fitnessGoal?: string;
  targetWeightKg?: number;
  activeRecommendationVersion?: string;
  streakDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalChangeRecord {
  id: string;
  userId: string;
  previousPrimary: FitnessGoalType;
  newPrimary: FitnessGoalType;
  previousSecondary: FitnessGoalType[];
  newSecondary: FitnessGoalType[];
  reason?: string;
  changedAt: string;
}

export interface NutritionCalculationResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  calorieAdjustment: number;
  adjustmentType: "deficit" | "surplus" | "maintenance";
  proteinGrams: number;
  proteinPerKg: number;
  carbsGrams: number;
  fatGrams: number;
  fatPercentOfCalories: number;
  fiberGrams: number;
  waterGoalMl: number;
  isMinor: boolean;
  safeCalorieTargetProvided: boolean;
  minorGuidance?: string;
  assumptions: string[];
  limitations: string[];
  version: string;
  calculatedAt: string;
}

export interface RoadmapMilestone {
  weekNumber: number;
  projectedDate: string;
  targetWeightKg?: number;
  milestoneTitle: string;
  focusHabit: string;
  isEstimated: boolean;
}

export interface GoalRoadmapResult {
  currentWeightKg: number;
  goalWeightKg: number;
  deltaKg: number;
  startingWeightKg: number;
  weightTrendKgPerWeek: number;
  progressPercent: number;
  suggestedReviewDate: string;
  weeklyMilestones: RoadmapMilestone[];
  isMinor: boolean;
  roadmapSummary: string;
}

export interface GoalRecommendationRecord {
  id: string;
  userId: string;
  version: string;
  effectiveDate: string;
  inputs: {
    weightKg: number;
    goalWeightKg?: number;
    heightCm: number;
    age: number;
    gender?: "male" | "female" | "other" | "prefer_not_to_say";
    activityLevel: ActivityLevel;
    workoutFrequencyPerWeek: number;
    primaryGoal: FitnessGoalType;
    dietaryPreference: DietaryPreference;
    targetDate?: string;
  };
  recommendations: NutritionCalculationResult;
  reasonForChange?: string;
  createdAt: string;
}

export interface WorkoutGoalSuggestion {
  primaryGoal: FitnessGoalType;
  recommendedSplitId: string;
  recommendedSplitName: string;
  suggestedFrequencyDays: number;
  trainingFocus: string;
  progressionStrategy: string;
  suggestedCardioProtocol: string;
  recoveryNotes: string;
}

