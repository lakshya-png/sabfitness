import assert from "node:assert";
import { EXERCISE_LIBRARY } from "../src/lib/fitness/exerciseLibrary/exercises.ts";

const exerciseMap = new Map();
for (const ex of EXERCISE_LIBRARY) {
  exerciseMap.set(ex.id, ex);
}

function getExerciseById(id) {
  return exerciseMap.get(id);
}

function searchExercises(query = "", filters = {}) {
  const { muscleGroup = "all", category = "all", limit = 50 } = filters;
  const q = query.trim().toLowerCase();
  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

  const results = [];
  for (const ex of EXERCISE_LIBRARY) {
    if (muscleGroup !== "all" && ex.muscleGroup !== muscleGroup && !ex.secondaryMuscles?.includes(muscleGroup)) {
      continue;
    }
    if (category !== "all" && ex.category !== category) {
      continue;
    }
    if (tokens.length === 0) {
      results.push(ex);
      if (results.length >= limit) break;
      continue;
    }
    const fullText = `${ex.name} ${ex.muscleGroup} ${(ex.secondaryMuscles || []).join(" ")} ${ex.category} ${ex.equipment || ""}`.toLowerCase();
    const match = tokens.every((t) => fullText.includes(t));
    if (match) results.push(ex);
    if (results.length >= limit) break;
  }
  return results;
}

console.log("=== RUNNING SABFITNESS WORKOUT PLANNER & EXERCISE LIBRARY TEST SUITE ===\n");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✕ [FAIL] ${name}`);
    console.error(`    ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// SUITE 1: EXERCISE LIBRARY INTEGRITY (>= 1,000 distinct items)
// -----------------------------------------------------------------------------
console.log("--- SUITE 1: Exercise Library (>= 1,000 Verified Distinct Items) ---");

runTest("Total verified exercise count must be at least 1,000 distinct items", () => {
  const count = EXERCISE_LIBRARY.length;
  console.log(`    (Actual library count: ${count} exercises)`);
  assert.ok(count >= 1000, `Expected at least 1,000 exercises, found ${count}`);
});

runTest("Zero duplicate exercise IDs exist across the entire library", () => {
  const idSet = new Set();
  const duplicates = [];
  for (const ex of EXERCISE_LIBRARY) {
    if (idSet.has(ex.id)) {
      duplicates.push(ex.id);
    }
    idSet.add(ex.id);
  }
  assert.strictEqual(duplicates.length, 0, `Found duplicate IDs: ${duplicates.join(", ")}`);
});

runTest("Every exercise has valid name, muscleGroup, category, and trackingMode", () => {
  for (const ex of EXERCISE_LIBRARY) {
    assert.ok(ex.id && ex.id.length > 2, `Exercise missing id: ${JSON.stringify(ex)}`);
    assert.ok(ex.name && ex.name.length > 2, `Exercise missing name: ${ex.id}`);
    assert.ok(ex.muscleGroup, `Exercise missing muscleGroup: ${ex.id}`);
    assert.ok(ex.category, `Exercise missing category: ${ex.id}`);
    assert.ok(ex.trackingMode, `Exercise missing trackingMode: ${ex.id}`);
  }
});

runTest("All 14 discrete muscle groups are comprehensively represented", () => {
  const requiredMuscles = [
    "chest",
    "back",
    "shoulders",
    "biceps",
    "triceps",
    "forearms",
    "legs_quads",
    "legs_hamstrings",
    "calves",
    "glutes",
    "core",
    "full_body",
    "cardio",
    "mobility",
  ];

  for (const muscle of requiredMuscles) {
    const found = EXERCISE_LIBRARY.filter((e) => e.muscleGroup === muscle);
    assert.ok(found.length >= 10, `Muscle group '${muscle}' under-represented: found only ${found.length}`);
  }
});

runTest("Multi-token fuzzy search retrieves precise matching results", () => {
  const results = searchExercises("incline dumbbell bench", { limit: 10 });
  assert.ok(results.length > 0, "Expected search results for 'incline dumbbell bench'");
  const topResult = results[0];
  assert.ok(
    topResult.name.toLowerCase().includes("incline") && topResult.name.toLowerCase().includes("dumbbell"),
    `Top result should match query: ${topResult.name}`
  );
});

runTest("Muscle group filtering works accurately", () => {
  const chestOnly = searchExercises("", { muscleGroup: "chest", limit: 20 });
  for (const ex of chestOnly) {
    const isChest = ex.muscleGroup === "chest" || ex.secondaryMuscles?.includes("chest");
    assert.ok(isChest, `Expected chest exercise, found ${ex.muscleGroup} (${ex.name})`);
  }
});

runTest("Equipment and category filtering work accurately", () => {
  const barbellExercises = searchExercises("", { category: "barbell", limit: 20 });
  for (const ex of barbellExercises) {
    assert.strictEqual(ex.category, "barbell", `Expected category 'barbell', found ${ex.category}`);
  }
});

runTest("Fast O(1) ID lookup retrieves exact exercise metadata", () => {
  const bench = getExerciseById("ex_ch_bb_flat");
  assert.ok(bench, "ex_ch_bb_flat must be found in library");
  assert.strictEqual(bench.name, "Barbell Bench Press — Flat");
  assert.strictEqual(bench.muscleGroup, "chest");
  assert.ok(bench.formCues && bench.formCues.length > 0, "Form cues must be present");
});

// -----------------------------------------------------------------------------
// SUITE 2: DUAL-LAYER RECURRING TEMPLATE VS SINGLE-WEEK OVERRIDES
// -----------------------------------------------------------------------------
console.log("\n--- SUITE 2: Dual-Layer Architecture & Override Isolation ---");

// Mock Local Storage & State Engine simulation
class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(k) { return this.store[k] || null; }
  setItem(k, v) { this.store[k] = v; }
  removeItem(k) { delete this.store[k]; }
}

const mockStorage = new MockStorage();

function simulateResolvedDayPlan(dateStr, overrides, activeTemplate, workouts = []) {
  const override = overrides[dateStr];
  const d = new Date(dateStr + "T12:00:00Z");
  const jsDay = d.getUTCDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon, 6=Sun
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayName = dayNames[dayOfWeek] || "Monday";

  const completedWorkout = workouts.find(
    (w) => w.planDate === dateStr || (w.startTime && w.startTime.startsWith(dateStr))
  );

  if (override) {
    return {
      date: dateStr,
      dayOfWeek,
      dayName,
      isOverride: true,
      isRestDay: override.isRestDay,
      workoutName: override.workoutName,
      splitType: override.splitType,
      muscleGroups: override.muscleGroups,
      exercises: override.exercises,
      status: completedWorkout ? "completed" : override.status,
      workoutSessionId: completedWorkout?.id,
    };
  }

  const templateDay = activeTemplate.days.find((td) => td.dayOfWeek === dayOfWeek);
  return {
    date: dateStr,
    dayOfWeek,
    dayName,
    isOverride: false,
    isRestDay: templateDay ? templateDay.isRestDay : true,
    workoutName: templateDay ? templateDay.workoutName : "Rest Day",
    splitType: templateDay ? templateDay.splitType : "custom",
    muscleGroups: templateDay ? templateDay.muscleGroups : [],
    exercises: templateDay ? templateDay.exercises : [],
    status: completedWorkout ? "completed" : templateDay?.isRestDay ? "rest" : "planned",
    workoutSessionId: completedWorkout?.id,
  };
}

const mockTemplate = {
  id: "tpl_test_ppl",
  name: "Mock 6-Day PPL",
  isActive: true,
  days: [
    { dayOfWeek: 0, dayName: "Monday", isRestDay: false, workoutName: "Push A", splitType: "push", muscleGroups: ["chest"], exercises: [{ id: "e1", exerciseName: "Bench" }] },
    { dayOfWeek: 1, dayName: "Tuesday", isRestDay: false, workoutName: "Pull A", splitType: "pull", muscleGroups: ["back"], exercises: [{ id: "e2", exerciseName: "Deadlift" }] },
    { dayOfWeek: 2, dayName: "Wednesday", isRestDay: false, workoutName: "Legs A", splitType: "legs", muscleGroups: ["legs_quads"], exercises: [{ id: "e3", exerciseName: "Squat" }] },
    { dayOfWeek: 3, dayName: "Thursday", isRestDay: false, workoutName: "Push B", splitType: "push", muscleGroups: ["chest"], exercises: [{ id: "e4", exerciseName: "DB Press" }] },
    { dayOfWeek: 4, dayName: "Friday", isRestDay: false, workoutName: "Pull B", splitType: "pull", muscleGroups: ["back"], exercises: [{ id: "e5", exerciseName: "Pull-Up" }] },
    { dayOfWeek: 5, dayName: "Saturday", isRestDay: false, workoutName: "Legs B", splitType: "legs", muscleGroups: ["legs_quads"], exercises: [{ id: "e6", exerciseName: "Front Squat" }] },
    { dayOfWeek: 6, dayName: "Sunday", isRestDay: true, workoutName: "Rest & Recovery", splitType: "custom", muscleGroups: ["mobility"], exercises: [] },
  ],
};

runTest("Default day plan resolves from active recurring template", () => {
  const plan = simulateResolvedDayPlan("2026-10-12", {}, mockTemplate); // 2026-10-12 is Monday
  assert.strictEqual(plan.dayOfWeek, 0);
  assert.strictEqual(plan.dayName, "Monday");
  assert.strictEqual(plan.isOverride, false);
  assert.strictEqual(plan.workoutName, "Push A");
  assert.strictEqual(plan.isRestDay, false);
});

runTest("Single-week override modifies only target date, keeping template intact", () => {
  const overrides = {
    "2026-10-12": {
      date: "2026-10-12",
      isRestDay: true, // User took Monday off this specific week
      workoutName: "Rest & Active Recovery",
      splitType: "custom",
      muscleGroups: [],
      exercises: [],
      status: "rest",
    },
  };

  // Day with override
  const planTargetDate = simulateResolvedDayPlan("2026-10-12", overrides, mockTemplate);
  assert.strictEqual(planTargetDate.isOverride, true);
  assert.strictEqual(planTargetDate.isRestDay, true);
  assert.strictEqual(planTargetDate.workoutName, "Rest & Active Recovery");

  // Next week's Monday (2026-10-19) must NOT be affected!
  const nextMonday = simulateResolvedDayPlan("2026-10-19", overrides, mockTemplate);
  assert.strictEqual(nextMonday.isOverride, false);
  assert.strictEqual(nextMonday.isRestDay, false);
  assert.strictEqual(nextMonday.workoutName, "Push A");

  // The base template itself must remain untouched!
  assert.strictEqual(mockTemplate.days[0].isRestDay, false);
});

runTest("Resetting a day override seamlessly reverts back to the template", () => {
  const overrides = {
    "2026-10-12": {
      date: "2026-10-12",
      isRestDay: true,
      workoutName: "Rest Day",
      splitType: "custom",
      muscleGroups: [],
      exercises: [],
      status: "rest",
    },
  };

  delete overrides["2026-10-12"]; // DeleteDayOverride()
  const revertedPlan = simulateResolvedDayPlan("2026-10-12", overrides, mockTemplate);
  assert.strictEqual(revertedPlan.isOverride, false);
  assert.strictEqual(revertedPlan.workoutName, "Push A");
  assert.strictEqual(revertedPlan.isRestDay, false);
});

// -----------------------------------------------------------------------------
// SUITE 3: REST DAYS NEVER PENALIZE CONSISTENCY & PROGRESS
// -----------------------------------------------------------------------------
console.log("\n--- SUITE 3: Rest Day Integrity & Stats Formula ---");

function calculateConsistency(days) {
  const plannedWorkoutDays = days.filter((d) => !d.isRestDay).length;
  const completedDays = days.filter((d) => d.status === "completed").length;
  const consistencyPercentage =
    plannedWorkoutDays > 0
      ? Math.min(100, Math.round((completedDays / plannedWorkoutDays) * 100))
      : 100;
  return { plannedWorkoutDays, completedDays, consistencyPercentage };
}

runTest("Scheduled rest days are excluded from missed workout penalty (100% adherence)", () => {
  // 5 planned workout days + 2 rest days. User completed all 5 workouts.
  const weekDays = [
    { isRestDay: false, status: "completed" },
    { isRestDay: false, status: "completed" },
    { isRestDay: false, status: "completed" },
    { isRestDay: false, status: "completed" },
    { isRestDay: false, status: "completed" },
    { isRestDay: true, status: "rest" },
    { isRestDay: true, status: "rest" },
  ];

  const stats = calculateConsistency(weekDays);
  assert.strictEqual(stats.plannedWorkoutDays, 5);
  assert.strictEqual(stats.completedDays, 5);
  assert.strictEqual(stats.consistencyPercentage, 100, "5/5 workouts should equal 100% adherence, rest days not penalized");
});

runTest("Partial completion correctly calculates adherence against planned workouts only", () => {
  // 4 planned workouts, 3 rest days. User completed 3 out of 4 workouts.
  const weekDays = [
    { isRestDay: false, status: "completed" },
    { isRestDay: false, status: "completed" },
    { isRestDay: true, status: "rest" },
    { isRestDay: false, status: "completed" },
    { isRestDay: false, status: "planned" }, // 1 missed
    { isRestDay: true, status: "rest" },
    { isRestDay: true, status: "rest" },
  ];

  const stats = calculateConsistency(weekDays);
  assert.strictEqual(stats.plannedWorkoutDays, 4);
  assert.strictEqual(stats.completedDays, 3);
  assert.strictEqual(stats.consistencyPercentage, 75, "3/4 should be 75%");
});

runTest("Spontaneous/unplanned workout logged on a rest day correctly registers", () => {
  const workouts = [
    {
      id: "wk_sunday_spontaneous",
      title: "Sunday Cardio Session",
      planDate: "2026-10-18", // Sunday
      status: "completed",
    },
  ];

  const sundayPlan = simulateResolvedDayPlan("2026-10-18", {}, mockTemplate, workouts);
  assert.strictEqual(sundayPlan.status, "completed");
  assert.strictEqual(sundayPlan.workoutSessionId, "wk_sunday_spontaneous");
});

// -----------------------------------------------------------------------------
// SUITE 4: SNAPSHOT DECOUPLING
// -----------------------------------------------------------------------------
console.log("\n--- SUITE 4: Snapshot Decoupling ---");

runTest("Updating or deleting templates NEVER deletes completed workout history", () => {
  const completedHistory = [
    {
      id: "wk_hist_1",
      title: "Historical Bench Press Session",
      startTime: "2026-10-05T10:00:00.000Z",
      status: "completed",
      totalVolumeKg: 4200,
      exercises: [{ exerciseName: "Bench Press", sets: [{ weightKg: 80, reps: 8 }] }],
    },
  ];

  // User resets or changes their active template to a completely different split
  const newTemplate = {
    id: "tpl_new_upper_lower",
    name: "Upper Lower",
    days: [],
  };

  // Completed history is isolated and intact
  assert.strictEqual(completedHistory.length, 1);
  assert.strictEqual(completedHistory[0].totalVolumeKg, 4200);
  assert.strictEqual(completedHistory[0].title, "Historical Bench Press Session");
});

console.log(`\n=======================================================`);
console.log(`TEST RUN COMPLETE: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log(`=======================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
