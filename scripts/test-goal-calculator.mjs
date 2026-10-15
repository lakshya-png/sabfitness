import assert from "node:assert";
import {
  calculateBMR,
  calculateTDEE,
  calculatePersonalizedNutrition,
  calculateGoalRoadmap,
  getWorkoutGoalSuggestion,
} from "../src/lib/fitness/calculations.ts";

console.log("==================================================");
console.log("  SABFITNESS GOAL & NUTRITION CALCULATOR TEST SUITE");
console.log("==================================================");

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
  }
}

// 1. Mifflin-St Jeor BMR Tests
runTest("Mifflin-St Jeor BMR calculation for adult male", () => {
  // 10*70 + 6.25*175 - 5*25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 -> 1674
  const bmr = calculateBMR(70, 175, 25, "male");
  assert.strictEqual(bmr, 1674, `Expected 1674, got ${bmr}`);
});

runTest("Mifflin-St Jeor BMR calculation for adult female", () => {
  // 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 -> 1330
  const bmr = calculateBMR(60, 165, 28, "female");
  assert.strictEqual(bmr, 1330, `Expected 1330, got ${bmr}`);
});

// 2. TDEE with Workout Frequency Scaling
runTest("TDEE scaling with moderate activity (PAL 1.55) and 4 days/wk", () => {
  const bmr = 1674;
  const tdee = calculateTDEE(bmr, "moderate", 4);
  // 1674 * 1.55 = 2594.7 -> 2595
  assert.strictEqual(tdee, 2595, `Expected 2595, got ${tdee}`);
});

runTest("TDEE scaling with high frequency (6+ days) adds workout volume boost", () => {
  const bmr = 1674;
  const tdeeNormal = calculateTDEE(bmr, "moderate", 4); // 2595
  const tdeeHigh = calculateTDEE(bmr, "moderate", 6); // 1674 * (1.55 + 0.075 = 1.625) = 2720
  assert(tdeeHigh > tdeeNormal, `High frequency TDEE (${tdeeHigh}) should exceed normal (${tdeeNormal})`);
  assert.strictEqual(tdeeHigh, 2720, `Expected 2720, got ${tdeeHigh}`);
});

// 3. Strict Minor / Adolescent Safeguards (< 18)
runTest("CRITICAL SAFEGUARD: Never prescribe calorie deficit to minor (<18)", () => {
  const minorResult = calculatePersonalizedNutrition({
    weightKg: 65,
    heightCm: 170,
    age: 16,
    gender: "male",
    activityLevel: "moderate",
    workoutFrequencyPerWeek: 4,
    primaryGoal: "fat_loss",
  });

  assert.strictEqual(minorResult.isMinor, true, "isMinor must be true");
  assert.strictEqual(
    minorResult.safeCalorieTargetProvided,
    false,
    "safeCalorieTargetProvided must be false for minor with fat_loss goal"
  );
  assert.strictEqual(
    minorResult.adjustmentType,
    "maintenance",
    "Deficit must be converted to maintenance for minors"
  );
  assert.strictEqual(minorResult.calorieAdjustment, 0, "Calorie adjustment must be 0 for minors");
  assert(
    Math.abs(minorResult.targetCalories - minorResult.tdee) <= 2,
    `Minor calories (${minorResult.targetCalories}) must match full maintenance TDEE (${minorResult.tdee}) within macro rounding tolerance`
  );
  assert(
    minorResult.minorGuidance && minorResult.minorGuidance.includes("pediatrician"),
    "Minor guidance must mention consulting a pediatrician/dietitian"
  );
});

runTest("Minor with muscle gain receives safe growth surplus without extreme bulking", () => {
  const minorResult = calculatePersonalizedNutrition({
    weightKg: 65,
    heightCm: 170,
    age: 15,
    gender: "male",
    activityLevel: "moderate",
    workoutFrequencyPerWeek: 3,
    primaryGoal: "muscle_gain",
  });

  assert.strictEqual(minorResult.isMinor, true);
  assert.strictEqual(minorResult.adjustmentType, "surplus");
  assert.strictEqual(minorResult.calorieAdjustment, 200, "Minor surplus capped at safe +200 kcal");
  assert(
    Math.abs(minorResult.targetCalories - (minorResult.tdee + 200)) <= 2,
    `Minor calories (${minorResult.targetCalories}) must equal TDEE + 200 (${minorResult.tdee + 200})`
  );
});

// 4. Adult Deficits and Absolute Safety Floors
runTest("Adult fat loss applies safe 300-500 kcal deficit", () => {
  const adultResult = calculatePersonalizedNutrition({
    weightKg: 80,
    heightCm: 180,
    age: 30,
    gender: "male",
    activityLevel: "moderate",
    workoutFrequencyPerWeek: 4,
    primaryGoal: "fat_loss",
  });

  assert.strictEqual(adultResult.isMinor, false);
  assert.strictEqual(adultResult.adjustmentType, "deficit");
  assert(adultResult.calorieAdjustment <= -300 && adultResult.calorieAdjustment >= -500);
  assert(
    Math.abs(adultResult.targetCalories - (adultResult.tdee + adultResult.calorieAdjustment)) <= 2,
    `Target calories must equal TDEE + deficit within integer macro rounding`
  );
});

runTest("Adult safety floors: women cannot fall below 1,200 kcal, men below 1,500 kcal", () => {
  // Low weight / low height elderly adult
  const femaleLow = calculatePersonalizedNutrition({
    weightKg: 42,
    heightCm: 145,
    age: 65,
    gender: "female",
    activityLevel: "sedentary",
    workoutFrequencyPerWeek: 1,
    primaryGoal: "fat_loss",
  });
  assert(femaleLow.targetCalories >= 1200, `Female calories ${femaleLow.targetCalories} must be >= 1200`);

  const maleLow = calculatePersonalizedNutrition({
    weightKg: 48,
    heightCm: 155,
    age: 65,
    gender: "male",
    activityLevel: "sedentary",
    workoutFrequencyPerWeek: 1,
    primaryGoal: "fat_loss",
  });
  assert(maleLow.targetCalories >= 1500, `Male calories ${maleLow.targetCalories} must be >= 1500`);
});

// 5. Internally Consistent Macronutrient Math: P*4 + C*4 + F*9 === Target Calories
runTest("Internal Macronutrient Consistency: (P*4 + C*4 + F*9) === Target Calories", () => {
  const scenarios = [
    { weightKg: 70, heightCm: 175, age: 25, gender: "male", activityLevel: "moderate", workoutFrequencyPerWeek: 4, primaryGoal: "fat_loss" },
    { weightKg: 85, heightCm: 185, age: 28, gender: "male", activityLevel: "very_active", workoutFrequencyPerWeek: 5, primaryGoal: "muscle_gain" },
    { weightKg: 58, heightCm: 162, age: 24, gender: "female", activityLevel: "light", workoutFrequencyPerWeek: 3, primaryGoal: "maintain_fitness" },
    { weightKg: 62, heightCm: 168, age: 16, gender: "female", activityLevel: "moderate", workoutFrequencyPerWeek: 4, primaryGoal: "fat_loss" }, // minor
    { weightKg: 95, heightCm: 180, age: 35, gender: "male", activityLevel: "sedentary", workoutFrequencyPerWeek: 2, primaryGoal: "fat_loss" },
  ];

  for (const s of scenarios) {
    const res = calculatePersonalizedNutrition(s);
    const macroCalories = (res.proteinGrams * 4) + (res.carbsGrams * 4) + (res.fatGrams * 9);
    assert.strictEqual(
      macroCalories,
      res.targetCalories,
      `Scenario ${JSON.stringify(s.primaryGoal)} macro calories (${macroCalories}) must match target (${res.targetCalories})`
    );

    // Fat threshold check: at least 20% of energy
    assert(
      res.fatPercentOfCalories >= 20,
      `Fat percent (${res.fatPercentOfCalories}%) must be >= 20% for hormonal health`
    );

    // Protein adequacy check: at least 1.2 g/kg
    assert(
      res.proteinPerKg >= 1.2,
      `Protein per kg (${res.proteinPerKg}) must be >= 1.2 g/kg`
    );
  }
});

// 6. Goal Roadmap & Milestones
runTest("Progress Roadmap calculates delta, suggested 21-day review, and conservative milestones", () => {
  const roadmap = calculateGoalRoadmap({
    currentWeightKg: 75,
    goalWeightKg: 70,
    startingWeightKg: 75,
    primaryGoal: "fat_loss",
    age: 26,
    weightHistory: [
      { id: "m1", userId: "u1", date: "2026-05-01", weightKg: 76 },
      { id: "m2", userId: "u1", date: "2026-05-15", weightKg: 75 },
    ],
  });

  assert.strictEqual(roadmap.currentWeightKg, 75);
  assert.strictEqual(roadmap.goalWeightKg, 70);
  assert.strictEqual(roadmap.deltaKg, -5);
  assert(roadmap.weeklyMilestones.length > 0, "Roadmap must generate milestone checkpoints");
  assert.strictEqual(
    roadmap.weeklyMilestones[0].isEstimated,
    true,
    "Milestones must be marked as estimated mathematical guides"
  );
  assert(roadmap.suggestedReviewDate, "Roadmap must supply a review date");
});

// 7. Workout Split Goal Alignment
runTest("Workout Split Alignment suggests evidence-based split matching user goal", () => {
  const hypertrophySuggestion = getWorkoutGoalSuggestion("muscle_gain", 5);
  assert(
    hypertrophySuggestion.recommendedSplitName.includes("PPL") ||
    hypertrophySuggestion.recommendedSplitName.includes("Upper / Lower"),
    "Hypertrophy suggestion should recommend PPL or Upper/Lower"
  );

  const strengthSuggestion = getWorkoutGoalSuggestion("strength", 4);
  assert(
    strengthSuggestion.recommendedSplitName.includes("Upper / Lower"),
    "Strength 4-day should recommend Upper/Lower strength split"
  );
});

console.log("==================================================");
console.log(`  SUMMARY: ${passed} of ${total} tests PASSED!`);
console.log("==================================================");

if (passed !== total) {
  process.exit(1);
}
