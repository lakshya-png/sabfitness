import assert from 'node:assert';
import { DEFAULT_FOODS } from '../src/lib/nutrition/defaultFoods.ts';
import {
  getWeightInGrams,
  calculateMacrosForQuantity,
  getAvailableUnitsForFood,
} from '../src/lib/nutrition/indianFoods/units.ts';
import {
  calculateRecipeTotals,
  calculatePerServingMacros,
  calculateCookedYieldMacros,
  createRecipeIngredient,
  updateRecipeIngredient,
  scaleRecipeForDiary,
} from '../src/lib/nutrition/recipeCalculator.ts';

console.log('========================================================');
console.log('  SABFITNESS SMART RECIPE CALCULATOR TEST SUITE');
console.log('========================================================');

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

// 1. Density-Specific Unit Conversions
runTest('Density: Honey conversions (1 tsp = 7g, 1 tbsp = 21g, 1 cup = 340g)', () => {
  const honey = DEFAULT_FOODS.find((f) => f.id === 'food_honey');
  assert(honey, 'Honey food must exist');
  assert.strictEqual(getWeightInGrams(honey, 1, 'tsp'), 7);
  assert.strictEqual(getWeightInGrams(honey, 2, 'tsp'), 14);
  assert.strictEqual(getWeightInGrams(honey, 1, 'tbsp'), 21);
  assert.strictEqual(getWeightInGrams(honey, 1, 'cup'), 340);
});

runTest('Density: Rolled Oats conversions (1 cup = 80g, 1/2 cup = 40g, 1 tbsp = 10g)', () => {
  const oats = DEFAULT_FOODS.find((f) => f.id === 'food_rolled_oats');
  assert(oats, 'Oats food must exist');
  assert.strictEqual(getWeightInGrams(oats, 1, 'cup'), 80);
  assert.strictEqual(getWeightInGrams(oats, 1, '1/2 cup'), 40);
  assert.strictEqual(getWeightInGrams(oats, 1, 'tbsp'), 10);
});

runTest('Density: Fresh Banana conversions (1 medium = 118g, small = 101g, large = 136g)', () => {
  const banana = DEFAULT_FOODS.find((f) => f.id === 'food_banana');
  assert(banana, 'Banana food must exist');
  assert.strictEqual(getWeightInGrams(banana, 1, 'medium'), 118);
  assert.strictEqual(getWeightInGrams(banana, 1, 'small'), 101);
  assert.strictEqual(getWeightInGrams(banana, 1, 'large'), 136);
});

runTest('Density: Milk & Cooking Fats (Milk cup = 240g, Oil tbsp = 14g)', () => {
  const milk = DEFAULT_FOODS.find((f) => f.id === 'food_milk_whole');
  const oil = DEFAULT_FOODS.find((f) => f.id === 'food_olive_oil');
  assert(milk && oil, 'Milk and Oil must exist');
  assert.strictEqual(getWeightInGrams(milk, 1, 'cup'), 240);
  assert.strictEqual(getWeightInGrams(milk, 1, 'glass'), 250);
  assert.strictEqual(getWeightInGrams(oil, 1, 'tbsp'), 14);
  assert.strictEqual(getWeightInGrams(oil, 1, 'tsp'), 4.5);
});

// 2. Core Prompt Example: Oats + Banana + Honey
runTest('Core Example: Oats 50g + Banana 1 medium + Honey 1 tsp', () => {
  const oats = DEFAULT_FOODS.find((f) => f.id === 'food_rolled_oats');
  const banana = DEFAULT_FOODS.find((f) => f.id === 'food_banana');
  const honey = DEFAULT_FOODS.find((f) => f.id === 'food_honey');

  const ingOats = createRecipeIngredient(oats, 50, 'g');
  const ingBanana = createRecipeIngredient(banana, 1, 'medium');
  const ingHoney = createRecipeIngredient(honey, 1, 'tsp');

  // Verify individual ingredient calculations
  assert.strictEqual(ingOats.weightGrams, 50);
  assert.strictEqual(ingOats.calories, 189);
  assert.strictEqual(ingOats.proteinGrams, 6.8);
  assert.strictEqual(ingOats.carbsGrams, 33.5);
  assert.strictEqual(ingOats.fatGrams, 3.5);

  assert.strictEqual(ingBanana.weightGrams, 118);
  assert.strictEqual(ingBanana.calories, 105);
  assert.strictEqual(ingBanana.proteinGrams, 1.3);
  assert.strictEqual(ingBanana.carbsGrams, 27);
  assert.strictEqual(ingBanana.fatGrams, 0.3);

  assert.strictEqual(ingHoney.weightGrams, 7);
  assert.strictEqual(ingHoney.calories, 21);
  assert.strictEqual(ingHoney.proteinGrams, 0);
  assert.strictEqual(ingHoney.carbsGrams, 5.8);
  assert.strictEqual(ingHoney.fatGrams, 0);

  // Combine ingredients
  const totals = calculateRecipeTotals([ingOats, ingBanana, ingHoney]);

  // Combined totals: 189 + 105 + 21 = 315 kcal
  assert.strictEqual(totals.totalCalories, 315, `Expected 315 kcal, got ${totals.totalCalories}`);
  assert.strictEqual(totals.totalProteinGrams, 8.1, `Expected 8.1g protein, got ${totals.totalProteinGrams}`);
  assert.strictEqual(totals.totalCarbsGrams, 66.3, `Expected 66.3g carbs, got ${totals.totalCarbsGrams}`);
  assert.strictEqual(totals.totalFatGrams, 3.8, `Expected 3.8g fat, got ${totals.totalFatGrams}`);
  assert.strictEqual(totals.totalFiberGrams, 8.2, `Expected 8.2g fiber, got ${totals.totalFiberGrams}`);
});

// 3. Dynamic Quantity Update: Honey 1 tsp -> 2 tsp
runTest('Dynamic Update: Changing Honey from 1 tsp to 2 tsp', () => {
  const oats = DEFAULT_FOODS.find((f) => f.id === 'food_rolled_oats');
  const banana = DEFAULT_FOODS.find((f) => f.id === 'food_banana');
  const honey = DEFAULT_FOODS.find((f) => f.id === 'food_honey');

  const ingOats = createRecipeIngredient(oats, 50, 'g');
  const ingBanana = createRecipeIngredient(banana, 1, 'medium');
  const ingHoney1 = createRecipeIngredient(honey, 1, 'tsp');

  // Update honey to 2 tsp
  const ingHoney2 = updateRecipeIngredient(ingHoney1, 2, 'tsp');
  assert.strictEqual(ingHoney2.weightGrams, 14);
  assert.strictEqual(ingHoney2.calories, 42); // 21 * 2 = 42 kcal
  assert.strictEqual(ingHoney2.carbsGrams, 11.6); // 5.8 * 2 = 11.6g

  const newTotals = calculateRecipeTotals([ingOats, ingBanana, ingHoney2]);
  assert.strictEqual(newTotals.totalCalories, 189 + 105 + 42); // 336 kcal
  assert.strictEqual(newTotals.totalCarbsGrams, 33.5 + 27.0 + 11.6); // 72.1g
});

// 4. Adding Milk: + 1 cup Whole Milk (240ml)
runTest('Add Ingredient: Adding 1 cup Whole Milk (240ml)', () => {
  const oats = DEFAULT_FOODS.find((f) => f.id === 'food_rolled_oats');
  const banana = DEFAULT_FOODS.find((f) => f.id === 'food_banana');
  const honey = DEFAULT_FOODS.find((f) => f.id === 'food_honey');
  const milk = DEFAULT_FOODS.find((f) => f.id === 'food_milk_whole');

  const ingredients = [
    createRecipeIngredient(oats, 50, 'g'),
    createRecipeIngredient(banana, 1, 'medium'),
    createRecipeIngredient(honey, 1, 'tsp'),
    createRecipeIngredient(milk, 1, 'cup'),
  ];

  const totals = calculateRecipeTotals(ingredients);
  // Milk adds 149 kcal, 7.7g P, 11.5g C, 8.0g F
  assert.strictEqual(totals.totalCalories, 315 + 149); // 464 kcal
  assert.strictEqual(totals.totalProteinGrams, Math.round((8.1 + 7.7) * 10) / 10); // 15.8g
  assert.strictEqual(totals.totalCarbsGrams, Math.round((66.3 + 11.5) * 10) / 10); // 77.8g
  assert.strictEqual(totals.totalFatGrams, Math.round((3.8 + 8.0) * 10) / 10); // 11.8g
});

// 5. Removing an Ingredient
runTest('Remove Ingredient: Removing Banana', () => {
  const oats = DEFAULT_FOODS.find((f) => f.id === 'food_rolled_oats');
  const honey = DEFAULT_FOODS.find((f) => f.id === 'food_honey');

  const ingredients = [
    createRecipeIngredient(oats, 50, 'g'),
    createRecipeIngredient(honey, 1, 'tsp'),
  ];

  const totals = calculateRecipeTotals(ingredients);
  assert.strictEqual(totals.totalCalories, 189 + 21); // 210 kcal
  assert.strictEqual(totals.totalCarbsGrams, 33.5 + 5.8); // 39.3g
});

// 6. Servings Scaler (1 serving vs 2 servings)
runTest('Serving Scaler: Scaling recipe to 2 servings', () => {
  const oats = DEFAULT_FOODS.find((f) => f.id === 'food_rolled_oats');
  const banana = DEFAULT_FOODS.find((f) => f.id === 'food_banana');
  const honey = DEFAULT_FOODS.find((f) => f.id === 'food_honey');

  const ingredients = [
    createRecipeIngredient(oats, 50, 'g'),
    createRecipeIngredient(banana, 1, 'medium'),
    createRecipeIngredient(honey, 1, 'tsp'),
  ];

  const perServing = calculatePerServingMacros(ingredients, 2);
  assert.strictEqual(perServing.calories, Math.round(315 / 2)); // 158 kcal
  assert.strictEqual(perServing.proteinGrams, Math.round((8.1 / 2) * 10) / 10); // 4.1g
  assert.strictEqual(perServing.carbsGrams, Math.round((66.3 / 2) * 10) / 10); // 33.2g
  assert.strictEqual(perServing.fatGrams, Math.round((3.8 / 2) * 10) / 10); // 1.9g
});

// 7. Cooked Batch Yield Weight Calculation
runTest('Cooked Yield: 350g cooked batch weight calculation', () => {
  const oats = DEFAULT_FOODS.find((f) => f.id === 'food_rolled_oats');
  const banana = DEFAULT_FOODS.find((f) => f.id === 'food_banana');
  const honey = DEFAULT_FOODS.find((f) => f.id === 'food_honey');

  const ingredients = [
    createRecipeIngredient(oats, 50, 'g'),
    createRecipeIngredient(banana, 1, 'medium'),
    createRecipeIngredient(honey, 1, 'tsp'),
  ];
  const totals = calculateRecipeTotals(ingredients); // 315 kcal, 8.1g P, 66.3g C, 3.8g F
  const cookedYield = calculateCookedYieldMacros(totals, 350);

  assert(cookedYield !== null, 'Cooked yield must be calculated');
  assert.strictEqual(cookedYield.cookedWeightGrams, 350);
  assert.strictEqual(cookedYield.rawWeightGrams, 175);
  assert.strictEqual(cookedYield.waterYieldRatio, 2.0); // 350 / 175 = 2.0x

  // Nutrition per 100g cooked: (315 / 350) * 100 = 90.0 kcal
  assert.strictEqual(cookedYield.caloriesPer100gCooked, 90.0);
  assert.strictEqual(cookedYield.proteinPer100gCooked, 2.3);
  assert.strictEqual(cookedYield.carbsPer100gCooked, 18.9);
  assert.strictEqual(cookedYield.fatPer100gCooked, 1.1);
});

// 8. Diary Logging by Weighed Plate Portion (175g cooked out of 350g)
runTest('Diary Logging: Custom 175g cooked portion produces exact 50% snapshot', () => {
  const oats = DEFAULT_FOODS.find((f) => f.id === 'food_rolled_oats');
  const banana = DEFAULT_FOODS.find((f) => f.id === 'food_banana');
  const honey = DEFAULT_FOODS.find((f) => f.id === 'food_honey');

  const recipe = {
    id: 'test_recipe_porridge',
    name: 'Oatmeal Porridge',
    servings: 1,
    cookedWeightGrams: 350,
    rawWeightGrams: 175,
    ingredients: [
      createRecipeIngredient(oats, 50, 'g'),
      createRecipeIngredient(banana, 1, 'medium'),
      createRecipeIngredient(honey, 1, 'tsp'),
    ],
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-15T00:00:00.000Z',
  };

  const loggedItem = scaleRecipeForDiary(recipe, { cookedPortionGrams: 175 }, 'breakfast', '2026-10-15');
  assert.strictEqual(loggedItem.mealType, 'breakfast');
  assert.strictEqual(loggedItem.servingUnit, 'g cooked');
  assert.strictEqual(loggedItem.servingAmount, 175);
  // 175/350 = 0.5 ratio
  assert.strictEqual(loggedItem.calories, Math.round(315 * 0.5)); // 158 kcal
  assert.strictEqual(loggedItem.proteinGrams, Math.round(8.1 * 0.5 * 10) / 10); // 4.1g
  assert.strictEqual(loggedItem.carbsGrams, Math.round(66.3 * 0.5 * 10) / 10); // 33.2g
  assert.strictEqual(loggedItem.fatGrams, Math.round(3.8 * 0.5 * 10) / 10); // 1.9g
  assert.strictEqual(loggedItem.isRecipe, true);
});

// 9. Diary Immutability: Mutating original recipe does NOT corrupt logged diary item
runTest('Diary Immutability: Historical log remains intact when recipe changes', () => {
  const oats = DEFAULT_FOODS.find((f) => f.id === 'food_rolled_oats');
  const honey = DEFAULT_FOODS.find((f) => f.id === 'food_honey');

  const recipe = {
    id: 'rec_original',
    name: 'Simple Oats',
    servings: 1,
    ingredients: [
      createRecipeIngredient(oats, 50, 'g'),
      createRecipeIngredient(honey, 1, 'tsp'),
    ],
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-15T00:00:00.000Z',
  };

  const snapshotLog = scaleRecipeForDiary(recipe, 1, 'breakfast', '2026-10-15');
  const initialLoggedCalories = snapshotLog.calories;

  // Now mutate recipe by doubling oats to 100g
  recipe.ingredients[0] = createRecipeIngredient(oats, 100, 'g');

  // Verify snapshotLog did NOT change
  assert.strictEqual(snapshotLog.calories, initialLoggedCalories);
  assert.strictEqual(snapshotLog.calories, 210); // 189 + 21
});

console.log(`\n=== TEST SUMMARY: ${passed}/${total} TESTS PASSED ===`);
if (passed !== total) process.exit(1);
