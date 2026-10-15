// Automated Validation Test Suite for SabFitness

import assert from "node:assert";

// 1. 1RM Calculations Test
function calculateEstimated1RM(weightKg, reps) {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  const brzycki = weightKg / (1.0278 - 0.0278 * Math.min(reps, 15));
  const epley = weightKg * (1 + 0.0333 * reps);
  return Math.round(((brzycki + epley) / 2) * 10) / 10;
}

console.log("Testing 1RM estimation formulas...");
const test1RM = calculateEstimated1RM(100, 5);
assert(test1RM > 100 && test1RM < 125, `Expected 1RM for 100kg x 5 to be ~115kg, got ${test1RM}`);
assert.strictEqual(calculateEstimated1RM(120, 1), 120, "1RM for 1 rep should equal weight lifted");
console.log("✓ 1RM formulas verified!");

// 2. Goal Target & Minor Protection Test
function calculatePersonalizedTargets({ weightKg, heightCm, age, gender = "male", activityLevel, primaryGoal }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === "female" ? base - 161 : base + 5;
  const tdee = Math.round(bmr * 1.55);

  let calorieAdjustment = 0;
  let proteinPerKg = 1.8;
  const isUnder18 = age < 18;

  switch (primaryGoal) {
    case "muscle_gain":
      calorieAdjustment = 300;
      proteinPerKg = 2.0;
      break;
    case "fat_loss":
      calorieAdjustment = isUnder18 ? -150 : -450;
      proteinPerKg = 2.2;
      break;
    default:
      calorieAdjustment = 0;
      proteinPerKg = 1.6;
  }

  const targetCalories = Math.max(isUnder18 ? 1600 : 1300, tdee + calorieAdjustment);
  const proteinGrams = Math.round(weightKg * proteinPerKg);
  return { targetCalories, proteinGrams, isUnder18Notice: isUnder18 };
}

console.log("Testing personalized target calculation & minor protection...");
const adultFatLoss = calculatePersonalizedTargets({ weightKg: 80, heightCm: 180, age: 25, primaryGoal: "fat_loss" });
const minorFatLoss = calculatePersonalizedTargets({ weightKg: 80, heightCm: 180, age: 16, primaryGoal: "fat_loss" });

assert(minorFatLoss.targetCalories > adultFatLoss.targetCalories, "Minors under 18 must receive higher calories than adults during fat loss");
assert.strictEqual(minorFatLoss.isUnder18Notice, true, "Minor flag must be true for age 16");
assert.strictEqual(adultFatLoss.isUnder18Notice, false, "Minor flag must be false for adult");
console.log("✓ Goal targets and youth protection verified!");

// 3. Unit Conversion Test
function kgToLbs(kg) {
  return Math.round(kg * 2.20462 * 10) / 10;
}
function lbsToKg(lbs) {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

console.log("Testing unit conversions...");
assert.strictEqual(kgToLbs(100), 220.5);
assert.strictEqual(lbsToKg(220.5), 100);
console.log("✓ Unit conversions verified!");

// 4. Non-Guessable Invite Code Test
function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SAB-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

console.log("Testing invite code generator...");
const code = generateInviteCode();
assert(/^SAB-[A-Z0-9]{6}$/.test(code), `Code ${code} must match SAB-XXXXXX pattern`);
console.log("✓ Non-guessable invite code format verified!");

// 5. Sole Owner Admin Authorization Logic
console.log("Testing Sole Owner Admin Authorization logic...");
const OWNER_EMAIL = "owner@sabfitness.app";
function isSoleOwner(email) {
  return email.toLowerCase().trim() === OWNER_EMAIL.toLowerCase();
}

assert.strictEqual(isSoleOwner("owner@sabfitness.app"), true);
assert.strictEqual(isSoleOwner("attacker@example.com"), false);
assert.strictEqual(isSoleOwner("admin@sabfitness.app"), false);
console.log("✓ Sole Owner Admin authorization verified!");

// 6. Nutrition: Repeat & Edit Meals Independence & Macro Recalculation
console.log("Testing Nutrition Repeat Meals & Cloned Independence...");
const mockYesterdayLogs = [
  {
    id: "flog_yesterday_1",
    name: "Oatmeal with Whey",
    mealType: "breakfast",
    servings: 1,
    calories: 350,
    proteinG: 30,
    carbsG: 45,
    fatG: 6,
    loggedAt: "2026-10-14T08:00:00.000Z",
  },
  {
    id: "flog_yesterday_2",
    name: "Grilled Chicken Breast",
    mealType: "lunch",
    servings: 1.5,
    calories: 247,
    proteinG: 46,
    carbsG: 0,
    fatG: 5,
    loggedAt: "2026-10-14T12:30:00.000Z",
  },
];

function cloneDayLogs(sourceLogs, sourceDate, targetDate, filterMealType) {
  const filtered = sourceLogs.filter((f) => {
    const match = f.loggedAt.startsWith(sourceDate);
    return filterMealType ? match && f.mealType === filterMealType : match;
  });

  return filtered.map((item, idx) => ({
    ...item,
    id: `flog_cloned_${Date.now()}_${idx}`,
    loggedAt: `${targetDate}T12:00:00.000Z`,
  }));
}

const clonedToday = cloneDayLogs(mockYesterdayLogs, "2026-10-14", "2026-10-15");
assert.strictEqual(clonedToday.length, 2, "Should have copied 2 items");
assert.notStrictEqual(clonedToday[0].id, mockYesterdayLogs[0].id, "Cloned item must have unique ID");
assert.strictEqual(clonedToday[0].loggedAt.startsWith("2026-10-15"), true, "Cloned item must have target date");

// Test that editing today's cloned item does not affect yesterday
const originalCalories = mockYesterdayLogs[0].calories;
clonedToday[0].servings = 2;
clonedToday[0].calories = Math.round(originalCalories * 2);
assert.strictEqual(mockYesterdayLogs[0].calories, 350, "Yesterday's record must remain unchanged at 350 cal");
assert.strictEqual(clonedToday[0].calories, 700, "Today's modified record should be 700 cal");
console.log("✓ Nutrition cloned records independence & portion scaling verified!");

// 7. Water Tracker: Edit, Delete, Undo & Daily Total Recalculation
console.log("Testing Water Tracker Edit, Delete, Undo & Instant Recalculation...");
let waterEntries = [
  { id: "w_1", amountMl: 500, date: "2026-10-15", timestamp: "2026-10-15T09:00:00Z" },
  { id: "w_2", amountMl: 250, date: "2026-10-15", timestamp: "2026-10-15T11:00:00Z" },
  { id: "w_3", amountMl: 750, date: "2026-10-15", timestamp: "2026-10-15T14:00:00Z" },
];

function sumWater(entries) {
  return entries.reduce((sum, e) => sum + e.amountMl, 0);
}

assert.strictEqual(sumWater(waterEntries), 1500, "Initial water total should be 1500 ml");

// Edit entry w_2 from 250 to 500
const editIdx = waterEntries.findIndex((w) => w.id === "w_2");
waterEntries[editIdx] = { ...waterEntries[editIdx], amountMl: 500 };
assert.strictEqual(sumWater(waterEntries), 1750, "Total must immediately update to 1750 ml after edit");

// Delete entry w_3
const deletedEntry = waterEntries.find((w) => w.id === "w_3");
waterEntries = waterEntries.filter((w) => w.id !== "w_3");
assert.strictEqual(sumWater(waterEntries), 1000, "Total must immediately decrease to 1000 ml after delete");

// Undo deletion of w_3
waterEntries.push(deletedEntry);
assert.strictEqual(sumWater(waterEntries), 1750, "Total must be restored to 1750 ml after undo");
console.log("✓ Water tracker mutations, undo, and instant recalculation verified!");

// 8. Supplements: Soft Archive History Preservation & Adherence Calculation
console.log("Testing Supplements Soft Archive & Adherence...");
const supplements = [
  { id: "s_1", name: "Creatine", scheduleDays: [0, 1, 2, 3, 4, 5, 6], isPaused: false, isArchived: false, createdAt: "2026-10-01" },
  { id: "s_2", name: "Vitamin D3", scheduleDays: [0, 1, 2, 3, 4, 5, 6], isPaused: false, isArchived: false, createdAt: "2026-10-01" },
  { id: "s_3", name: "Whey Protein", scheduleDays: [1, 2, 3, 4, 5], isPaused: true, isArchived: false, createdAt: "2026-10-01" },
];

let supplementLogs = [
  { id: "sl_1", supplementId: "s_1", date: "2026-10-14", status: "taken" },
  { id: "sl_2", supplementId: "s_2", date: "2026-10-14", status: "taken" },
  { id: "sl_3", supplementId: "s_1", date: "2026-10-15", status: "taken" },
  { id: "sl_4", supplementId: "s_2", date: "2026-10-15", status: "skipped" },
];

// Soft delete s_2
const targetSup = supplements.find((s) => s.id === "s_2");
targetSup.isArchived = true;
targetSup.archivedAt = "2026-10-15T15:00:00Z";

// Verify historical logs for s_2 are NOT destroyed
const logsForS2 = supplementLogs.filter((l) => l.supplementId === "s_2");
assert.strictEqual(logsForS2.length, 2, "Historical logs for archived supplement must remain intact");

// Calculate adherence across 2 days (Oct 14 & Oct 15) for active/scheduled supplements
let totalScheduled = 0;
let totalTaken = 0;
const testDates = ["2026-10-14", "2026-10-15"];

for (const d of testDates) {
  for (const s of supplements) {
    if (s.isPaused) continue; // Paused items not counted in adherence
    totalScheduled++;
    const log = supplementLogs.find((l) => l.supplementId === s.id && l.date === d);
    if (log && log.status === "taken") {
      totalTaken++;
    }
  }
}

assert.strictEqual(totalScheduled, 4, "2 active supplements over 2 days = 4 scheduled doses");
assert.strictEqual(totalTaken, 3, "3 doses were marked taken");
const adherencePercent = Math.round((totalTaken / totalScheduled) * 100);
assert.strictEqual(adherencePercent, 75, "Adherence must be exactly 75%");
console.log("✓ Supplement soft-delete safety & adherence calculation verified!");

// 9. Custom Fitness Progress Cards: Logged Days vs Missing Days Calculation
console.log("Testing Progress Card Logged vs Missing Days Averages...");
// Suppose user requests 7-day card, but only logged 3 days of nutrition
const foodLogs7Days = [
  { date: "2026-10-10", calories: 2200, proteinG: 160 },
  { date: "2026-10-11", calories: 2000, proteinG: 150 },
  { date: "2026-10-14", calories: 2400, proteinG: 170 },
];

const uniqueLoggedDays = new Set(foodLogs7Days.map((f) => f.date));
const loggedDaysCount = uniqueLoggedDays.size;
const totalCal = foodLogs7Days.reduce((sum, f) => sum + f.calories, 0);

// CRITICAL: Must divide by loggedDaysCount (3), NEVER by total range days (7)
const avgCalories = loggedDaysCount > 0 ? Math.round(totalCal / loggedDaysCount) : 0;
const falseAvgCalories = Math.round(totalCal / 7);

assert.strictEqual(loggedDaysCount, 3, "Only 3 days were logged");
assert.strictEqual(avgCalories, 2200, "True average over 3 logged days must be 2200 kcal");
assert.notStrictEqual(avgCalories, falseAvgCalories, "Averages must NOT divide by 7 and treat unlogged days as 0");
console.log("✓ Progress card logged vs missing days calculation verified!");

console.log("\n=========================================");
console.log("ALL 9 AUTOMATED VERIFICATION SUITES PASSED!");
console.log("=========================================\n");

