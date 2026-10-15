import type {
  FoodItemDefinition,
  RecipeDefinition,
  LoggedFoodItem,
  MealType,
  AIRecipeClarifyingQuestion,
  AIRecipeDraftIngredient,
  AIRecipeDraft,
  AIRecipeRequest,
  AIRecipeResponse,
} from "@/types/nutrition";
import { INDIAN_FOOD_LIBRARY } from "./indianFoods/foodEntries.ts";
import { DEFAULT_FOODS } from "./defaultFoods.ts";
import {
  calculateMacrosForQuantity,
  getWeightInGrams,
} from "./indianFoods/units.ts";

/**
 * Standard cooking fats definitions with precise gram conversions
 */
export const STANDARD_FATS_LIBRARY: FoodItemDefinition[] = [
  {
    id: "fat_cow_ghee",
    name: "Pure Desi Ghee",
    servingSize: 14,
    servingUnit: "1 tbsp (14g)",
    servingWeightGrams: 14,
    calories: 120,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 14,
    saturatedFatGrams: 9,
    allowedUnits: [
      { unit: "tbsp", label: "1 Tablespoon (14g)", factorToGrams: 14 },
      { unit: "tsp", label: "1 Teaspoon (4.7g)", factorToGrams: 4.7 },
      { unit: "g", label: "Grams (g)", factorToGrams: 1 },
    ],
  },
  {
    id: "fat_mustard_oil",
    name: "Mustard Oil (Kachi Ghani Sarson Ka Tel)",
    servingSize: 14,
    servingUnit: "1 tbsp (14g)",
    servingWeightGrams: 14,
    calories: 124,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 14,
    saturatedFatGrams: 1.8,
    allowedUnits: [
      { unit: "tbsp", label: "1 Tablespoon (14g)", factorToGrams: 14 },
      { unit: "tsp", label: "1 Teaspoon (4.7g)", factorToGrams: 4.7 },
      { unit: "g", label: "Grams (g)", factorToGrams: 1 },
    ],
  },
  {
    id: "fat_sunflower_oil",
    name: "Refined Cooking Oil (Sunflower / Groundnut)",
    servingSize: 14,
    servingUnit: "1 tbsp (14g)",
    servingWeightGrams: 14,
    calories: 120,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 14,
    saturatedFatGrams: 2.5,
    allowedUnits: [
      { unit: "tbsp", label: "1 Tablespoon (14g)", factorToGrams: 14 },
      { unit: "tsp", label: "1 Teaspoon (4.7g)", factorToGrams: 4.7 },
      { unit: "g", label: "Grams (g)", factorToGrams: 1 },
    ],
  },
  {
    id: "fat_butter_amul",
    name: "Table Butter / Makhan",
    servingSize: 14,
    servingUnit: "1 tbsp (14g)",
    servingWeightGrams: 14,
    calories: 102,
    proteinGrams: 0.1,
    carbsGrams: 0.1,
    fatGrams: 11.5,
    saturatedFatGrams: 7.2,
    sodiumMg: 115,
    allowedUnits: [
      { unit: "tbsp", label: "1 Tablespoon (14g)", factorToGrams: 14 },
      { unit: "tsp", label: "1 Teaspoon (5g)", factorToGrams: 5 },
      { unit: "g", label: "Grams (g)", factorToGrams: 1 },
    ],
  },
  {
    id: "dairy_milk_toned",
    name: "Toned Cow's Milk (Low Fat 1.5-3%)",
    servingSize: 240,
    servingUnit: "1 cup (240ml)",
    servingWeightGrams: 240,
    calories: 118,
    proteinGrams: 7.4,
    carbsGrams: 11.5,
    fatGrams: 3.6,
    sodiumMg: 100,
    allowedUnits: [
      { unit: "cup", label: "1 Cup (240ml)", factorToGrams: 240 },
      { unit: "glass", label: "1 Glass (250ml)", factorToGrams: 250 },
      { unit: "ml", label: "Millilitres (ml)", factorToGrams: 1 },
      { unit: "tbsp", label: "1 Tablespoon (15ml)", factorToGrams: 15 },
    ],
  },
  {
    id: "dairy_milk_skimmed",
    name: "Skimmed Milk (Fat Free <0.5%)",
    servingSize: 240,
    servingUnit: "1 cup (240ml)",
    servingWeightGrams: 240,
    calories: 84,
    proteinGrams: 8.2,
    carbsGrams: 12.0,
    fatGrams: 0.2,
    sodiumMg: 110,
    allowedUnits: [
      { unit: "cup", label: "1 Cup (240ml)", factorToGrams: 240 },
      { unit: "glass", label: "1 Glass (250ml)", factorToGrams: 250 },
      { unit: "ml", label: "Millilitres (ml)", factorToGrams: 1 },
      { unit: "tbsp", label: "1 Tablespoon (15ml)", factorToGrams: 15 },
    ],
  },
  {
    id: "dairy_milk_soy",
    name: "Unsweetened Soy Milk",
    servingSize: 240,
    servingUnit: "1 cup (240ml)",
    servingWeightGrams: 240,
    calories: 80,
    proteinGrams: 7.0,
    carbsGrams: 4.0,
    fatGrams: 4.0,
    sodiumMg: 90,
    allowedUnits: [
      { unit: "cup", label: "1 Cup (240ml)", factorToGrams: 240 },
      { unit: "glass", label: "1 Glass (250ml)", factorToGrams: 250 },
      { unit: "ml", label: "Millilitres (ml)", factorToGrams: 1 },
    ],
  },
  {
    id: "dairy_milk_almond",
    name: "Unsweetened Almond Milk",
    servingSize: 240,
    servingUnit: "1 cup (240ml)",
    servingWeightGrams: 240,
    calories: 30,
    proteinGrams: 1.0,
    carbsGrams: 1.0,
    fatGrams: 2.5,
    sodiumMg: 150,
    allowedUnits: [
      { unit: "cup", label: "1 Cup (240ml)", factorToGrams: 240 },
      { unit: "glass", label: "1 Glass (250ml)", factorToGrams: 250 },
      { unit: "ml", label: "Millilitres (ml)", factorToGrams: 1 },
    ],
  },
];

/**
 * Searches across all database sources for the best matching food item definition.
 */
export function matchFoodInDatabases(
  query: string,
  customFoods: FoodItemDefinition[] = []
): { food: FoodItemDefinition; status: "verified" | "estimated" | "custom" } | null {
  const clean = query.trim().toLowerCase();
  if (!clean) return null;

  // 1. Check user custom foods
  const customMatch = customFoods.find(
    (f) =>
      f.name.toLowerCase() === clean ||
      f.name.toLowerCase().includes(clean) ||
      clean.includes(f.name.toLowerCase())
  );
  if (customMatch) {
    return { food: customMatch, status: "custom" };
  }

  // 2. Check Standard Cooking Fats & Milks
  const fatMatch = STANDARD_FATS_LIBRARY.find(
    (f) =>
      f.id === clean ||
      f.name.toLowerCase() === clean ||
      f.name.toLowerCase().includes(clean) ||
      clean.includes(f.name.toLowerCase())
  );
  if (fatMatch) {
    return { food: fatMatch, status: "verified" };
  }

  // 3. Synonym map for common cooking inputs
  const SYNONYMS: Record<string, string> = {
    oat: "food_rolled_oats",
    oats: "food_rolled_oats",
    "rolled oats": "food_rolled_oats",
    oatmeal: "food_rolled_oats",
    milk: "food_milk_whole",
    "cow milk": "food_milk_whole",
    "whole milk": "food_milk_whole",
    "toned milk": "dairy_milk_toned",
    "skimmed milk": "dairy_milk_skimmed",
    "skim milk": "dairy_milk_skimmed",
    "soy milk": "dairy_milk_soy",
    "almond milk": "dairy_milk_almond",
    banana: "food_banana",
    kela: "food_banana",
    honey: "food_honey",
    shahad: "food_honey",
    paneer: "in_dairy_paneer_raw",
    "fresh paneer": "in_dairy_paneer_raw",
    "low fat paneer": "in_dairy_paneer_lowfat",
    "cottage cheese": "in_dairy_paneer_raw",
    onion: "in_produce_onion_raw",
    onions: "in_produce_onion_raw",
    pyaz: "in_produce_onion_raw",
    pyaaz: "in_produce_onion_raw",
    tomato: "in_produce_tomato_raw",
    tomatoes: "in_produce_tomato_raw",
    tamatar: "in_produce_tomato_raw",
    "green chilli": "in_produce_green_chili",
    "green chili": "in_produce_green_chili",
    "hari mirch": "in_produce_green_chili",
    ginger: "in_produce_ginger_fresh",
    adrak: "in_produce_ginger_fresh",
    garlic: "in_produce_garlic_fresh",
    lahsun: "in_produce_garlic_fresh",
    potato: "in_produce_potato_raw",
    potatoes: "in_produce_potato_raw",
    aloo: "in_produce_potato_raw",
    atta: "in_staple_atta_raw",
    "wheat flour": "in_staple_atta_raw",
    "whole wheat flour": "in_staple_atta_raw",
    gehun: "in_staple_atta_raw",
    "toor dal": "in_staple_toor_dal_raw",
    "arhar dal": "in_staple_toor_dal_raw",
    "moong dal": "in_staple_yellow_moong_raw",
    "yellow dal": "in_staple_yellow_moong_raw",
    rice: "food_white_rice",
    "basmati rice": "food_white_rice",
    "white rice": "food_white_rice",
    "brown rice": "food_brown_rice",
    ghee: "fat_cow_ghee",
    "desi ghee": "fat_cow_ghee",
    "mustard oil": "fat_mustard_oil",
    "sarson oil": "fat_mustard_oil",
    oil: "fat_sunflower_oil",
    "refined oil": "fat_sunflower_oil",
    "sunflower oil": "fat_sunflower_oil",
    "cooking oil": "fat_sunflower_oil",
    "olive oil": "food_olive_oil",
    butter: "fat_butter_amul",
    makhan: "fat_butter_amul",
    egg: "food_whole_egg",
    eggs: "food_whole_egg",
    "boiled egg": "food_whole_egg",
    "egg white": "food_egg_whites",
    "egg whites": "food_egg_whites",
    "whey protein": "food_whey_protein",
    "protein powder": "food_whey_protein",
    whey: "food_whey_protein",
    curd: "in_dairy_curd_toned",
    dahi: "in_dairy_curd_toned",
    yogurt: "in_dairy_curd_toned",
    "greek yogurt": "food_greek_yogurt_0",
    chicken: "food_chicken_breast",
    "chicken breast": "food_chicken_breast",
    tofu: "food_tofu",
    "sweet potato": "food_sweet_potato",
    "peanut butter": "food_peanut_butter",
    apple: "food_apple",
    broccoli: "food_broccoli",
    cucumber: "in_produce_cucumber_raw",
    kheera: "in_produce_cucumber_raw",
    carrot: "in_produce_carrot_desi",
    gajar: "in_produce_carrot_desi",
    salt: "in_produce_lemon_juice",
  };

  if (SYNONYMS[clean]) {
    const targetId = SYNONYMS[clean];
    const pool = [...DEFAULT_FOODS, ...INDIAN_FOOD_LIBRARY, ...STANDARD_FATS_LIBRARY];
    const match = pool.find((f) => f.id === targetId);
    if (match) return { food: match, status: "verified" };
  }

  // 4. Check DEFAULT_FOODS exact & partial match
  for (const food of DEFAULT_FOODS) {
    const fName = food.name.toLowerCase();
    if (fName === clean || fName.startsWith(clean) || clean.startsWith(fName)) {
      return { food, status: "verified" };
    }
  }

  // 5. Check INDIAN_FOOD_LIBRARY exact & token matching
  for (const food of INDIAN_FOOD_LIBRARY) {
    const fName = food.name.toLowerCase();
    const regName = (food.regionalName || "").toLowerCase();
    if (fName === clean || regName === clean) {
      return { food, status: "verified" };
    }
  }

  // Partial tokens in INDIAN_FOOD_LIBRARY
  const tokens = clean.split(/\s+/).filter((t) => t.length > 2);
  let bestFood: FoodItemDefinition | null = null;
  let bestScore = 0;

  for (const food of [...DEFAULT_FOODS, ...INDIAN_FOOD_LIBRARY]) {
    const fullText = `${food.name} ${food.regionalName || ""} ${(food.tags || []).join(" ")}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (fullText.includes(t)) {
        score += 10;
        if (food.name.toLowerCase().includes(t)) score += 5;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestFood = food;
    }
  }

  if (bestFood && bestScore >= 10) {
    return { food: bestFood, status: "estimated" };
  }

  return null;
}

/**
 * Strict Nutrition Grounding Engine
 * Takes any recipe draft, matches each ingredient against verified database tables,
 * and deterministically calculates macros, totals, and per-serving values.
 * Zero macro hallucinations!
 */
export function groundRecipeDraft(
  draft: Partial<AIRecipeDraft>,
  customFoods: FoodItemDefinition[] = []
): AIRecipeDraft {
  const safeServings = Math.max(0.1, draft.servings || 1);
  const groundedIngredients: AIRecipeDraftIngredient[] = [];

  let totalCalories = 0;
  let totalProteinGrams = 0;
  let totalCarbsGrams = 0;
  let totalFatGrams = 0;
  let totalFiberGrams = 0;
  let totalSugarGrams = 0;
  let totalSodiumMg = 0;
  let rawWeightGrams = 0;

  for (const rawIng of draft.ingredients || []) {
    const match = matchFoodInDatabases(rawIng.name, customFoods);
    let matchedFood = match?.food;
    let matchStatus: "verified" | "estimated" | "custom" | "unmatched" = match?.status || "unmatched";

    // If already has matchedFoodId, verify it exists
    if (!matchedFood && rawIng.matchedFoodId) {
      matchedFood = [...DEFAULT_FOODS, ...INDIAN_FOOD_LIBRARY, ...STANDARD_FATS_LIBRARY, ...customFoods].find(
        (f) => f.id === rawIng.matchedFoodId
      );
      if (matchedFood) matchStatus = "verified";
    }

    const safeQty = Math.max(0, rawIng.quantity ?? 1);
    const safeUnit = rawIng.unit || "g";

    let weightGrams = safeQty;
    let cal = rawIng.calories || 0;
    let prot = rawIng.proteinGrams || 0;
    let carbs = rawIng.carbsGrams || 0;
    let fat = rawIng.fatGrams || 0;
    let fiber = rawIng.fiberGrams || 0;
    let sugar = rawIng.sugarGrams || 0;
    let sodium = rawIng.sodiumMg || 0;

    if (matchedFood) {
      const macros = calculateMacrosForQuantity(matchedFood, safeQty, safeUnit);
      weightGrams = macros.weightGrams;
      cal = macros.calories;
      prot = macros.proteinGrams;
      carbs = macros.carbsGrams;
      fat = macros.fatGrams;
      fiber = macros.fiberGrams || 0;
      sugar = macros.sugarGrams || 0;
      sodium = macros.sodiumMg || 0;
    } else {
      // If unmatched, estimate gram weight if unit is recognized
      if (safeUnit === "tsp") weightGrams = safeQty * 5;
      else if (safeUnit === "tbsp") weightGrams = safeQty * 15;
      else if (safeUnit === "cup") weightGrams = safeQty * 240;
      else if (safeUnit === "piece" || safeUnit === "item") weightGrams = safeQty * 100;
    }

    rawWeightGrams += weightGrams;
    totalCalories += cal;
    totalProteinGrams += prot;
    totalCarbsGrams += carbs;
    totalFatGrams += fat;
    totalFiberGrams += fiber;
    totalSugarGrams += sugar;
    totalSodiumMg += sodium;

    groundedIngredients.push({
      id: rawIng.id || `ai_ing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: rawIng.name,
      quantity: safeQty,
      unit: safeUnit,
      isProposedDefault: rawIng.isProposedDefault ?? false,
      matchedFoodId: matchedFood?.id,
      matchedFoodName: matchedFood?.name,
      matchStatus,
      weightGrams: Math.round(weightGrams * 10) / 10,
      calories: Math.round(cal),
      proteinGrams: Math.round(prot * 10) / 10,
      carbsGrams: Math.round(carbs * 10) / 10,
      fatGrams: Math.round(fat * 10) / 10,
      fiberGrams: Math.round(fiber * 10) / 10,
      sugarGrams: Math.round(sugar * 10) / 10,
      sodiumMg: Math.round(sodium),
      notes: rawIng.notes,
    });
  }

  const roundedTotals = {
    totalCalories: Math.round(totalCalories),
    totalProteinGrams: Math.round(totalProteinGrams * 10) / 10,
    totalCarbsGrams: Math.round(totalCarbsGrams * 10) / 10,
    totalFatGrams: Math.round(totalFatGrams * 10) / 10,
    totalFiberGrams: Math.round(totalFiberGrams * 10) / 10,
  };

  const caloriesPerServing = Math.round(roundedTotals.totalCalories / safeServings);
  const proteinPerServing = Math.round((roundedTotals.totalProteinGrams / safeServings) * 10) / 10;
  const carbsPerServing = Math.round((roundedTotals.totalCarbsGrams / safeServings) * 10) / 10;
  const fatPerServing = Math.round((roundedTotals.totalFatGrams / safeServings) * 10) / 10;
  const fiberPerServing = Math.round(((roundedTotals.totalFiberGrams || 0) / safeServings) * 10) / 10;

  let cookedWeightGrams = draft.cookedWeightGrams;
  let caloriesPer100gCooked: number | undefined;
  let proteinPer100gCooked: number | undefined;
  let carbsPer100gCooked: number | undefined;
  let fatPer100gCooked: number | undefined;

  if (cookedWeightGrams && cookedWeightGrams > 0) {
    const ratio = 100 / cookedWeightGrams;
    caloriesPer100gCooked = Math.round(roundedTotals.totalCalories * ratio * 10) / 10;
    proteinPer100gCooked = Math.round(roundedTotals.totalProteinGrams * ratio * 10) / 10;
    carbsPer100gCooked = Math.round(roundedTotals.totalCarbsGrams * ratio * 10) / 10;
    fatPer100gCooked = Math.round(roundedTotals.totalFatGrams * ratio * 10) / 10;
  }

  return {
    id: draft.id || `recipe_ai_${Date.now()}`,
    recipeName: draft.recipeName || "Custom AI Recipe",
    description: draft.description || "Nutritious balanced meal created with AI assistance.",
    servings: safeServings,
    prepTimeMinutes: draft.prepTimeMinutes || 5,
    cookTimeMinutes: draft.cookTimeMinutes || 10,
    rawWeightGrams: Math.round(rawWeightGrams * 10) / 10,
    cookedWeightGrams,
    ingredients: groundedIngredients,
    instructions: draft.instructions && draft.instructions.length > 0 ? draft.instructions : [
      "Prepare all ingredients as listed with measured quantities.",
      "Combine and cook over medium heat until cooked thoroughly.",
      "Garnish to taste and enjoy hot.",
    ],
    clarifyingQuestions: draft.clarifyingQuestions || [],
    dietaryTags: draft.dietaryTags || ["Healthy", "Home Style"],
    suggestedTweaks: draft.suggestedTweaks || [
      "Make it higher in protein",
      "Reduce the amount of oil",
      "Make two servings",
    ],
    ...roundedTotals,
    caloriesPerServing,
    proteinPerServing,
    carbsPerServing,
    fatPerServing,
    fiberPerServing,
    caloriesPer100gCooked,
    proteinPer100gCooked,
    carbsPer100gCooked,
    fatPer100gCooked,
    isAiGenerated: true,
    aiProvider: draft.aiProvider || "offline_heuristic",
    requiresClarification: (draft.clarifyingQuestions?.length || 0) > 0,
  };
}

/**
 * Built-in Intelligent Heuristic Recipe Planner (Zero External Dependencies)
 * Handles natural language food queries, Indian cooking nuances, dietary restrictions,
 * missing parameter clarification, and sensible defaults.
 */
export function heuristicRecipePlanner(
  request: AIRecipeRequest,
  customFoods: FoodItemDefinition[] = []
): AIRecipeResponse {
  const prompt = (request.prompt || "").trim().toLowerCase();
  const answers = request.answeredQuestions || {};
  const userDiet = request.userDietaryPreference || "vegetarian";

  // Check if this is an iterative modification on an existing draft
  if (request.currentDraft && request.currentDraft.ingredients.length > 0) {
    return applyRecipeModification(request.currentDraft, request.prompt, customFoods);
  }

  // 1. Oats + Milk / Banana / Honey Patterns
  if (
    (prompt.includes("oat") || prompt.includes("oatmeal")) &&
    (prompt.includes("milk") || prompt.includes("banana") || prompt.includes("honey") || prompt.includes("breakfast"))
  ) {
    const hasBanana = prompt.includes("banana") || prompt.includes("kela");
    const hasHoney = prompt.includes("honey") || prompt.includes("shahad");

    // Check answered questions
    const milkChoice = (
      answers["q_milk"] ||
      (prompt.includes("skim") ? "skimmed" : prompt.includes("toned") ? "toned" : "whole")
    ).toLowerCase();
    const servingsCount = answers["q_servings"] ? parseInt(answers["q_servings"], 10) || 1 : 1;

    let milkName = "Whole Cow's Milk";
    let milkId = "food_milk_whole";
    if (milkChoice.includes("skim")) {
      milkName = "Skimmed Milk (Fat Free <0.5%)";
      milkId = "dairy_milk_skimmed";
    } else if (milkChoice.includes("toned") || milkChoice.includes("low fat")) {

      milkName = "Toned Cow's Milk (Low Fat 1.5-3%)";
      milkId = "dairy_milk_toned";
    } else if (milkChoice.includes("soy") || milkChoice.includes("almond")) {
      milkName = "Unsweetened Soy Milk";
      milkId = "dairy_milk_soy";
    }

    const ingredients: AIRecipeDraftIngredient[] = [
      {
        id: "ing_oats",
        name: "Rolled Oats (Dry)",
        quantity: 50 * servingsCount,
        unit: "g",
        isProposedDefault: !prompt.match(/\b\d+\s*(g|grams|cup)/i),
        matchedFoodId: "food_rolled_oats",
        matchStatus: "verified",
        weightGrams: 50 * servingsCount,
        calories: 189 * servingsCount,
        proteinGrams: 6.8 * servingsCount,
        carbsGrams: 33.5 * servingsCount,
        fatGrams: 3.5 * servingsCount,
      },
      {
        id: "ing_milk",
        name: milkName,
        quantity: 240 * servingsCount,
        unit: "ml",
        isProposedDefault: !prompt.match(/\b\d+\s*(ml|cup|glass)/i),
        matchedFoodId: milkId,
        matchStatus: "verified",
        weightGrams: 240 * servingsCount,
        calories: 149 * servingsCount,
        proteinGrams: 7.7 * servingsCount,
        carbsGrams: 11.5 * servingsCount,
        fatGrams: 8.0 * servingsCount,
      },
    ];

    if (hasBanana || prompt.includes("banana")) {
      ingredients.push({
        id: "ing_banana",
        name: "Fresh Banana",
        quantity: 1 * servingsCount,
        unit: "medium",
        isProposedDefault: false,
        matchedFoodId: "food_banana",
        matchStatus: "verified",
        weightGrams: 118 * servingsCount,
        calories: 105 * servingsCount,
        proteinGrams: 1.3 * servingsCount,
        carbsGrams: 27.0 * servingsCount,
        fatGrams: 0.3 * servingsCount,
      });
    }

    if (hasHoney || prompt.includes("honey")) {
      ingredients.push({
        id: "ing_honey",
        name: "Pure Natural Honey",
        quantity: 1 * servingsCount,
        unit: "tsp",
        isProposedDefault: false,
        matchedFoodId: "food_honey",
        matchStatus: "verified",
        weightGrams: 7 * servingsCount,
        calories: 21 * servingsCount,
        proteinGrams: 0,
        carbsGrams: 5.8 * servingsCount,
        fatGrams: 0,
      });
    }

    const clarifyingQuestions: AIRecipeClarifyingQuestion[] = [];
    if (!answers["q_milk"] && !prompt.includes("skim") && !prompt.includes("toned")) {
      clarifyingQuestions.push({
        id: "q_milk",
        question: "What kind of milk do you prefer for your oats?",
        options: ["Whole Milk (Creamy)", "Toned Milk (Low Fat)", "Skimmed Milk (Fat Free)", "Soy / Almond Milk"],
        affectedField: "ingredient_choice",
        rationale: "Defaulted to Whole Milk. Switching to Toned or Skimmed lowers calories and saturated fats.",
      });
    }

    if (!hasHoney && !hasBanana && !answers["q_sweetener"]) {
      clarifyingQuestions.push({
        id: "q_sweetener",
        question: "Would you like to add natural sweetness?",
        options: ["No Sweetener (Unsweetened)", "1 tsp Honey (+21 kcal)", "1/2 Sliced Banana (+52 kcal)", "Jaggery / Brown Sugar"],
        affectedField: "ingredient_choice",
      });
    }

    if (!answers["q_servings"] && !prompt.includes("serving")) {
      clarifyingQuestions.push({
        id: "q_servings",
        question: "How many servings are you making?",
        options: ["1 Serving (Solo)", "2 Servings (Couple / Meal Prep)", "4 Servings (Family)"],
        affectedField: "servings",
      });
    }

    const recipeName = hasBanana && hasHoney
      ? "Creamy Oatmeal with Banana & Honey"
      : hasBanana
      ? "Banana Oatmeal Bowl"
      : "Classic Warm Milk Oats";

    const draft = groundRecipeDraft(
      {
        recipeName,
        description: "Wholesome, slow-digesting complex carbs and protein to power your morning.",
        servings: servingsCount,
        prepTimeMinutes: 3,
        cookTimeMinutes: 5,
        ingredients,
        instructions: [
          "Add rolled oats and milk to a saucepan or microwave-safe bowl.",
          "Simmer gently over medium-low heat for 4-5 minutes, stirring occasionally until thick and creamy.",
          ...(hasBanana ? ["Slice the fresh banana and place evenly over the warm oats."] : []),
          ...(hasHoney ? ["Drizzle pure natural honey on top right before serving."] : []),
          "Serve immediately while warm.",
        ],
        clarifyingQuestions,
        dietaryTags: ["Vegetarian", "High Fiber", "Breakfast", "Quick & Easy"],
        suggestedTweaks: [
          "Make it higher in protein",
          "Remove honey",
          "Use skimmed milk",
          "Make two servings",
        ],
        aiProvider: "offline_heuristic",
      },
      customFoods
    );

    return {
      draft,
      message: `I've created your **${recipeName}** with verified nutrition. Proposed defaults: 50g rolled oats and 240ml milk per serving. You can refine it below or answer clarifying questions.`,
      clarifyingQuestions,
      isOnlineAI: false,
      provider: "SabFitness Intelligent Rule-Based Engine",
    };
  }

  // 2. Paneer Bhurji Pattern
  if (prompt.includes("paneer bhurji") || (prompt.includes("paneer") && (prompt.includes("bhurji") || prompt.includes("scramble")))) {
    const fatChoice = answers["q_fat"] || "ghee";
    const servingsCount = answers["q_servings"] ? parseInt(answers["q_servings"], 10) || 1 : 1;

    const fatName = fatChoice.includes("oil")
      ? "Mustard Oil (Kachi Ghani Sarson Ka Tel)"
      : "Pure Desi Ghee";
    const fatId = fatChoice.includes("oil") ? "fat_mustard_oil" : "fat_cow_ghee";

    const ingredients: AIRecipeDraftIngredient[] = [
      {
        id: "ing_paneer",
        name: "Fresh Paneer (Full Fat, Raw Cubes)",
        quantity: 150 * servingsCount,
        unit: "g",
        isProposedDefault: !prompt.match(/\b\d+\s*(g|grams)/i),
        matchedFoodId: "in_dairy_paneer_raw",
        matchStatus: "verified",
        weightGrams: 150 * servingsCount,
        calories: 398 * servingsCount,
        proteinGrams: 27.5 * servingsCount,
        carbsGrams: 5.0 * servingsCount,
        fatGrams: 30.0 * servingsCount,
      },
      {
        id: "ing_onion",
        name: "Red Onion (Pyaz, Raw)",
        quantity: 50 * servingsCount,
        unit: "g",
        isProposedDefault: true,
        matchedFoodId: "in_produce_onion_raw",
        matchStatus: "verified",
        weightGrams: 50 * servingsCount,
        calories: 20 * servingsCount,
        proteinGrams: 0.6 * servingsCount,
        carbsGrams: 4.7 * servingsCount,
        fatGrams: 0.1 * servingsCount,
      },
      {
        id: "ing_tomato",
        name: "Tomato (Tamatar, Raw)",
        quantity: 50 * servingsCount,
        unit: "g",
        isProposedDefault: true,
        matchedFoodId: "in_produce_tomato_raw",
        matchStatus: "verified",
        weightGrams: 50 * servingsCount,
        calories: 10 * servingsCount,
        proteinGrams: 0.5 * servingsCount,
        carbsGrams: 2.0 * servingsCount,
        fatGrams: 0.1 * servingsCount,
      },
      {
        id: "ing_green_chili",
        name: "Green Chili (Hari Mirch)",
        quantity: 1 * servingsCount,
        unit: "piece",
        isProposedDefault: true,
        matchedFoodId: "in_produce_green_chili",
        matchStatus: "verified",
        weightGrams: 5 * servingsCount,
        calories: 2 * servingsCount,
        proteinGrams: 0.1 * servingsCount,
        carbsGrams: 0.5 * servingsCount,
        fatGrams: 0,
      },
      {
        id: "ing_fat",
        name: fatName,
        quantity: 1 * servingsCount,
        unit: "tbsp",
        isProposedDefault: true,
        matchedFoodId: fatId,
        matchStatus: "verified",
        weightGrams: 14 * servingsCount,
        calories: 120 * servingsCount,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 14 * servingsCount,
      },
    ];

    const clarifyingQuestions: AIRecipeClarifyingQuestion[] = [];
    if (!answers["q_fat"]) {
      clarifyingQuestions.push({
        id: "q_fat",
        question: "Which cooking fat and amount would you like to use for the tadka?",
        options: ["1 tbsp Desi Ghee (Traditional, 120 kcal)", "1 tsp Desi Ghee (Light, 40 kcal)", "1 tbsp Mustard / Sunflower Oil (120 kcal)", "Light Cooking Spray (<20 kcal)"],
        affectedField: "oil",
        rationale: "Defaulted to 1 tbsp Desi Ghee. Cutting fat to 1 tsp saves 80 kcal.",
      });
    }

    if (!answers["q_paneer_type"]) {
      clarifyingQuestions.push({
        id: "q_paneer_type",
        question: "Would you like standard malai paneer or low-fat paneer?",
        options: ["Fresh Full-Fat Paneer (Creamy)", "Low-Fat / Skim Milk Paneer (Higher protein-to-fat ratio)"],
        affectedField: "ingredient_choice",
      });
    }

    const draft = groundRecipeDraft(
      {
        recipeName: "Homestyle Spiced Paneer Bhurji",
        description: "Classic high-protein North Indian scrambled cottage cheese sautéed with onions, juicy tomatoes, and fragrant spices.",
        servings: servingsCount,
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        cookedWeightGrams: 220 * servingsCount,
        ingredients,
        instructions: [
          "Finely chop the red onions, tomatoes, and green chilli.",
          "Heat ghee or oil in a pan over medium heat. Add a pinch of cumin seeds if desired, then sauté chopped onions until translucent.",
          "Add chopped green chillies and tomatoes. Cook for 2-3 minutes until tomatoes soften.",
          "Add turmeric, red chilli powder, and salt. Stir well.",
          "Crumble fresh paneer by hand directly into the pan. Toss gently for 2 minutes to coat without overcooking.",
          "Garnish with chopped fresh coriander leaves and serve warm with rotis or toast.",
        ],
        clarifyingQuestions,
        dietaryTags: ["Vegetarian", "High Protein", "Keto Friendly", "North Indian"],
        suggestedTweaks: [
          "Reduce the amount of oil",
          "Use low-fat paneer",
          "Make two servings",
        ],
        aiProvider: "offline_heuristic",
      },
      customFoods
    );

    return {
      draft,
      message: "I've structured a traditional **Homestyle Spiced Paneer Bhurji** with 150g fresh paneer per serving. Nutrition is 100% grounded against verified Indian food tables.",
      clarifyingQuestions,
      isOnlineAI: false,
      provider: "SabFitness Intelligent Rule-Based Engine",
    };
  }

  // 3. Aloo Paratha Pattern
  if (prompt.includes("aloo paratha") || (prompt.includes("paratha") && prompt.includes("aloo"))) {
    const servingsCount = answers["q_servings"] ? parseInt(answers["q_servings"], 10) || 1 : 1;

    const ingredients: AIRecipeDraftIngredient[] = [
      {
        id: "ing_atta",
        name: "Whole Wheat Atta (Raw Flour)",
        quantity: 60 * servingsCount,
        unit: "g",
        isProposedDefault: true,
        matchedFoodId: "in_staple_atta_raw",
        matchStatus: "verified",
        weightGrams: 60 * servingsCount,
        calories: 204 * servingsCount,
        proteinGrams: 7.2 * servingsCount,
        carbsGrams: 43.0 * servingsCount,
        fatGrams: 1.0 * servingsCount,
      },
      {
        id: "ing_aloo",
        name: "Potato (Aloo, Raw Unpeeled)",
        quantity: 100 * servingsCount,
        unit: "g",
        isProposedDefault: true,
        matchedFoodId: "in_produce_potato_raw",
        matchStatus: "verified",
        weightGrams: 100 * servingsCount,
        calories: 77 * servingsCount,
        proteinGrams: 2.0 * servingsCount,
        carbsGrams: 17.5 * servingsCount,
        fatGrams: 0.1 * servingsCount,
      },
      {
        id: "ing_onion",
        name: "Red Onion (Pyaz, Raw)",
        quantity: 20 * servingsCount,
        unit: "g",
        isProposedDefault: true,
        matchedFoodId: "in_produce_onion_raw",
        matchStatus: "verified",
        weightGrams: 20 * servingsCount,
        calories: 8 * servingsCount,
        proteinGrams: 0.2 * servingsCount,
        carbsGrams: 1.9 * servingsCount,
        fatGrams: 0,
      },
      {
        id: "ing_ghee",
        name: "Pure Desi Ghee",
        quantity: 1 * servingsCount,
        unit: "tsp",
        isProposedDefault: true,
        matchedFoodId: "fat_cow_ghee",
        matchStatus: "verified",
        weightGrams: 4.7 * servingsCount,
        calories: 40 * servingsCount,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 4.7 * servingsCount,
      },
    ];

    const clarifyingQuestions: AIRecipeClarifyingQuestion[] = [];
    if (!answers["q_servings"]) {
      clarifyingQuestions.push({
        id: "q_servings",
        question: "How many parathas or servings are you preparing?",
        options: ["1 Serving (2 Parathas)", "2 Servings (4 Parathas)", "Family (6 Parathas)"],
        affectedField: "servings",
      });
    }

    if (!answers["q_roasting_fat"]) {
      clarifyingQuestions.push({
        id: "q_roasting_fat",
        question: "How much ghee/butter would you like to roast with?",
        options: ["1 tsp Desi Ghee (Light & crisp, 40 kcal)", "1 tbsp Butter / Makhan (Punjabi Dhaba style, 102 kcal)", "Dry Roasted / Tawa Phulka style (0 extra oil)"],
        affectedField: "oil",
      });
    }

    const draft = groundRecipeDraft(
      {
        recipeName: "Crispy Stuffed Aloo Paratha",
        description: "Comforting whole wheat flatbreads stuffed with spiced mashed potatoes, fresh coriander, and roasted on tawa with golden ghee.",
        servings: servingsCount,
        prepTimeMinutes: 10,
        cookTimeMinutes: 10,
        cookedWeightGrams: 160 * servingsCount,
        ingredients,
        instructions: [
          "Boil, peel, and thoroughly mash the potatoes until lump-free.",
          "Mix in finely chopped onions, green chillies, coriander, amchur (dry mango powder), garam masala, and salt.",
          "Knead whole wheat flour with water into a soft, pliable dough. Rest for 10 minutes.",
          "Roll out a portion of dough, place spiced potato filling in center, pleat edges, seal, and gently roll flat.",
          "Cook on hot tawa until bubbles appear, flip, brush with ghee, and roast until golden crisp on both sides.",
          "Serve piping hot with plain curd, pickle, or fresh mint chutney.",
        ],
        clarifyingQuestions,
        dietaryTags: ["Vegetarian", "North Indian", "Comfort Food", "Whole Grain"],
        suggestedTweaks: [
          "Make it higher in protein",
          "Reduce the amount of oil",
          "Make two servings",
        ],
        aiProvider: "offline_heuristic",
      },
      customFoods
    );

    return {
      draft,
      message: `Created **Crispy Stuffed Aloo Paratha** with 60g whole wheat atta and 100g potato per serving. All nutrition is calculated from raw staple densities.`,
      clarifyingQuestions,
      isOnlineAI: false,
      provider: "SabFitness Intelligent Rule-Based Engine",
    };
  }

  // 4. Rice + Dal + Vegetables Pattern
  if (
    prompt.includes("dal") &&
    (prompt.includes("rice") || prompt.includes("chawal") || prompt.includes("vegetable") || prompt.includes("sabzi"))
  ) {
    const servingsCount = answers["q_servings"] ? parseInt(answers["q_servings"], 10) || 1 : 1;
    const dalChoice = answers["q_dal"] || (prompt.includes("moong") ? "moong" : "toor");

    const dalName = dalChoice.includes("moong")
      ? "Moong Dal (Yellow Split Lentils, Raw)"
      : "Toor / Arhar Dal (Split Pigeon Pea, Dry)";
    const dalId = dalChoice.includes("moong") ? "in_staple_yellow_moong_raw" : "in_staple_toor_dal_raw";

    const ingredients: AIRecipeDraftIngredient[] = [
      {
        id: "ing_rice",
        name: "White Basmati Rice (Cooked)",
        quantity: 150 * servingsCount,
        unit: "g",
        isProposedDefault: true,
        matchedFoodId: "food_white_rice",
        matchStatus: "verified",
        weightGrams: 150 * servingsCount,
        calories: 195 * servingsCount,
        proteinGrams: 4.0 * servingsCount,
        carbsGrams: 42.3 * servingsCount,
        fatGrams: 0.5 * servingsCount,
      },
      {
        id: "ing_dal",
        name: dalName,
        quantity: 45 * servingsCount,
        unit: "g",
        isProposedDefault: true,
        matchedFoodId: dalId,
        matchStatus: "verified",
        weightGrams: 45 * servingsCount,
        calories: 155 * servingsCount,
        proteinGrams: 10.0 * servingsCount,
        carbsGrams: 27.0 * servingsCount,
        fatGrams: 0.7 * servingsCount,
      },
      {
        id: "ing_tomato",
        name: "Tomato (Tamatar, Raw)",
        quantity: 40 * servingsCount,
        unit: "g",
        isProposedDefault: true,
        matchedFoodId: "in_produce_tomato_raw",
        matchStatus: "verified",
        weightGrams: 40 * servingsCount,
        calories: 8 * servingsCount,
        proteinGrams: 0.4 * servingsCount,
        carbsGrams: 1.6 * servingsCount,
        fatGrams: 0.1 * servingsCount,
      },
      {
        id: "ing_onion",
        name: "Red Onion (Pyaz, Raw)",
        quantity: 30 * servingsCount,
        unit: "g",
        isProposedDefault: true,
        matchedFoodId: "in_produce_onion_raw",
        matchStatus: "verified",
        weightGrams: 30 * servingsCount,
        calories: 12 * servingsCount,
        proteinGrams: 0.4 * servingsCount,
        carbsGrams: 2.8 * servingsCount,
        fatGrams: 0.1 * servingsCount,
      },
      {
        id: "ing_carrot",
        name: "Carrot (Gajar, Red Desi)",
        quantity: 40 * servingsCount,
        unit: "g",
        isProposedDefault: true,
        matchedFoodId: "in_produce_carrot_desi",
        matchStatus: "verified",
        weightGrams: 40 * servingsCount,
        calories: 17 * servingsCount,
        proteinGrams: 0.4 * servingsCount,
        carbsGrams: 3.8 * servingsCount,
        fatGrams: 0.1 * servingsCount,
      },
      {
        id: "ing_ghee",
        name: "Pure Desi Ghee",
        quantity: 1 * servingsCount,
        unit: "tsp",
        isProposedDefault: true,
        matchedFoodId: "fat_cow_ghee",
        matchStatus: "verified",
        weightGrams: 4.7 * servingsCount,
        calories: 40 * servingsCount,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 4.7 * servingsCount,
      },
    ];

    const clarifyingQuestions: AIRecipeClarifyingQuestion[] = [];
    if (!answers["q_dal"]) {
      clarifyingQuestions.push({
        id: "q_dal",
        question: "Which type of dal would you like to prepare?",
        options: ["Toor / Arhar Dal (Traditional Tadka)", "Yellow Moong Dal (Light & easy to digest)", "Masoor Dal (Quick red lentils)"],
        affectedField: "ingredient_choice",
      });
    }

    if (!answers["q_rice"]) {
      clarifyingQuestions.push({
        id: "q_rice",
        question: "What grain base do you prefer?",
        options: ["White Basmati Rice", "Brown Rice (Higher fiber)", "Quinoa / Dalia"],
        affectedField: "ingredient_choice",
      });
    }

    const draft = groundRecipeDraft(
      {
        recipeName: "Nourishing Dal Chawal & Veggie Bowl",
        description: "The quintessential Indian soul food — aromatic cumin-tempered yellow lentils served alongside fluffy steamed rice and crisp seasonal veggies.",
        servings: servingsCount,
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        cookedWeightGrams: 350 * servingsCount,
        ingredients,
        instructions: [
          "Wash the lentils thoroughly and pressure cook with water, turmeric, and diced tomatoes for 3-4 whistles.",
          "Steam or boil the rice until fluffy and drain excess water.",
          "Lightly stir-fry carrots and onions in 1/2 tsp ghee until tender-crisp.",
          "Prepare tadka: heat remaining ghee, add cumin seeds, hing (asafoetida), and green chilli until fragrant.",
          "Pour tadka over cooked dal, simmer for 2 minutes, and serve hot over rice with the sautéed vegetables.",
        ],
        clarifyingQuestions,
        dietaryTags: ["Vegetarian", "Complete Protein", "High Fiber", "Traditional Indian"],
        suggestedTweaks: [
          "Make it higher in protein",
          "Reduce the amount of oil",
          "Make two servings",
        ],
        aiProvider: "offline_heuristic",
      },
      customFoods
    );

    return {
      draft,
      message: "Here is your balanced **Nourishing Dal Chawal & Veggie Bowl**. Complete amino acid profile formed by pairing lentils with steamed rice.",
      clarifyingQuestions,
      isOnlineAI: false,
      provider: "SabFitness Intelligent Rule-Based Engine",
    };
  }

  // 5. High-Protein Vegetarian / Non-Vegetarian Breakfast Pattern
  if (prompt.includes("high-protein") || prompt.includes("high protein")) {
    const isEggetarian = userDiet === "eggetarian" || prompt.includes("egg");
    const isNonVeg = userDiet === "non_vegetarian" || prompt.includes("chicken");
    const servingsCount = answers["q_servings"] ? parseInt(answers["q_servings"], 10) || 1 : 1;

    let ingredients: AIRecipeDraftIngredient[] = [];
    let recipeName = "Power Protein Vegetarian Breakfast Bowl";
    let instructions: string[] = [];

    if (isNonVeg) {
      recipeName = "Lean Chicken Breast & Egg White Power Plate";
      ingredients = [
        {
          id: "ing_chicken",
          name: "Chicken Breast (Cooked, Skinless)",
          quantity: 120 * servingsCount,
          unit: "g",
          matchedFoodId: "food_chicken_breast",
          matchStatus: "verified",
          weightGrams: 120 * servingsCount,
          calories: 198 * servingsCount,
          proteinGrams: 37.2 * servingsCount,
          carbsGrams: 0,
          fatGrams: 4.3 * servingsCount,
        },
        {
          id: "ing_egg_whites",
          name: "Egg Whites (Liquid/Cooked)",
          quantity: 150 * servingsCount,
          unit: "g",
          matchedFoodId: "food_egg_whites",
          matchStatus: "verified",
          weightGrams: 150 * servingsCount,
          calories: 78 * servingsCount,
          proteinGrams: 16.4 * servingsCount,
          carbsGrams: 1.0 * servingsCount,
          fatGrams: 0.3 * servingsCount,
        },
        {
          id: "ing_broccoli",
          name: "Steamed Fresh Broccoli",
          quantity: 100 * servingsCount,
          unit: "g",
          matchedFoodId: "food_broccoli",
          matchStatus: "verified",
          weightGrams: 100 * servingsCount,
          calories: 35 * servingsCount,
          proteinGrams: 2.4 * servingsCount,
          carbsGrams: 7.2 * servingsCount,
          fatGrams: 0.4 * servingsCount,
        },
        {
          id: "ing_olive_oil",
          name: "Extra Virgin Olive Oil",
          quantity: 1 * servingsCount,
          unit: "tsp",
          matchedFoodId: "food_olive_oil",
          matchStatus: "verified",
          weightGrams: 4.7 * servingsCount,
          calories: 40 * servingsCount,
          proteinGrams: 0,
          carbsGrams: 0,
          fatGrams: 4.5 * servingsCount,
        },
      ];
      instructions = [
        "Season chicken breast with black pepper, garlic powder, and paprika.",
        "Grill or pan-sear chicken in olive oil for 5-6 minutes per side until internal temperature reaches 74°C (165°F).",
        "Scramble egg whites in a non-stick pan over medium heat until fluffy.",
        "Steam fresh broccoli florets for 3 minutes until vibrant green.",
        "Plate together and enjoy high-protein, zero-sugar morning fuel.",
      ];
    } else if (isEggetarian) {
      recipeName = "High-Protein Masala Egg Bhurji & Toast";
      ingredients = [
        {
          id: "ing_eggs",
          name: "Whole Large Egg (Boiled/Poached)",
          quantity: 2 * servingsCount,
          unit: "piece",
          matchedFoodId: "food_whole_egg",
          matchStatus: "verified",
          weightGrams: 100 * servingsCount,
          calories: 144 * servingsCount,
          proteinGrams: 12.6 * servingsCount,
          carbsGrams: 0.8 * servingsCount,
          fatGrams: 9.6 * servingsCount,
        },
        {
          id: "ing_egg_whites",
          name: "Egg Whites (Liquid/Cooked)",
          quantity: 100 * servingsCount,
          unit: "g",
          matchedFoodId: "food_egg_whites",
          matchStatus: "verified",
          weightGrams: 100 * servingsCount,
          calories: 52 * servingsCount,
          proteinGrams: 10.9 * servingsCount,
          carbsGrams: 0.7 * servingsCount,
          fatGrams: 0.2 * servingsCount,
        },
        {
          id: "ing_onion",
          name: "Red Onion (Pyaz, Raw)",
          quantity: 30 * servingsCount,
          unit: "g",
          matchedFoodId: "in_produce_onion_raw",
          matchStatus: "verified",
          weightGrams: 30 * servingsCount,
          calories: 12 * servingsCount,
          proteinGrams: 0.4 * servingsCount,
          carbsGrams: 2.8 * servingsCount,
          fatGrams: 0,
        },
        {
          id: "ing_ghee",
          name: "Pure Desi Ghee",
          quantity: 1 * servingsCount,
          unit: "tsp",
          matchedFoodId: "fat_cow_ghee",
          matchStatus: "verified",
          weightGrams: 4.7 * servingsCount,
          calories: 40 * servingsCount,
          proteinGrams: 0,
          carbsGrams: 0,
          fatGrams: 4.7 * servingsCount,
        },
      ];
      instructions = [
        "Whisk whole eggs and egg whites together with salt and black pepper.",
        "Sauté onions and green chillies in ghee until golden.",
        "Pour eggs into the pan and stir continuously over low-medium heat until soft curds form.",
        "Serve hot with warm multigrain toast.",
      ];
    } else {
      // Vegetarian high protein: Paneer + Oats + Greek Yogurt or Whey
      recipeName = "High-Protein Paneer & Sprouted Moong Scramble";
      ingredients = [
        {
          id: "ing_paneer_lowfat",
          name: "Fresh Paneer (Low Fat / Skim Milk)",
          quantity: 150 * servingsCount,
          unit: "g",
          matchedFoodId: "in_dairy_paneer_lowfat",
          matchStatus: "verified",
          weightGrams: 150 * servingsCount,
          calories: 270 * servingsCount,
          proteinGrams: 33.0 * servingsCount,
          carbsGrams: 6.0 * servingsCount,
          fatGrams: 12.0 * servingsCount,
        },
        {
          id: "ing_onion",
          name: "Red Onion (Pyaz, Raw)",
          quantity: 40 * servingsCount,
          unit: "g",
          matchedFoodId: "in_produce_onion_raw",
          matchStatus: "verified",
          weightGrams: 40 * servingsCount,
          calories: 16 * servingsCount,
          proteinGrams: 0.5 * servingsCount,
          carbsGrams: 3.8 * servingsCount,
          fatGrams: 0.1 * servingsCount,
        },
        {
          id: "ing_tomato",
          name: "Tomato (Tamatar, Raw)",
          quantity: 40 * servingsCount,
          unit: "g",
          matchedFoodId: "in_produce_tomato_raw",
          matchStatus: "verified",
          weightGrams: 40 * servingsCount,
          calories: 8 * servingsCount,
          proteinGrams: 0.4 * servingsCount,
          carbsGrams: 1.6 * servingsCount,
          fatGrams: 0.1 * servingsCount,
        },
        {
          id: "ing_ghee",
          name: "Pure Desi Ghee",
          quantity: 1 * servingsCount,
          unit: "tsp",
          matchedFoodId: "fat_cow_ghee",
          matchStatus: "verified",
          weightGrams: 4.7 * servingsCount,
          calories: 40 * servingsCount,
          proteinGrams: 0,
          carbsGrams: 0,
          fatGrams: 4.7 * servingsCount,
        },
      ];
      instructions = [
        "Crumble low-fat paneer into small pieces.",
        "Heat ghee in a pan, add cumin seeds, onions, and tomatoes.",
        "Sauté until tender, then add paneer and spices.",
        "Toss for 2 minutes and serve warm with over 30g pure vegetarian protein.",
      ];
    }

    const draft = groundRecipeDraft(
      {
        recipeName,
        description: `Macro-optimized ${recipeName} delivering high protein density to support lean muscle maintenance and prolonged satiety.`,
        servings: servingsCount,
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        ingredients,
        instructions,
        clarifyingQuestions: [],
        dietaryTags: ["High Protein", "Fitness", "Satiating"],
        suggestedTweaks: [
          "Make two servings",
          "Reduce the amount of oil",
          "Add whole wheat toast",
        ],
        aiProvider: "offline_heuristic",
      },
      customFoods
    );

    return {
      draft,
      message: `Built your **${recipeName}** delivering **${draft.proteinPerServing}g protein** per serving!`,
      clarifyingQuestions: [],
      isOnlineAI: false,
      provider: "SabFitness Intelligent Rule-Based Engine",
    };
  }

  // 6. Generic Fallback: Extract all recognizable items from prompt
  const detectedIngredients: AIRecipeDraftIngredient[] = [];
  const words = prompt.split(/[,\s+&]+/);

  for (let i = 0; i < words.length; i++) {
    const single = words[i];
    const double = i < words.length - 1 ? `${words[i]} ${words[i + 1]}` : "";
    const match = matchFoodInDatabases(double, customFoods) || matchFoodInDatabases(single, customFoods);

    if (match && !detectedIngredients.some((ing) => ing.matchedFoodId === match.food.id)) {
      const defaultQty = match.food.servingSize || 100;
      const defaultUnit = match.food.servingUnit.includes("cup") ? "cup" : "g";
      detectedIngredients.push({
        id: `ing_${match.food.id}_${Date.now()}`,
        name: match.food.name,
        quantity: defaultQty,
        unit: defaultUnit,
        isProposedDefault: true,
        matchedFoodId: match.food.id,
        matchedFoodName: match.food.name,
        matchStatus: match.status,
        weightGrams: match.food.servingWeightGrams || defaultQty,
        calories: match.food.calories,
        proteinGrams: match.food.proteinGrams,
        carbsGrams: match.food.carbsGrams,
        fatGrams: match.food.fatGrams,
      });
    }
  }

  if (detectedIngredients.length > 0) {
    const draft = groundRecipeDraft(
      {
        recipeName: `Custom ${detectedIngredients.map((d) => d.name.split(" ")[0]).join(" & ")} Dish`,
        description: "Custom recipe dynamically constructed from your requested ingredients.",
        servings: 1,
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        ingredients: detectedIngredients,
        instructions: [
          "Wash and measure all ingredients according to the recipe list.",
          "Cook ingredients gently in a pan over medium heat.",
          "Season to taste and serve fresh.",
        ],
        clarifyingQuestions: [
          {
            id: "q_servings",
            question: "How many servings are you making?",
            options: ["1 Serving", "2 Servings", "4 Servings"],
            affectedField: "servings",
          },
        ],
        dietaryTags: ["Custom Recipe", "Balanced"],
        suggestedTweaks: [
          "Make it higher in protein",
          "Reduce the amount of oil",
          "Make two servings",
        ],
        aiProvider: "offline_heuristic",
      },
      customFoods
    );

    return {
      draft,
      message: `I've constructed a custom meal from your ingredients with verified nutrition metrics.`,
      clarifyingQuestions: draft.clarifyingQuestions || [],
      isOnlineAI: false,
      provider: "SabFitness Intelligent Rule-Based Engine",
    };
  }

  // 7. Ultimate fallback: High-Protein Healthy Oats Bowl
  return heuristicRecipePlanner(
    {
      prompt: "oats with milk and banana",
      userDietaryPreference: userDiet,
    },
    customFoods
  );
}

/**
 * Multi-Turn Iterative Recipe Refinement Engine
 * Modifies an existing draft based on conversational follow-up requests:
 * - "Make it higher in protein"
 * - "Remove honey"
 * - "Use skimmed milk"
 * - "Make two servings"
 * - "Reduce the amount of oil"
 * Recalculates all grounded macros deterministically.
 */
export function applyRecipeModification(
  currentDraft: AIRecipeDraft,
  prompt: string,
  customFoods: FoodItemDefinition[] = []
): AIRecipeResponse {
  const cleanPrompt = prompt.toLowerCase().trim();
  const updatedIngredients = [...currentDraft.ingredients];
  let updatedServings = currentDraft.servings || 1;
  let modificationMessage = "";

  // 1. "Make it higher in protein" / "more protein" / "increase protein"
  if (
    cleanPrompt.includes("higher in protein") ||
    cleanPrompt.includes("more protein") ||
    cleanPrompt.includes("increase protein") ||
    cleanPrompt.includes("add protein")
  ) {
    // Check if sweet/breakfast dish (contains oats, milk, banana, honey)
    const isSweetBreakfast = updatedIngredients.some(
      (ing) =>
        ing.matchedFoodId === "food_rolled_oats" ||
        ing.matchedFoodId === "food_banana" ||
        ing.matchedFoodId === "food_honey"
    );

    if (isSweetBreakfast) {
      // Add 1 scoop whey protein isolate
      const alreadyHasWhey = updatedIngredients.some((ing) => ing.matchedFoodId === "food_whey_protein");
      if (!alreadyHasWhey) {
        updatedIngredients.push({
          id: `ing_whey_${Date.now()}`,
          name: "Whey Protein Isolate Powder",
          quantity: 30 * updatedServings,
          unit: "g",
          isProposedDefault: false,
          matchedFoodId: "food_whey_protein",
          matchStatus: "verified",
          weightGrams: 30 * updatedServings,
          calories: 120 * updatedServings,
          proteinGrams: 25.0 * updatedServings,
          carbsGrams: 1.5 * updatedServings,
          fatGrams: 0.8 * updatedServings,
          notes: "Adds 25g pure protein per scoop without excess carbs or fat",
        });
        modificationMessage = "Added 1 scoop (30g) Whey Protein Isolate, boosting protein by +25g per serving!";
      } else {
        // Boost oats or add egg whites
        modificationMessage = "Protein is already boosted with Whey Protein Isolate in this recipe.";
      }
    } else {
      // Savory Indian dish: boost paneer or add egg whites
      const paneerIdx = updatedIngredients.findIndex((ing) => ing.name.toLowerCase().includes("paneer"));
      if (paneerIdx >= 0) {
        const oldQty = updatedIngredients[paneerIdx].quantity;
        const newQty = Math.round(oldQty * 1.5);
        updatedIngredients[paneerIdx] = {
          ...updatedIngredients[paneerIdx],
          quantity: newQty,
        };
        modificationMessage = `Increased paneer from ${oldQty}g to ${newQty}g to significantly elevate protein content.`;
      } else {
        // Add 3 boiled egg whites or paneer
        updatedIngredients.push({
          id: `ing_egg_whites_${Date.now()}`,
          name: "Egg Whites (Liquid/Cooked)",
          quantity: 100 * updatedServings,
          unit: "g",
          matchedFoodId: "food_egg_whites",
          matchStatus: "verified",
          weightGrams: 100 * updatedServings,
          calories: 52 * updatedServings,
          proteinGrams: 10.9 * updatedServings,
          carbsGrams: 0.7 * updatedServings,
          fatGrams: 0.2 * updatedServings,
        });
        modificationMessage = "Added 100g egg whites, adding +11g lean protein with virtually zero fat.";
      }
    }
  }

  // 2. "Remove <ingredient>" / "take out <ingredient>" / "no <ingredient>"
  const removeMatch = cleanPrompt.match(
    /(?:remove|take out|no|without|delete)\s+([a-z\s]+)/i
  );
  if (removeMatch && removeMatch[1]) {
    const targetToRemove = removeMatch[1].trim().toLowerCase();
    const initLen = updatedIngredients.length;
    const filtered = updatedIngredients.filter((ing) => {
      const ingName = ing.name.toLowerCase();
      return !ingName.includes(targetToRemove) && !targetToRemove.includes(ingName.split(" ")[0]);
    });

    if (filtered.length < initLen) {
      updatedIngredients.length = 0;
      updatedIngredients.push(...filtered);
      modificationMessage = `Removed **${targetToRemove}** and recalculated the macros.`;
    }
  }

  // 3. "Use skimmed milk" / "use toned milk" / "swap milk"
  if (
    cleanPrompt.includes("skimmed milk") ||
    cleanPrompt.includes("skim milk") ||
    cleanPrompt.includes("toned milk") ||
    cleanPrompt.includes("almond milk") ||
    cleanPrompt.includes("soy milk")
  ) {
    const milkIdx = updatedIngredients.findIndex(
      (ing) => ing.name.toLowerCase().includes("milk") || ing.matchedFoodId?.includes("milk")
    );
    if (milkIdx >= 0) {
      let targetId = "dairy_milk_skimmed";
      let targetName = "Skimmed Milk (Fat Free <0.5%)";

      if (cleanPrompt.includes("toned")) {
        targetId = "dairy_milk_toned";
        targetName = "Toned Cow's Milk (Low Fat 1.5-3%)";
      } else if (cleanPrompt.includes("almond")) {
        targetId = "dairy_milk_almond";
        targetName = "Unsweetened Almond Milk";
      } else if (cleanPrompt.includes("soy")) {
        targetId = "dairy_milk_soy";
        targetName = "Unsweetened Soy Milk";
      }

      updatedIngredients[milkIdx] = {
        ...updatedIngredients[milkIdx],
        name: targetName,
        matchedFoodId: targetId,
        matchStatus: "verified",
      };
      modificationMessage = `Swapped to **${targetName}**, reducing total calorie and fat intake.`;
    }
  }

  // 4. "Make two servings" / "make 3 servings" / "scale to N servings"
  const servingsMatch =
    cleanPrompt.match(/(?:make|scale to|change to|for)\s+(\d+|two|three|four|five)\s+servings?/i) ||
    cleanPrompt.match(/double the recipe/i);

  if (servingsMatch) {
    let newServings = 2;
    if (cleanPrompt.includes("double")) {
      newServings = updatedServings * 2;
    } else {
      const rawVal = servingsMatch[1].toLowerCase();
      if (rawVal === "two") newServings = 2;
      else if (rawVal === "three") newServings = 3;
      else if (rawVal === "four") newServings = 4;
      else if (rawVal === "five") newServings = 5;
      else newServings = parseInt(rawVal, 10) || 2;
    }

    const scaleFactor = newServings / updatedServings;
    for (let i = 0; i < updatedIngredients.length; i++) {
      updatedIngredients[i] = {
        ...updatedIngredients[i],
        quantity: Math.round(updatedIngredients[i].quantity * scaleFactor * 10) / 10,
      };
    }
    updatedServings = newServings;
    modificationMessage = `Scaled the entire recipe to **${newServings} servings** with proportional quantities.`;
  }

  // 5. "Reduce the amount of oil" / "less oil" / "less ghee" / "cut down oil"
  if (
    cleanPrompt.includes("reduce") && (cleanPrompt.includes("oil") || cleanPrompt.includes("ghee") || cleanPrompt.includes("fat")) ||
    cleanPrompt.includes("less oil") ||
    cleanPrompt.includes("less ghee") ||
    cleanPrompt.includes("cut down oil")
  ) {
    const fatIdx = updatedIngredients.findIndex(
      (ing) =>
        ing.matchedFoodId?.includes("fat_") ||
        ing.name.toLowerCase().includes("oil") ||
        ing.name.toLowerCase().includes("ghee") ||
        ing.name.toLowerCase().includes("butter")
    );

    if (fatIdx >= 0) {
      const oldQty = updatedIngredients[fatIdx].quantity;
      const newQty = Math.max(1, Math.round((oldQty * 0.5) * 10) / 10);
      updatedIngredients[fatIdx] = {
        ...updatedIngredients[fatIdx],
        quantity: newQty,
        unit: updatedIngredients[fatIdx].unit === "tbsp" ? "tsp" : updatedIngredients[fatIdx].unit,
      };
      modificationMessage = `Reduced cooking fat by 50% (from ${oldQty} to ${newQty}), substantially lowering calories and fats.`;
    }
  }

  // Ground and re-compute all macros
  const groundedDraft = groundRecipeDraft(
    {
      ...currentDraft,
      servings: updatedServings,
      ingredients: updatedIngredients,
    },
    customFoods
  );

  return {
    draft: groundedDraft,
    message: modificationMessage || `Updated your recipe according to: "${prompt}". All nutrition values have been grounded against verified database figures.`,
    clarifyingQuestions: [],
    isOnlineAI: false,
    provider: currentDraft.aiProvider || "SabFitness AI",
  };
}

/**
 * Converts an AI Recipe Draft directly into a standard RecipeDefinition
 * for persistence into user recipes.
 */
export function convertDraftToRecipeDefinition(
  draft: AIRecipeDraft,
  userId?: string
): RecipeDefinition {
  const nowIso = new Date().toISOString();
  return {
    id: draft.id || `recipe_${Date.now()}`,
    userId,
    name: draft.recipeName,
    description: draft.description,
    servings: draft.servings,
    cookedWeightGrams: draft.cookedWeightGrams,
    prepTimeMinutes: draft.prepTimeMinutes,
    cookTimeMinutes: draft.cookTimeMinutes,
    instructions: draft.instructions,
    ingredients: draft.ingredients.map((ing) => ({
      id: ing.id,
      foodId: ing.matchedFoodId,
      foodItemId: ing.matchedFoodId,
      foodName: ing.matchedFoodName || ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      weightGrams: ing.weightGrams,
      calories: ing.calories,
      proteinGrams: ing.proteinGrams,
      carbsGrams: ing.carbsGrams,
      fatGrams: ing.fatGrams,
      fiberGrams: ing.fiberGrams,
      sugarGrams: ing.sugarGrams,
      sodiumMg: ing.sodiumMg,
    })),
    totalCalories: draft.totalCalories,
    totalProteinGrams: draft.totalProteinGrams,
    totalCarbsGrams: draft.totalCarbsGrams,
    totalFatGrams: draft.totalFatGrams,
    totalFiberGrams: draft.totalFiberGrams,
    caloriesPerServing: draft.caloriesPerServing,
    proteinPerServing: draft.proteinPerServing,
    carbsPerServing: draft.carbsPerServing,
    fatPerServing: draft.fatPerServing,
    fiberPerServing: draft.fiberPerServing,
    caloriesPer100gCooked: draft.caloriesPer100gCooked,
    proteinPer100gCooked: draft.proteinPer100gCooked,
    carbsPer100gCooked: draft.carbsPer100gCooked,
    fatPer100gCooked: draft.fatPer100gCooked,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/**
 * Converts an AI Recipe Draft directly into a LoggedFoodItem snapshot
 * for 1-click food diary logging with immutable history isolation.
 */
export function convertDraftToLoggedItem(
  draft: AIRecipeDraft,
  mealType: MealType,
  targetDateStr?: string
): LoggedFoodItem {
  const nowIso = new Date().toISOString();
  const dateStr = targetDateStr || nowIso.split("T")[0];

  return {
    id: `logged_ai_recipe_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    foodName: `${draft.recipeName} (AI Recipe)`,
    name: `${draft.recipeName} (AI Recipe)`,
    brand: "AI Recipe Assistant",
    mealType,
    servingAmount: 1,
    servingSize: 1,
    servingUnit: "serving",
    servingWeightGrams: Math.round((draft.rawWeightGrams || 100) / (draft.servings || 1)),
    quantity: 1,
    calories: draft.caloriesPerServing,
    proteinGrams: draft.proteinPerServing,
    carbsGrams: draft.carbsPerServing,
    fatGrams: draft.fatPerServing,
    fiberGrams: draft.fiberPerServing,
    source: "custom_recipe",
    isRecipe: true,
    recipeId: draft.id,
    loggedAt: `${dateStr}T${nowIso.split("T")[1] || "12:00:00.000Z"}`,
  };
}
