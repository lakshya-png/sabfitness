import type {
  RecipeIngredient,
  RecipeDefinition,
  LoggedFoodItem,
  FoodItemDefinition,
  MealType,
} from "@/types/nutrition";
import { calculateMacrosForQuantity, getWeightInGrams } from "./indianFoods/units.ts";

export interface RecipeTotals {
  totalWeightGrams: number;
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalSaturatedFatGrams: number;
  totalFiberGrams: number;
  totalSugarGrams: number;
  totalSodiumMg: number;
}

export interface PerServingMacros {
  weightGramsPerServing: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  saturatedFatGrams: number;
  fiberGrams: number;
  sugarGrams: number;
  sodiumMg: number;
}

export interface CookedYieldMacros {
  cookedWeightGrams: number;
  rawWeightGrams: number;
  waterYieldRatio: number;
  caloriesPer100gCooked: number;
  proteinPer100gCooked: number;
  carbsPer100gCooked: number;
  fatPer100gCooked: number;
  saturatedFatPer100gCooked: number;
  fiberPer100gCooked: number;
  sugarPer100gCooked: number;
  sodiumPer100gCooked: number;
}

export interface ScaleRecipeOptions {
  servings?: number;
  cookedPortionGrams?: number;
}

/**
 * Calculates sum totals of all ingredients in a recipe.
 */
export function calculateRecipeTotals(ingredients: RecipeIngredient[]): RecipeTotals {
  let totalWeightGrams = 0;
  let totalCalories = 0;
  let totalProteinGrams = 0;
  let totalCarbsGrams = 0;
  let totalFatGrams = 0;
  let totalSaturatedFatGrams = 0;
  let totalFiberGrams = 0;
  let totalSugarGrams = 0;
  let totalSodiumMg = 0;

  for (const ing of ingredients) {
    const weight =
      ing.weightGrams ??
      (ing.foodItem ? getWeightInGrams(ing.foodItem, ing.quantity, ing.unit) : ing.quantity);
    totalWeightGrams += weight;
    totalCalories += ing.calories || 0;
    totalProteinGrams += ing.proteinGrams || 0;
    totalCarbsGrams += ing.carbsGrams || 0;
    totalFatGrams += ing.fatGrams || 0;
    totalSaturatedFatGrams += ing.saturatedFatGrams || 0;
    totalFiberGrams += ing.fiberGrams || 0;
    totalSugarGrams += ing.sugarGrams || 0;
    totalSodiumMg += ing.sodiumMg || 0;
  }

  return {
    totalWeightGrams: Math.round(totalWeightGrams * 10) / 10,
    totalCalories: Math.round(totalCalories),
    totalProteinGrams: Math.round(totalProteinGrams * 10) / 10,
    totalCarbsGrams: Math.round(totalCarbsGrams * 10) / 10,
    totalFatGrams: Math.round(totalFatGrams * 10) / 10,
    totalSaturatedFatGrams: Math.round(totalSaturatedFatGrams * 10) / 10,
    totalFiberGrams: Math.round(totalFiberGrams * 10) / 10,
    totalSugarGrams: Math.round(totalSugarGrams * 10) / 10,
    totalSodiumMg: Math.round(totalSodiumMg),
  };
}

/**
 * Calculates nutrition values for a single serving of the recipe.
 */
export function calculatePerServingMacros(
  ingredients: RecipeIngredient[],
  servings: number
): PerServingMacros {
  const safeServings = Math.max(0.1, servings || 1);
  const totals = calculateRecipeTotals(ingredients);

  return {
    weightGramsPerServing: Math.round((totals.totalWeightGrams / safeServings) * 10) / 10,
    calories: Math.round(totals.totalCalories / safeServings),
    proteinGrams: Math.round((totals.totalProteinGrams / safeServings) * 10) / 10,
    carbsGrams: Math.round((totals.totalCarbsGrams / safeServings) * 10) / 10,
    fatGrams: Math.round((totals.totalFatGrams / safeServings) * 10) / 10,
    saturatedFatGrams: Math.round((totals.totalSaturatedFatGrams / safeServings) * 10) / 10,
    fiberGrams: Math.round((totals.totalFiberGrams / safeServings) * 10) / 10,
    sugarGrams: Math.round((totals.totalSugarGrams / safeServings) * 10) / 10,
    sodiumMg: Math.round(totals.totalSodiumMg / safeServings),
  };
}

/**
 * Calculates nutrition values normalized per 100g of final cooked batch weight.
 * Essential for batch-cooked dishes like khichdi, dal, stews, oats porridge, biryani.
 */
export function calculateCookedYieldMacros(
  totals: RecipeTotals,
  cookedWeightGrams?: number
): CookedYieldMacros | null {
  if (!cookedWeightGrams || cookedWeightGrams <= 0) return null;

  const rawWeight = Math.max(1, totals.totalWeightGrams);
  const ratio = 100 / cookedWeightGrams;
  const waterYieldRatio = Math.round((cookedWeightGrams / rawWeight) * 100) / 100;

  return {
    cookedWeightGrams: Math.round(cookedWeightGrams),
    rawWeightGrams: totals.totalWeightGrams,
    waterYieldRatio,
    caloriesPer100gCooked: Math.round(totals.totalCalories * ratio * 10) / 10,
    proteinPer100gCooked: Math.round(totals.totalProteinGrams * ratio * 10) / 10,
    carbsPer100gCooked: Math.round(totals.totalCarbsGrams * ratio * 10) / 10,
    fatPer100gCooked: Math.round(totals.totalFatGrams * ratio * 10) / 10,
    saturatedFatPer100gCooked: Math.round(totals.totalSaturatedFatGrams * ratio * 10) / 10,
    fiberPer100gCooked: Math.round(totals.totalFiberGrams * ratio * 10) / 10,
    sugarPer100gCooked: Math.round(totals.totalSugarGrams * ratio * 10) / 10,
    sodiumPer100gCooked: Math.round(totals.totalSodiumMg * ratio),
  };
}

/**
 * Creates a RecipeIngredient from a FoodItemDefinition with chosen quantity and unit.
 */
export function createRecipeIngredient(
  food: FoodItemDefinition,
  quantity: number = 1,
  unit: string = "g"
): RecipeIngredient {
  const macros = calculateMacrosForQuantity(food, quantity, unit);
  return {
    id: `ing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    foodId: food.id,
    foodItemId: food.id,
    foodName: food.name,
    foodItem: food,
    quantity,
    unit,
    weightGrams: macros.weightGrams,
    calories: macros.calories,
    proteinGrams: macros.proteinGrams,
    carbsGrams: macros.carbsGrams,
    fatGrams: macros.fatGrams,
    saturatedFatGrams: macros.saturatedFatGrams,
    fiberGrams: macros.fiberGrams,
    sugarGrams: macros.sugarGrams,
    sodiumMg: macros.sodiumMg,
  };
}

/**
 * Updates an existing recipe ingredient with new quantity or unit, dynamically recalculating macros.
 */
export function updateRecipeIngredient(
  ingredient: RecipeIngredient,
  quantity: number,
  unit?: string
): RecipeIngredient {
  const safeQuantity = Math.max(0, quantity);
  const targetUnit = unit || ingredient.unit;

  if (ingredient.foodItem) {
    const macros = calculateMacrosForQuantity(ingredient.foodItem, safeQuantity, targetUnit);
    return {
      ...ingredient,
      quantity: safeQuantity,
      unit: targetUnit,
      weightGrams: macros.weightGrams,
      calories: macros.calories,
      proteinGrams: macros.proteinGrams,
      carbsGrams: macros.carbsGrams,
      fatGrams: macros.fatGrams,
      saturatedFatGrams: macros.saturatedFatGrams,
      fiberGrams: macros.fiberGrams,
      sugarGrams: macros.sugarGrams,
      sodiumMg: macros.sodiumMg,
    };
  }

  // Fallback if foodItem definition is detached: linear ratio scaling
  const oldQty = Math.max(0.001, ingredient.quantity);
  const ratio = safeQuantity / oldQty;

  return {
    ...ingredient,
    quantity: safeQuantity,
    unit: targetUnit,
    weightGrams: Math.round(ingredient.weightGrams * ratio * 10) / 10,
    calories: Math.round(ingredient.calories * ratio),
    proteinGrams: Math.round(ingredient.proteinGrams * ratio * 10) / 10,
    carbsGrams: Math.round(ingredient.carbsGrams * ratio * 10) / 10,
    fatGrams: Math.round(ingredient.fatGrams * ratio * 10) / 10,
    saturatedFatGrams: ingredient.saturatedFatGrams ? Math.round(ingredient.saturatedFatGrams * ratio * 10) / 10 : undefined,
    fiberGrams: ingredient.fiberGrams ? Math.round(ingredient.fiberGrams * ratio * 10) / 10 : undefined,
    sugarGrams: ingredient.sugarGrams ? Math.round(ingredient.sugarGrams * ratio * 10) / 10 : undefined,
    sodiumMg: ingredient.sodiumMg ? Math.round(ingredient.sodiumMg * ratio) : undefined,
  };
}

/**
 * Calculates an ingredient's contribution percentages to total calories and protein.
 */
export function calculateIngredientContribution(
  ingredient: RecipeIngredient,
  totals: RecipeTotals
): { caloriePercent: number; proteinPercent: number } {
  const calPercent = totals.totalCalories > 0 ? Math.round(((ingredient.calories || 0) / totals.totalCalories) * 100) : 0;
  const protPercent = totals.totalProteinGrams > 0 ? Math.round(((ingredient.proteinGrams || 0) / totals.totalProteinGrams) * 100) : 0;
  return { caloriePercent: Math.min(100, calPercent), proteinPercent: Math.min(100, protPercent) };
}

/**
 * Converts a recipe into an independent LoggedFoodItem snapshot for diary logging.
 * Supports scaling by either number of servings OR weighed cooked plate portions (grams).
 * Modifying the recipe later will NEVER affect past diary records.
 */
export function scaleRecipeForDiary(
  recipe: RecipeDefinition,
  portionOption: ScaleRecipeOptions | number = 1,
  mealType: MealType = "lunch",
  targetDateStr?: string
): LoggedFoodItem {
  const nowIso = new Date().toISOString();
  const dateStr = targetDateStr || nowIso.split("T")[0];
  const totals = calculateRecipeTotals(recipe.ingredients);

  let servingAmount = 1;
  let servingUnit = "serving";
  let servingWeightGrams = 100;
  let multiplier = 1;

  if (typeof portionOption === "number") {
    servingAmount = Math.max(0.1, portionOption);
    multiplier = servingAmount / Math.max(0.1, recipe.servings || 1);
    const perServing = calculatePerServingMacros(recipe.ingredients, recipe.servings);
    servingUnit = servingAmount === 1 ? "serving" : "servings";
    servingWeightGrams = Math.round(perServing.weightGramsPerServing * servingAmount);
  } else if (portionOption.cookedPortionGrams && recipe.cookedWeightGrams && recipe.cookedWeightGrams > 0) {
    // Portioned by cooked weight (e.g. weighed 175g cooked out of 350g batch)
    const cookedGrams = Math.max(1, portionOption.cookedPortionGrams);
    multiplier = cookedGrams / recipe.cookedWeightGrams;
    servingAmount = cookedGrams;
    servingUnit = "g cooked";
    servingWeightGrams = Math.round(cookedGrams);
  } else {
    // Portioned by servings
    const safeServings = Math.max(0.1, portionOption.servings || 1);
    servingAmount = safeServings;
    multiplier = safeServings / Math.max(0.1, recipe.servings || 1);
    const perServing = calculatePerServingMacros(recipe.ingredients, recipe.servings);
    servingUnit = safeServings === 1 ? "serving" : "servings";
    servingWeightGrams = Math.round(perServing.weightGramsPerServing * safeServings);
  }

  return {
    id: `logged_recipe_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    foodName: `${recipe.name} (Recipe)`,
    name: `${recipe.name} (Recipe)`,
    brand: "Home Recipe",
    mealType,
    servingAmount,
    servingSize: servingAmount,
    servingUnit,
    servingWeightGrams,
    quantity: servingAmount,
    calories: Math.round(totals.totalCalories * multiplier),
    proteinGrams: Math.round(totals.totalProteinGrams * multiplier * 10) / 10,
    carbsGrams: Math.round(totals.totalCarbsGrams * multiplier * 10) / 10,
    fatGrams: Math.round(totals.totalFatGrams * multiplier * 10) / 10,
    saturatedFatGrams: totals.totalSaturatedFatGrams ? Math.round(totals.totalSaturatedFatGrams * multiplier * 10) / 10 : undefined,
    fiberGrams: totals.totalFiberGrams ? Math.round(totals.totalFiberGrams * multiplier * 10) / 10 : undefined,
    sugarGrams: totals.totalSugarGrams ? Math.round(totals.totalSugarGrams * multiplier * 10) / 10 : undefined,
    sodiumMg: totals.totalSodiumMg ? Math.round(totals.totalSodiumMg * multiplier) : undefined,
    source: "custom_recipe",
    isRecipe: true,
    recipeId: recipe.id,
    loggedAt: `${dateStr}T${nowIso.split("T")[1] || "12:00:00.000Z"}`,
  };
}

/**
 * Common quick-add cooking fat options for the recipe builder
 */
export const COMMON_COOKING_FATS = [
  { id: "fat_mustard_oil", name: "Mustard Oil (Sarson Ka Tel)", calPerTbsp: 124, fatPerTbsp: 14, defaultUnit: "tbsp" },
  { id: "fat_cow_ghee", name: "Pure Desi Ghee", calPerTbsp: 120, fatPerTbsp: 14, defaultUnit: "tbsp" },
  { id: "fat_sunflower_oil", name: "Refined Sunflower / Groundnut Oil", calPerTbsp: 120, fatPerTbsp: 14, defaultUnit: "tbsp" },
  { id: "fat_coconut_oil", name: "Cold-Pressed Coconut Oil", calPerTbsp: 121, fatPerTbsp: 14, defaultUnit: "tbsp" },
  { id: "fat_butter", name: "White Butter (Makhan) / Amul Butter", calPerTbsp: 102, fatPerTbsp: 11.5, defaultUnit: "tbsp" },
  { id: "fat_olive_oil", name: "Extra Virgin Olive Oil", calPerTbsp: 119, fatPerTbsp: 13.5, defaultUnit: "tbsp" },
];
