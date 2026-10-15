import { EXERCISE_LIBRARY } from "./exercises";
import type {
  ExerciseDefinition,
  MuscleGroup,
  ExerciseCategory,
  ExerciseMovementType,
  ExerciseDifficulty,
  ExerciseTrackingMode,
} from "@/types/fitness";

export { EXERCISE_LIBRARY } from "./exercises";

export interface ExerciseSearchFilters {
  muscleGroup?: MuscleGroup | "all";
  secondaryMuscle?: MuscleGroup | "all";
  equipment?: string | "all";
  category?: ExerciseCategory | "all";
  difficulty?: ExerciseDifficulty | "all";
  movementType?: ExerciseMovementType | "all";
  trackingMode?: ExerciseTrackingMode | "all";
  favoritesOnly?: boolean;
  favoriteIds?: Set<string> | string[];
  customExercises?: ExerciseDefinition[];
  limit?: number;
}

// O(1) Fast Lookup Cache Map
const exerciseMap = new Map<string, ExerciseDefinition>();
for (const ex of EXERCISE_LIBRARY) {
  exerciseMap.set(ex.id, ex);
}

export function getExerciseById(id: string, customExercises?: ExerciseDefinition[]): ExerciseDefinition | undefined {
  if (customExercises && customExercises.length > 0) {
    const custom = customExercises.find((c) => c.id === id);
    if (custom) return custom;
  }
  return exerciseMap.get(id);
}

/**
 * Searches the 1,000+ exercise library with multi-token fuzzy matching and flexible filters.
 */
export function searchExercises(
  query: string = "",
  filters: ExerciseSearchFilters = {}
): ExerciseDefinition[] {
  const {
    muscleGroup = "all",
    equipment = "all",
    category = "all",
    difficulty = "all",
    movementType = "all",
    trackingMode = "all",
    favoritesOnly = false,
    favoriteIds,
    customExercises = [],
    limit = 50,
  } = filters;

  const favSet = favoriteIds instanceof Set ? favoriteIds : new Set(favoriteIds || []);
  const normalizedQuery = query.trim().toLowerCase();
  const tokens = normalizedQuery ? normalizedQuery.split(/\s+/).filter(Boolean) : [];

  const scoredResults: { ex: ExerciseDefinition; score: number }[] = [];
  const targetList = customExercises.length > 0 ? [...customExercises, ...EXERCISE_LIBRARY] : EXERCISE_LIBRARY;

  for (const ex of targetList) {
    // Favorites filter
    if (favoritesOnly && !favSet.has(ex.id)) {
      continue;
    }

    // Muscle group filter (checks primary or secondary)
    if (muscleGroup !== "all") {
      const matchPrimary = ex.muscleGroup === muscleGroup;
      const matchSecondary = ex.secondaryMuscles?.includes(muscleGroup);
      if (!matchPrimary && !matchSecondary) {
        continue;
      }
    }

    // Equipment filter
    if (equipment !== "all" && ex.equipment && !ex.equipment.toLowerCase().includes(equipment.toLowerCase())) {
      continue;
    }

    // Category filter
    if (category !== "all" && ex.category !== category) {
      continue;
    }

    // Difficulty filter
    if (difficulty !== "all" && ex.difficulty !== difficulty) {
      continue;
    }

    // Movement type filter
    if (movementType !== "all" && ex.movementType !== movementType) {
      continue;
    }

    // Tracking mode filter
    if (trackingMode !== "all" && ex.trackingMode !== trackingMode) {
      continue;
    }

    // No search query: assign base score (boost favorites)
    if (tokens.length === 0) {
      const score = favSet.has(ex.id) ? 10 : 1;
      scoredResults.push({ ex, score });
      continue;
    }

    // Multi-token text matching
    const nameLower = ex.name.toLowerCase();
    const altNames = (ex.alternativeNames || []).join(" ").toLowerCase();
    const primaryMuscle = ex.muscleGroup.toLowerCase();
    const secMuscles = (ex.secondaryMuscles || []).join(" ").toLowerCase();
    const eqLower = (ex.equipment || "").toLowerCase();
    const fullText = `${nameLower} ${altNames} ${primaryMuscle} ${secMuscles} ${eqLower} ${ex.category} ${ex.movementType || ""}`;

    let matchCount = 0;
    let score = 0;

    for (const token of tokens) {
      if (fullText.includes(token)) {
        matchCount++;
        if (nameLower.startsWith(token)) {
          score += 20;
        } else if (nameLower.includes(` ${token}`)) {
          score += 12;
        } else if (altNames.includes(token)) {
          score += 8;
        } else {
          score += 3;
        }
      }
    }

    if (matchCount === tokens.length) {
      if (favSet.has(ex.id)) score += 15;
      scoredResults.push({ ex, score });
    }
  }

  // Sort descending by score
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.slice(0, limit).map((r) => r.ex);
}

/**
 * Common staple lifts across strength and hypertrophy
 */
export function getPopularExercises(limit = 16): ExerciseDefinition[] {
  const stapleIds = [
    "ex_ch_bb_flat",
    "ex_ch_db_incline_30",
    "ex_bk_conv_dl",
    "ex_lg_sq_back_squat_high_bar",
    "ex_sh_ohp_standing_bb",
    "ex_bk_pu_1",
    "ex_bk_pd_1",
    "ex_bk_row_pendlay",
    "ex_lg_ham_1",
    "ex_lg_sq_hack_squat_machine",
    "ex_bi_1",
    "ex_tri_1",
    "ex_sh_lat_1",
    "ex_core_1",
    "ex_gl_1",
    "ex_cd_1",
  ];

  const result: ExerciseDefinition[] = [];
  for (const id of stapleIds) {
    const found = exerciseMap.get(id);
    if (found) result.push(found);
  }

  if (result.length < limit) {
    for (const ex of EXERCISE_LIBRARY) {
      if (!result.some((r) => r.id === ex.id)) {
        result.push(ex);
        if (result.length >= limit) break;
      }
    }
  }

  return result.slice(0, limit);
}

/**
 * Muscle group options with formatted user-facing labels
 */
export function getMuscleGroupOptions(): { value: MuscleGroup; label: string }[] {
  return [
    { value: "chest", label: "Chest (Pectorals)" },
    { value: "back", label: "Back (Lats, Traps, Rhomboids)" },
    { value: "shoulders", label: "Shoulders (Deltoids)" },
    { value: "biceps", label: "Biceps" },
    { value: "triceps", label: "Triceps" },
    { value: "forearms", label: "Forearms & Grip" },
    { value: "legs_quads", label: "Quads (Front Thighs)" },
    { value: "legs_hamstrings", label: "Hamstrings (Back Thighs)" },
    { value: "glutes", label: "Glutes (Hips)" },
    { value: "calves", label: "Calves" },
    { value: "core", label: "Abs & Core" },
    { value: "full_body", label: "Full Body / Olympic" },
    { value: "cardio", label: "Cardio & Endurance" },
    { value: "mobility", label: "Mobility & Stretching" },
  ];
}

/**
 * Equipment options with formatted user-facing labels
 */
export function getEquipmentOptions(): string[] {
  return [
    "Barbell",
    "Dumbbell",
    "Cable",
    "Machine",
    "Bodyweight",
    "Kettlebell",
    "Resistance Bands",
    "Smith Machine",
    "Pull-up Bar",
    "Gymnastic Rings",
    "Cardio Equipment",
  ];
}
