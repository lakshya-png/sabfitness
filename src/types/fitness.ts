export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "legs_quads"
  | "legs_hamstrings"
  | "legs_calves" // backward compatibility
  | "calves"
  | "glutes"
  | "core"
  | "full_body"
  | "cardio"
  | "mobility";

export type ExerciseCategory =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "weighted_bodyweight"
  | "kettlebell"
  | "bands"
  | "smith_machine"
  | "ez_bar"
  | "cardio"
  | "duration"
  | "other";

export type ExerciseMovementType =
  | "push"
  | "pull"
  | "hinge"
  | "squat"
  | "lunge"
  | "carry"
  | "rotation"
  | "anti_extension"
  | "anti_rotation"
  | "isolation"
  | "compound"
  | "mobility";

export type ExerciseTrackingMode =
  | "reps_weight"
  | "reps_only"
  | "time_duration"
  | "distance_time"
  | "interval";

export type ExerciseDifficulty = "beginner" | "intermediate" | "advanced";

export type WorkoutSplitType =
  | "push"
  | "pull"
  | "legs"
  | "upper"
  | "lower"
  | "full_body"
  | "cardio"
  | "mobility"
  | "custom";

export interface ExerciseDefinition {
  id: string;
  name: string;
  alternativeNames?: string[];
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  category: ExerciseCategory;
  movementType?: ExerciseMovementType;
  trackingMode?: ExerciseTrackingMode;
  difficulty?: ExerciseDifficulty;
  equipment?: string;
  instructions?: string;
  formCues?: string[];
  commonMistakes?: string[];
  safetyTips?: string[];
  imageUrl?: string;
  videoUrl?: string;
  isCustom?: boolean;
  isFavorite?: boolean;
  userId?: string;
  createdAt?: string;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: "normal" | "warmup" | "dropset" | "failure";
  weightKg?: number;
  reps?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  rpe?: number; // 6-10 scale
  completed: boolean;
  isPersonalRecord?: boolean;
}

export interface WorkoutExerciseItem {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  category: ExerciseCategory;
  notes?: string;
  restTimerSeconds?: number; // custom rest per exercise, e.g. 90s
  targetSets?: number;
  targetReps?: number;
  targetWeightKg?: number;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  userId: string;
  title: string;
  startTime: string; // ISO string
  endTime?: string;
  durationSeconds: number;
  notes?: string;
  status: "in_progress" | "completed" | "discarded";
  templateId?: string;
  planDate?: string; // YYYY-MM-DD if started from planner
  exercises: WorkoutExerciseItem[];
  totalVolumeKg: number;
  personalRecordsHit: number;
  syncedToCloud?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  recordType: "max_weight" | "max_reps" | "max_volume" | "estimated_1rm";
  value: number; // e.g. 100 kg or 15 reps
  weightKg?: number;
  reps?: number;
  workoutId: string;
  achievedAt: string;
}

export interface PlannedExerciseTarget {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  category: ExerciseCategory;
  trackingMode: ExerciseTrackingMode;
  targetSets: number; // e.g. 3 or 4
  targetRepsMin?: number; // e.g. 8
  targetRepsMax?: number; // e.g. 12
  targetWeightKg?: number; // e.g. 60
  targetWeightUnit?: "kg" | "lb";
  targetDurationSeconds?: number; // e.g. 60 for plank
  targetDistanceMeters?: number; // e.g. 5000 for 5k run
  restTimerSeconds?: number; // e.g. 90
  warmupSets?: number;
  targetRpe?: number; // 6-10 scale
  tempo?: string; // e.g. "3-0-1-0"
  notes?: string;
  supersetGroupId?: string; // e.g. "ss_1"
}

export interface PlannedDayWorkout {
  dayOfWeek: number; // 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
  dayName: string; // "Monday", "Tuesday", etc.
  isRestDay: boolean;
  restNotes?: string;
  workoutName: string; // e.g. "Push Day (Chest + Shoulders)"
  splitType: WorkoutSplitType;
  muscleGroups: MuscleGroup[];
  exercises: PlannedExerciseTarget[];
}

export interface WorkoutWeeklyTemplate {
  id: string;
  userId?: string;
  name: string; // e.g. "PPL 6-Day Hypertrophy Split"
  description?: string;
  isActive: boolean;
  days: PlannedDayWorkout[]; // 7 days (0 = Mon .. 6 = Sun)
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyPlanDayOverride {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  isRestDay: boolean;
  restNotes?: string;
  workoutName?: string;
  splitType?: WorkoutSplitType;
  muscleGroups: MuscleGroup[];
  exercises: PlannedExerciseTarget[];
  status: "planned" | "completed" | "skipped" | "rest";
  skipReason?: string;
  workoutSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedDayPlan {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Mon .. 6 = Sun
  dayName: string; // "Monday", etc.
  isOverride: boolean; // true if customized specifically for this date
  isRestDay: boolean;
  restNotes?: string;
  workoutName: string;
  splitType: WorkoutSplitType;
  muscleGroups: MuscleGroup[];
  exercises: PlannedExerciseTarget[];
  status: "planned" | "completed" | "skipped" | "rest";
  skipReason?: string;
  workoutSessionId?: string;
  completedWorkout?: WorkoutSession;
}

// Backward compatibility template format
export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  split: "push" | "pull" | "legs" | "upper" | "lower" | "full_body" | "custom";
  exercises: {
    exerciseId: string;
    exerciseName: string;
    targetSets: number;
    targetReps: number;
  }[];
}
