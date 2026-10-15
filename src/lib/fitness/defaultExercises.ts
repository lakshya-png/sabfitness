import type { ExerciseDefinition } from "@/types/fitness";

export const DEFAULT_EXERCISES: ExerciseDefinition[] = [
  // CHEST
  {
    id: "ex_bench_press",
    name: "Barbell Bench Press",
    muscleGroup: "chest",
    secondaryMuscles: ["triceps", "shoulders"],
    category: "barbell",
    instructions: "Lie flat on the bench, grip the barbell slightly wider than shoulder-width, lower smoothly to mid-chest, and press explosively upwards.",
  },
  {
    id: "ex_incline_db_press",
    name: "Incline Dumbbell Press",
    muscleGroup: "chest",
    secondaryMuscles: ["shoulders", "triceps"],
    category: "dumbbell",
    instructions: "Set the bench to 30-45 degrees, press dumbbells overhead with control, keeping forearms vertical.",
  },
  {
    id: "ex_cable_crossover",
    name: "Cable Chest Fly",
    muscleGroup: "chest",
    secondaryMuscles: ["shoulders"],
    category: "cable",
    instructions: "Step forward with arms outstretched, bring handles together in an hugging arc across your chest.",
  },
  {
    id: "ex_pushups",
    name: "Push-Ups",
    muscleGroup: "chest",
    secondaryMuscles: ["triceps", "core"],
    category: "bodyweight",
    instructions: "Maintain a rigid plank posture, lower your chest until an inch from the floor, press back up.",
  },

  // BACK
  {
    id: "ex_deadlift",
    name: "Conventional Deadlift",
    muscleGroup: "back",
    secondaryMuscles: ["legs_hamstrings", "core"],
    category: "barbell",
    instructions: "Hinge at the hips with feet hip-width, engage lats, drive through the floor while keeping neutral spine.",
  },
  {
    id: "ex_lat_pulldown",
    name: "Lat Pulldown",
    muscleGroup: "back",
    secondaryMuscles: ["biceps"],
    category: "cable",
    instructions: "Grip wide bar, sit upright, pull bar down towards upper chest while driving elbows downward.",
  },
  {
    id: "ex_barbell_row",
    name: "Bent-Over Barbell Row",
    muscleGroup: "back",
    secondaryMuscles: ["biceps", "core"],
    category: "barbell",
    instructions: "Hinge forward to 45 degrees, pull barbell to lower ribcage, squeeze shoulder blades together.",
  },
  {
    id: "ex_pullups",
    name: "Pull-Ups",
    muscleGroup: "back",
    secondaryMuscles: ["biceps"],
    category: "bodyweight",
    instructions: "Overhand grip, pull body upward until chin clears bar, lower with controlled tempo.",
  },

  // SHOULDERS
  {
    id: "ex_overhead_press",
    name: "Standing Overhead Press",
    muscleGroup: "shoulders",
    secondaryMuscles: ["triceps", "core"],
    category: "barbell",
    instructions: "Barbell at collarbone, brace core and glutes, press bar vertically overhead until locked out.",
  },
  {
    id: "ex_db_lateral_raise",
    name: "Dumbbell Lateral Raise",
    muscleGroup: "shoulders",
    category: "dumbbell",
    instructions: "Slight forward torso lean, raise dumbbells out to the sides until parallel with shoulders.",
  },
  {
    id: "ex_face_pull",
    name: "Rope Face Pull",
    muscleGroup: "shoulders",
    secondaryMuscles: ["back"],
    category: "cable",
    instructions: "Pull rope towards bridge of nose with high elbows, externally rotating shoulders.",
  },

  // LEGS
  {
    id: "ex_barbell_squat",
    name: "Barbell Back Squat",
    muscleGroup: "legs_quads",
    secondaryMuscles: ["legs_hamstrings", "core"],
    category: "barbell",
    instructions: "Bar on traps, descend with knees tracking toes until thighs reach parallel, drive up forcefully.",
  },
  {
    id: "ex_leg_press",
    name: "45° Leg Press",
    muscleGroup: "legs_quads",
    category: "machine",
    instructions: "Place feet shoulder-width on sled, lower smoothly without lifting lower back from seat, press up.",
  },
  {
    id: "ex_romanian_deadlift",
    name: "Romanian Deadlift (RDL)",
    muscleGroup: "legs_hamstrings",
    secondaryMuscles: ["back"],
    category: "barbell",
    instructions: "Soft bend in knees, push hips backward to stretch hamstrings, return to standing with glute squeeze.",
  },
  {
    id: "ex_standing_calf_raise",
    name: "Standing Calf Raise",
    muscleGroup: "legs_calves",
    category: "machine",
    instructions: "Balls of feet on edge of platform, sink heels deep for full stretch, push high onto tiptoes.",
  },

  // ARMS
  {
    id: "ex_barbell_curl",
    name: "Barbell Bicep Curl",
    muscleGroup: "biceps",
    category: "barbell",
    instructions: "Underhand grip shoulder-width, curl bar upwards while keeping elbows pinned to ribs.",
  },
  {
    id: "ex_hammer_curl",
    name: "Dumbbell Hammer Curl",
    muscleGroup: "biceps",
    category: "dumbbell",
    instructions: "Palms facing inwards throughout movement, curl dumbbells towards shoulders.",
  },
  {
    id: "ex_tricep_pushdown",
    name: "Cable Tricep Pushdown",
    muscleGroup: "triceps",
    category: "cable",
    instructions: "Pin elbows at sides, extend forearms downwards until arms are fully straight.",
  },
  {
    id: "ex_skull_crushers",
    name: "Lying Tricep Extension",
    muscleGroup: "triceps",
    category: "barbell",
    instructions: "Lie on bench with EZ-bar or dumbbells, hinge at elbows lowering weight toward forehead, extend back up.",
  },

  // CORE & CARDIO
  {
    id: "ex_hanging_leg_raise",
    name: "Hanging Leg Raise",
    muscleGroup: "core",
    category: "bodyweight",
    instructions: "Hang from pull-up bar, raise straight or bent legs to 90 degrees without swinging.",
  },
  {
    id: "ex_plank",
    name: "Forearm Plank",
    muscleGroup: "core",
    category: "duration",
    instructions: "Hold rigid horizontal posture on elbows and toes, maintaining engaged core and flat back.",
  },
  {
    id: "ex_running_treadmill",
    name: "Treadmill Run / Jog",
    muscleGroup: "cardio",
    category: "cardio",
    instructions: "Set steady pace or interval tempo, maintain upright posture and light foot strikes.",
  },
];
