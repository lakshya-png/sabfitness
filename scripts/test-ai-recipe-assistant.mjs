import assert from "assert";
import {
  matchFoodInDatabases,
  groundRecipeDraft,
  heuristicRecipePlanner,
  applyRecipeModification,
  convertDraftToRecipeDefinition,
  convertDraftToLoggedItem,
} from "../src/lib/nutrition/aiRecipeEngine.ts";

console.log("=== RUNNING SABFITNESS AI RECIPE ASSISTANT TEST SUITE ===");

let testsPassed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    process.exitCode = 1;
  }
}

// 1. Food database matching & grounding
runTest("Database Grounding: matches oats, banana, honey, milk with verified entries", () => {
  const matchOats = matchFoodInDatabases("rolled oats");
  assert.ok(matchOats, "Should match rolled oats");
  assert.strictEqual(matchOats.food.id, "food_rolled_oats");

  const matchBanana = matchFoodInDatabases("banana");
  assert.ok(matchBanana, "Should match banana");

  const matchHoney = matchFoodInDatabases("honey");
  assert.ok(matchHoney, "Should match honey");
  assert.strictEqual(matchHoney.food.id, "food_honey");

  const matchPaneer = matchFoodInDatabases("paneer");
  assert.ok(matchPaneer, "Should match paneer");

  const matchGhee = matchFoodInDatabases("ghee");
  assert.ok(matchGhee, "Should match ghee");
  assert.strictEqual(matchGhee.food.id, "fat_cow_ghee");
});

// 2. Query: "Make a recipe with oats and milk"
runTest("NLP Query: 'Make a recipe with oats and milk' generates draft with defaults and questions", () => {
  const response = heuristicRecipePlanner({
    prompt: "Make a recipe with oats and milk",
  });

  assert.ok(response.draft, "Draft must exist");
  assert.strictEqual(response.draft.ingredients.length, 2);
  const oats = response.draft.ingredients.find((i) => i.name.toLowerCase().includes("oats"));
  const milk = response.draft.ingredients.find((i) => i.name.toLowerCase().includes("milk"));
  assert.ok(oats, "Must have oats");
  assert.ok(milk, "Must have milk");
  assert.strictEqual(oats.quantity, 50, "Default oats should be 50g");
  assert.strictEqual(milk.quantity, 240, "Default milk should be 240ml");
  assert.strictEqual(oats.isProposedDefault, true, "Unspecified oats quantity must be marked as default");

  // Nutrition must be mathematically grounded
  assert.strictEqual(response.draft.totalCalories, oats.calories + milk.calories);
  assert.ok(response.clarifyingQuestions.length > 0, "Must ask clarifying questions for milk type/sweetener");
});

// 3. Query: "Oats with banana and honey"
runTest("NLP Query: 'Oats with banana and honey' builds 4-ingredient grounded meal", () => {
  const response = heuristicRecipePlanner({
    prompt: "Oats with banana and honey",
  });

  const ingredients = response.draft.ingredients;
  assert.strictEqual(ingredients.length, 4, "Must contain oats, milk, banana, honey");
  const honey = ingredients.find((i) => i.name.toLowerCase().includes("honey"));
  const banana = ingredients.find((i) => i.name.toLowerCase().includes("banana"));
  assert.ok(honey, "Must include honey");
  assert.ok(banana, "Must include banana");
  assert.strictEqual(honey.calories, 21, "1 tsp honey is 21 kcal");
  assert.strictEqual(banana.calories, 105, "1 medium banana is 105 kcal");
  assert.ok(response.draft.totalCalories > 400, "Total calories should accurately reflect all 4 items");
});

// 4. Query: "Make paneer bhurji with the ingredients I have"
runTest("NLP Query: 'Make paneer bhurji' structures traditional Indian bhurji with aromatics & fat", () => {
  const response = heuristicRecipePlanner({
    prompt: "Make paneer bhurji with the ingredients I have",
  });

  const ingNames = response.draft.ingredients.map((i) => i.name.toLowerCase());
  assert.ok(ingNames.some((n) => n.includes("paneer")), "Must have paneer");
  assert.ok(ingNames.some((n) => n.includes("onion")), "Must have onion");
  assert.ok(ingNames.some((n) => n.includes("tomato")), "Must have tomato");
  assert.ok(ingNames.some((n) => n.includes("ghee") || n.includes("oil")), "Must have cooking fat");

  // Paneer bhurji is high protein
  assert.ok(response.draft.proteinPerServing >= 25, "Paneer bhurji should provide >= 25g protein");
  assert.ok(response.clarifyingQuestions.some((q) => q.affectedField === "oil"), "Must offer cooking fat preference");
});

// 5. Query: "Create a simple aloo paratha recipe"
runTest("NLP Query: 'Create a simple aloo paratha recipe' uses whole wheat atta and potato", () => {
  const response = heuristicRecipePlanner({
    prompt: "Create a simple aloo paratha recipe",
  });

  const ingNames = response.draft.ingredients.map((i) => i.name.toLowerCase());
  assert.ok(ingNames.some((n) => n.includes("atta") || n.includes("wheat")), "Must have atta");
  assert.ok(ingNames.some((n) => n.includes("potato") || n.includes("aloo")), "Must have potato");
  assert.ok(response.draft.instructions.length >= 4, "Must provide cooking instructions");
});

// 6. Query: "Suggest a meal using rice, dal, and vegetables"
runTest("NLP Query: 'Suggest a meal using rice, dal, and vegetables' creates complete protein bowl", () => {
  const response = heuristicRecipePlanner({
    prompt: "Suggest a meal using rice, dal, and vegetables",
  });

  const ingNames = response.draft.ingredients.map((i) => i.name.toLowerCase());
  assert.ok(ingNames.some((n) => n.includes("rice")), "Must have rice");
  assert.ok(ingNames.some((n) => n.includes("dal")), "Must have dal");
  assert.ok(ingNames.some((n) => n.includes("carrot") || n.includes("tomato")), "Must have vegetables");
  assert.ok(response.draft.totalProteinGrams >= 12, "Dal chawal must deliver balanced amino acids");
});

// 7. Query: "High-protein vegetarian breakfast"
runTest("Dietary Intelligence: 'High-protein vegetarian breakfast' respects vegetarian profile", () => {
  const response = heuristicRecipePlanner({
    prompt: "High-protein vegetarian breakfast",
    userDietaryPreference: "vegetarian",
  });

  assert.ok(response.draft.proteinPerServing >= 25, "Must deliver >= 25g protein");
  const ingNames = response.draft.ingredients.map((i) => i.name.toLowerCase());
  assert.ok(!ingNames.some((n) => n.includes("chicken") || n.includes("meat")), "No meat for vegetarian");
});

// 8. Clarifying Question Answering
runTest("Clarifying Question: answering 'Skimmed Milk (Fat Free)' updates draft to skimmed milk", () => {
  const initial = heuristicRecipePlanner({
    prompt: "Make a recipe with oats and milk",
  });

  const updated = heuristicRecipePlanner({
    prompt: "Make a recipe with oats and milk",
    answeredQuestions: {
      q_milk: "Skimmed Milk (Fat Free)",
    },
  });

  const milkIng = updated.draft.ingredients.find((i) => i.name.toLowerCase().includes("milk"));
  assert.ok(milkIng.name.includes("Skimmed"), "Milk should now be skimmed");
  assert.ok(updated.draft.totalCalories < initial.draft.totalCalories, "Skimmed milk has fewer calories");
});

// 9. Iterative Refinement: "Make it higher in protein"
runTest("Iterative Refinement: 'Make it higher in protein' adds whey protein isolate to sweet oats", () => {
  const base = heuristicRecipePlanner({
    prompt: "Oats with banana and honey",
  });
  const initialProtein = base.draft.proteinPerServing;

  const modified = applyRecipeModification(base.draft, "Make it higher in protein");
  assert.ok(modified.draft.proteinPerServing >= initialProtein + 20, "Should add at least 20g protein");
  const hasWhey = modified.draft.ingredients.some((i) => i.matchedFoodId === "food_whey_protein");
  assert.ok(hasWhey, "Whey protein isolate must be added");
});

// 10. Iterative Refinement: "Remove honey"
runTest("Iterative Refinement: 'Remove honey' removes honey and recalculates grounded calories", () => {
  const base = heuristicRecipePlanner({
    prompt: "Oats with banana and honey",
  });
  assert.ok(base.draft.ingredients.some((i) => i.name.toLowerCase().includes("honey")));

  const modified = applyRecipeModification(base.draft, "Remove honey");
  assert.ok(!modified.draft.ingredients.some((i) => i.name.toLowerCase().includes("honey")), "Honey must be removed");
  assert.strictEqual(modified.draft.totalCalories, base.draft.totalCalories - 21, "Calories must decrease by exactly 21 kcal");
});

// 11. Iterative Refinement: "Use skimmed milk"
runTest("Iterative Refinement: 'Use skimmed milk' swaps whole milk for skimmed milk", () => {
  const base = heuristicRecipePlanner({
    prompt: "Make a recipe with oats and milk",
  });

  const modified = applyRecipeModification(base.draft, "Use skimmed milk");
  const milk = modified.draft.ingredients.find((i) => i.name.toLowerCase().includes("milk"));
  assert.ok(milk.name.includes("Skimmed"), "Should be skimmed milk");
  assert.ok(modified.draft.totalFatGrams < base.draft.totalFatGrams, "Fat must be lower");
});

// 12. Iterative Refinement: "Make two servings"
runTest("Iterative Refinement: 'Make two servings' scales all quantities and updates servings count", () => {
  const base = heuristicRecipePlanner({
    prompt: "Make paneer bhurji",
  });
  assert.strictEqual(base.draft.servings, 1);
  const initialPaneerQty = base.draft.ingredients.find((i) => i.name.includes("Paneer")).quantity;

  const modified = applyRecipeModification(base.draft, "Make two servings");
  assert.strictEqual(modified.draft.servings, 2, "Servings must be 2");
  const scaledPaneerQty = modified.draft.ingredients.find((i) => i.name.includes("Paneer")).quantity;
  assert.strictEqual(scaledPaneerQty, initialPaneerQty * 2, "Paneer quantity must double");
  // Per-serving macros should remain constant!
  assert.strictEqual(modified.draft.caloriesPerServing, base.draft.caloriesPerServing);
});

// 13. Iterative Refinement: "Reduce the amount of oil"
runTest("Iterative Refinement: 'Reduce the amount of oil' cuts fat by 50%", () => {
  const base = heuristicRecipePlanner({
    prompt: "Make paneer bhurji",
  });
  const initialFatGrams = base.draft.totalFatGrams;

  const modified = applyRecipeModification(base.draft, "Reduce the amount of oil");
  assert.ok(modified.draft.totalFatGrams < initialFatGrams, "Fat must decrease");
  assert.ok(modified.draft.totalCalories < base.draft.totalCalories, "Calories must decrease");
});

// 14. Persistence & Diary Snapshot Immutability
runTest("Integration: convertDraftToRecipeDefinition and convertDraftToLoggedItem create immutable snapshots", () => {
  const base = heuristicRecipePlanner({
    prompt: "Oats with banana and honey",
  });

  const recipeDef = convertDraftToRecipeDefinition(base.draft, "user_123");
  assert.strictEqual(recipeDef.name, base.draft.recipeName);
  assert.strictEqual(recipeDef.ingredients.length, base.draft.ingredients.length);
  assert.strictEqual(recipeDef.caloriesPerServing, base.draft.caloriesPerServing);

  const loggedItem = convertDraftToLoggedItem(base.draft, "breakfast", "2026-10-15");
  assert.strictEqual(loggedItem.mealType, "breakfast");
  assert.strictEqual(loggedItem.calories, base.draft.caloriesPerServing);
  assert.strictEqual(loggedItem.proteinGrams, base.draft.proteinPerServing);
  assert.strictEqual(loggedItem.isRecipe, true);

  // Modifying the draft afterwards must not affect the loggedItem snapshot
  base.draft.caloriesPerServing = 999;
  assert.notStrictEqual(loggedItem.calories, 999, "Snapshot must be completely independent and immutable");
});

console.log(`\n=== ALL ${testsPassed} TESTS COMPLETED SUCCESSFULLY! ===\n`);
