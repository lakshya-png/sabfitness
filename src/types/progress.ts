export interface BodyMeasurement {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  weightKg?: number;
  waistCm?: number;
  chestCm?: number;
  leftArmCm?: number;
  rightArmCm?: number;
  leftThighCm?: number;
  rightThighCm?: number;
  hipsCm?: number;
  bodyFatPercentage?: number;
  notes?: string;
  createdAt: string;
}

export type PhotoPose = "front" | "side" | "back" | "flexed" | "other";

export interface ProgressPhoto {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  pose: PhotoPose;
  storagePath: string; // private Supabase storage path or local object URL
  thumbnailUrl?: string;
  notes?: string;
  weightKgAtTime?: number;
  createdAt: string;
}

export type ProgressCardTheme = "alpine_sunset" | "glass_midnight" | "violet_aura" | "emerald_surge" | "sunset_gold";
export type ProgressCardDateRange = "7d" | "10d" | "14d" | "30d" | "custom";
export type ProgressCardSummaryType = "basic" | "detailed";

export interface CustomFitnessSummaryCard {
  id: string;
  userId: string;
  userName: string;
  title: string;
  dateRangeType: ProgressCardDateRange;
  startDate: string;
  endDate: string;
  theme: ProgressCardTheme;
  summaryType: ProgressCardSummaryType;
  
  // Aggregated True Metrics
  totalDaysInRange: number;
  workoutsCount: number;
  consistencyPercentage: number;
  
  // Nutrition Metrics (distinguishing logged days vs missing)
  loggedNutritionDays: number;
  averageCalories?: number;
  averageProteinGrams?: number;
  
  // Water Metrics
  loggedWaterDays: number;
  averageWaterLiters?: number;
  
  // Sensitive Metrics (gated by user confirmation)
  showSensitiveData: boolean;
  startWeightKg?: number;
  endWeightKg?: number;
  weightDeltaKg?: number;
  waistDeltaCm?: number;
  bodyFatPercentage?: number;
  
  notes?: string;
  createdAt: string;
}

export type ProgressCardData = CustomFitnessSummaryCard;
