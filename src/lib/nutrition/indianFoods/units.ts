import type { FoodItemDefinition, ServingUnitOption } from "@/types/nutrition";

export const COMMON_INDIAN_UNITS: ServingUnitOption[] = [
  { unit: "g", label: "Grams (g)", factorToGrams: 1 },
  { unit: "kg", label: "Kilograms (kg / 1,000g)", factorToGrams: 1000 },
  { unit: "ml", label: "Millilitres (ml)", factorToGrams: 1 },
  { unit: "l", label: "Litres (L / 1,000ml)", factorToGrams: 1000 },
  { unit: "katori", label: "Katori / Small Bowl (150g)", factorToGrams: 150 },
  { unit: "medium_bowl", label: "Medium Bowl (250g)", factorToGrams: 250 },
  { unit: "piece", label: "Piece / Item", factorToGrams: 50 },
  { unit: "medium", label: "1 Medium Item", factorToGrams: 100 },
  { unit: "small", label: "1 Small Item", factorToGrams: 75 },
  { unit: "large", label: "1 Large Item", factorToGrams: 130 },
  { unit: "roti", label: "Roti / Chapati (35g)", factorToGrams: 35 },
  { unit: "paratha", label: "Paratha (70g)", factorToGrams: 70 },
  { unit: "cup", label: "Cup (200g / 240ml)", factorToGrams: 200 },
  { unit: "tbsp", label: "Tablespoon (15g)", factorToGrams: 15 },
  { unit: "tsp", label: "Teaspoon (5g)", factorToGrams: 5 },
  { unit: "glass", label: "Glass (250ml)", factorToGrams: 250 },
  { unit: "plate", label: "Full Plate (300g)", factorToGrams: 300 },
  { unit: "scoop", label: "1 Scoop (30g)", factorToGrams: 30 },
  { unit: "slice", label: "1 Slice (30g)", factorToGrams: 30 },
  { unit: "serving", label: "Standard Serving", factorToGrams: 100 },
];

/**
 * Returns ingredient-specific weight in grams for culinary volume and piece units.
 * Prevents treating all cups, spoons, and items as uniform mass.
 */
export function getIngredientSpecificDensityWeight(
  food: FoodItemDefinition,
  quantity: number,
  normalizedUnit: string
): number | null {
  const nameLower = `${food.name} ${food.regionalName || ""} ${food.id || ""}`.toLowerCase();
  const cat = food.category || "other";

  // --- 1. Honey (density ~1.42 g/ml) ---
  if (nameLower.includes("honey") || nameLower.includes("shahad")) {
    if (normalizedUnit === "tsp" || normalizedUnit === "teaspoon" || normalizedUnit === "teaspoons") {
      return quantity * 7; // Exactly 7g per tsp (USDA standard ~7.1g)
    }
    if (normalizedUnit === "tbsp" || normalizedUnit === "tablespoon" || normalizedUnit === "tablespoons") {
      return quantity * 21; // Exactly 21g per tbsp
    }
    if (normalizedUnit === "cup" || normalizedUnit === "cups") {
      return quantity * 340;
    }
    if (normalizedUnit === "ml" || normalizedUnit === "millilitres" || normalizedUnit === "milliliters") {
      return quantity * 1.42;
    }
  }

  // --- 2. Oats / Rolled Oats / Oatmeal (dry density ~0.35 - 0.40 g/ml) ---
  if (nameLower.includes("oat") || nameLower.includes("jai")) {
    if (normalizedUnit === "cup" || normalizedUnit === "cups") {
      return quantity * 80; // 1 cup dry rolled oats = 80g
    }
    if (normalizedUnit === "1/2 cup" || normalizedUnit === "half cup") {
      return quantity * 40;
    }
    if (normalizedUnit === "tbsp" || normalizedUnit === "tablespoon" || normalizedUnit === "tablespoons") {
      return quantity * 10;
    }
    if (normalizedUnit === "tsp" || normalizedUnit === "teaspoon" || normalizedUnit === "teaspoons") {
      return quantity * 3.3;
    }
    if (normalizedUnit === "scoop") {
      return quantity * 40;
    }
    if (normalizedUnit === "katori") {
      return quantity * 40; // dry serving in katori
    }
  }

  // --- 3. Banana ---
  if (nameLower.includes("banana") || nameLower.includes("kela")) {
    if (
      normalizedUnit === "medium" ||
      normalizedUnit === "piece" ||
      normalizedUnit === "item" ||
      normalizedUnit === "serving" ||
      normalizedUnit === "1 medium (118g)"
    ) {
      return quantity * 118; // Standard USDA/IFCT medium banana = 118g
    }
    if (normalizedUnit === "small") {
      return quantity * 101;
    }
    if (normalizedUnit === "large") {
      return quantity * 136;
    }
    if (normalizedUnit === "cup" || normalizedUnit === "cups") {
      return quantity * 150; // sliced banana
    }
  }

  // --- 4. Milk / Curd / Yogurt / Dahi ---
  if (
    nameLower.includes("milk") ||
    nameLower.includes("dahi") ||
    nameLower.includes("curd") ||
    nameLower.includes("yogurt") ||
    cat === "dairy_beverages"
  ) {
    if (normalizedUnit === "cup" || normalizedUnit === "cups") {
      return quantity * 240; // 1 cup milk = 240g/ml
    }
    if (normalizedUnit === "glass") {
      return quantity * 250; // 1 standard glass = 250ml
    }
    if (normalizedUnit === "tbsp" || normalizedUnit === "tablespoon") {
      return quantity * 15;
    }
    if (normalizedUnit === "tsp" || normalizedUnit === "teaspoon") {
      return quantity * 5;
    }
    if (normalizedUnit === "katori") {
      return quantity * 150;
    }
  }

  // --- 5. Cooking Oils / Ghee / Butter (density ~0.91 - 0.93 g/ml) ---
  if (
    nameLower.includes("oil") ||
    nameLower.includes("ghee") ||
    nameLower.includes("butter") ||
    nameLower.includes("makhan") ||
    cat === "cooking_fats_spices"
  ) {
    if (normalizedUnit === "tbsp" || normalizedUnit === "tablespoon") {
      return quantity * 14; // 1 tbsp cooking fat = 14g
    }
    if (normalizedUnit === "tsp" || normalizedUnit === "teaspoon") {
      return quantity * 4.5; // 1 tsp oil/ghee = 4.5g
    }
    if (normalizedUnit === "cup" || normalizedUnit === "cups") {
      return quantity * 218;
    }
    if (normalizedUnit === "ml" || normalizedUnit === "millilitres" || normalizedUnit === "milliliters") {
      return quantity * 0.92;
    }
  }

  // --- 6. Flours (Atta, Besan, Maida, Suji, Rava) ---
  if (
    nameLower.includes("flour") ||
    nameLower.includes("atta") ||
    nameLower.includes("besan") ||
    nameLower.includes("maida") ||
    nameLower.includes("suji") ||
    nameLower.includes("rava")
  ) {
    if (normalizedUnit === "cup" || normalizedUnit === "cups") {
      return quantity * 120; // 1 cup atta/flour = 120g
    }
    if (normalizedUnit === "tbsp" || normalizedUnit === "tablespoon") {
      return quantity * 8;
    }
    if (normalizedUnit === "tsp" || normalizedUnit === "teaspoon") {
      return quantity * 2.5;
    }
    if (normalizedUnit === "katori") {
      return quantity * 90;
    }
  }

  // --- 7. Sugar / Jaggery / Gur ---
  if (nameLower.includes("sugar") || nameLower.includes("jaggery") || nameLower.includes("gur")) {
    if (normalizedUnit === "tbsp" || normalizedUnit === "tablespoon") {
      return quantity * 12.5;
    }
    if (normalizedUnit === "tsp" || normalizedUnit === "teaspoon") {
      return quantity * 4.2;
    }
    if (normalizedUnit === "cup" || normalizedUnit === "cups") {
      return quantity * 200;
    }
  }

  // --- 8. Whey / Protein Powder ---
  if (nameLower.includes("whey") || nameLower.includes("protein powder")) {
    if (normalizedUnit === "scoop" || normalizedUnit === "serving") {
      return quantity * (food.servingWeightGrams || 30);
    }
    if (normalizedUnit === "tbsp" || normalizedUnit === "tablespoon") {
      return quantity * 10;
    }
  }

  // --- 9. Whole Eggs ---
  if (
    (nameLower.includes("whole egg") || nameLower.includes("boiled egg") || nameLower.includes("large egg")) &&
    !nameLower.includes("eggplant")
  ) {
    if (normalizedUnit === "piece" || normalizedUnit === "item" || normalizedUnit === "egg" || normalizedUnit === "medium") {
      return quantity * (food.servingWeightGrams || 50);
    }
    if (normalizedUnit === "large") {
      return quantity * 60;
    }
    if (normalizedUnit === "small") {
      return quantity * 40;
    }
  }

  // --- 10. Bread Slices ---
  if (nameLower.includes("bread") || nameLower.includes("toast") || normalizedUnit === "slice") {
    if (normalizedUnit === "slice" || normalizedUnit === "piece") {
      return quantity * (food.servingWeightGrams || 30);
    }
  }

  return null;
}

/**
 * Resolves the weight in grams (or volume in ml) for any given food, quantity and unit.
 * 1. Checks direct metric units (g, kg, ml, L).
 * 2. Checks ingredient-specific density mappings.
 * 3. Checks food-specific allowedUnits.
 * 4. Checks primary servingUnit.
 * 5. Falls back to standard culinary conversions.
 */
export function getWeightInGrams(food: FoodItemDefinition, quantity: number, unit: string): number {
  if (quantity <= 0) return 0;

  const normalizedUnit = unit.toLowerCase().trim();

  // 1. Direct grams or metric units
  if (normalizedUnit === "g" || normalizedUnit === "gram" || normalizedUnit === "grams") {
    return quantity;
  }
  if (normalizedUnit === "kg" || normalizedUnit === "kilogram" || normalizedUnit === "kilograms") {
    return quantity * 1000;
  }
  if (normalizedUnit === "l" || normalizedUnit === "liter" || normalizedUnit === "litre" || normalizedUnit === "litres" || normalizedUnit === "liters") {
    return quantity * 1000;
  }

  // 2. Ingredient-specific density lookup (Honey, Oats, Banana, Milk, Flours, Oils, etc.)
  const densityWeight = getIngredientSpecificDensityWeight(food, quantity, normalizedUnit);
  if (densityWeight !== null) {
    return densityWeight;
  }

  // 3. Direct ml check (with fat density fallback)
  if (normalizedUnit === "ml" || normalizedUnit === "millilitres" || normalizedUnit === "milliliters") {
    if (food.category === "cooking_fats_spices" || food.id.includes("oil") || food.id.includes("ghee")) {
      return quantity * 0.92;
    }
    return quantity;
  }

  // 4. Food-specific allowedUnits
  if (food.allowedUnits && food.allowedUnits.length > 0) {
    const matched = food.allowedUnits.find(
      (u) => u.unit.toLowerCase() === normalizedUnit || u.label.toLowerCase().includes(normalizedUnit)
    );
    if (matched) {
      return quantity * matched.factorToGrams;
    }
  }

  // 5. Match food's primary servingUnit
  if (
    food.servingUnit.toLowerCase().includes(normalizedUnit) ||
    normalizedUnit.includes(food.servingUnit.toLowerCase())
  ) {
    const baseUnitWeight = food.servingWeightGrams || food.servingSize || 100;
    const baseServingSize = food.servingSize || 1;
    return (quantity / baseServingSize) * baseUnitWeight;
  }

  // 6. Piece / Medium / Item sizing from food's serving weight
  if (
    (normalizedUnit === "piece" || normalizedUnit === "item" || normalizedUnit === "medium" || normalizedUnit === "roti" || normalizedUnit === "paratha") &&
    food.servingWeightGrams
  ) {
    return quantity * food.servingWeightGrams;
  }

  // 7. Fallback to standard Indian culinary conversions
  const standardUnit = COMMON_INDIAN_UNITS.find((u) => u.unit.toLowerCase() === normalizedUnit);
  if (standardUnit) {
    return quantity * standardUnit.factorToGrams;
  }

  // Final fallback to base serving size
  return quantity * (food.servingWeightGrams || food.servingSize || 100);
}

/**
 * Calculates scaled macronutrients for a given food, quantity, and selected unit.
 */
export function calculateMacrosForQuantity(
  food: FoodItemDefinition,
  quantity: number,
  unit: string
) {
  const targetGrams = getWeightInGrams(food, quantity, unit);
  const baseWeightGrams = food.servingWeightGrams || food.servingSize || 100;

  if (baseWeightGrams <= 0 || targetGrams <= 0) {
    return {
      weightGrams: 0,
      calories: 0,
      proteinGrams: 0,
      carbsGrams: 0,
      fatGrams: 0,
      saturatedFatGrams: 0,
      fiberGrams: 0,
      sugarGrams: 0,
      sodiumMg: 0,
    };
  }

  const ratio = targetGrams / baseWeightGrams;

  return {
    weightGrams: Math.round(targetGrams * 10) / 10,
    calories: Math.max(0, Math.round(food.calories * ratio)),
    proteinGrams: Math.round(food.proteinGrams * ratio * 10) / 10,
    carbsGrams: Math.round(food.carbsGrams * ratio * 10) / 10,
    fatGrams: Math.round(food.fatGrams * ratio * 10) / 10,
    saturatedFatGrams: food.saturatedFatGrams ? Math.round(food.saturatedFatGrams * ratio * 10) / 10 : 0,
    fiberGrams: food.fiberGrams ? Math.round(food.fiberGrams * ratio * 10) / 10 : 0,
    sugarGrams: food.sugarGrams ? Math.round(food.sugarGrams * ratio * 10) / 10 : 0,
    sodiumMg: food.sodiumMg ? Math.round(food.sodiumMg * ratio * 10) / 10 : 0,
  };
}

/**
 * Supplies an intelligent list of selectable units tailored for a specific food.
 */
export function getAvailableUnitsForFood(food: FoodItemDefinition): ServingUnitOption[] {
  const nameLower = `${food.name} ${food.regionalName || ""} ${food.id || ""}`.toLowerCase();
  const units: ServingUnitOption[] = [];

  // Always include grams
  units.push({ unit: "g", label: "Grams (g)", factorToGrams: 1 });

  // Density-specific unit sets
  if (nameLower.includes("honey") || nameLower.includes("shahad")) {
    units.push({ unit: "tsp", label: "Teaspoon (7g)", factorToGrams: 7 });
    units.push({ unit: "tbsp", label: "Tablespoon (21g)", factorToGrams: 21 });
    units.push({ unit: "cup", label: "Cup (340g)", factorToGrams: 340 });
    units.push({ unit: "kg", label: "Kilograms (kg)", factorToGrams: 1000 });
    return units;
  }

  if (nameLower.includes("oat") || nameLower.includes("jai")) {
    units.push({ unit: "cup", label: "Cup Dry Oats (80g)", factorToGrams: 80 });
    units.push({ unit: "tbsp", label: "Tablespoon (10g)", factorToGrams: 10 });
    units.push({ unit: "katori", label: "Katori Dry (40g)", factorToGrams: 40 });
    units.push({ unit: "kg", label: "Kilograms (kg)", factorToGrams: 1000 });
    return units;
  }

  if (nameLower.includes("banana") || nameLower.includes("kela")) {
    units.push({ unit: "medium", label: "1 Medium Banana (118g)", factorToGrams: 118 });
    units.push({ unit: "small", label: "1 Small Banana (101g)", factorToGrams: 101 });
    units.push({ unit: "large", label: "1 Large Banana (136g)", factorToGrams: 136 });
    units.push({ unit: "piece", label: "Piece (118g)", factorToGrams: 118 });
    units.push({ unit: "cup", label: "Cup Sliced (150g)", factorToGrams: 150 });
    return units;
  }

  if (nameLower.includes("milk") || nameLower.includes("dahi") || nameLower.includes("curd")) {
    units.push({ unit: "cup", label: "Cup (240ml / 240g)", factorToGrams: 240 });
    units.push({ unit: "glass", label: "Glass (250ml)", factorToGrams: 250 });
    units.push({ unit: "ml", label: "Millilitres (ml)", factorToGrams: 1 });
    units.push({ unit: "l", label: "Litres (L / 1,000ml)", factorToGrams: 1000 });
    units.push({ unit: "tbsp", label: "Tablespoon (15ml)", factorToGrams: 15 });
    return units;
  }

  if (nameLower.includes("oil") || nameLower.includes("ghee") || nameLower.includes("butter")) {
    units.push({ unit: "tbsp", label: "Tablespoon (14g)", factorToGrams: 14 });
    units.push({ unit: "tsp", label: "Teaspoon (4.5g)", factorToGrams: 4.5 });
    units.push({ unit: "ml", label: "Millilitres (ml)", factorToGrams: 0.92 });
    units.push({ unit: "cup", label: "Cup (218g)", factorToGrams: 218 });
    return units;
  }

  if (nameLower.includes("flour") || nameLower.includes("atta") || nameLower.includes("besan") || nameLower.includes("maida")) {
    units.push({ unit: "cup", label: "Cup (120g)", factorToGrams: 120 });
    units.push({ unit: "tbsp", label: "Tablespoon (8g)", factorToGrams: 8 });
    units.push({ unit: "katori", label: "Katori (90g)", factorToGrams: 90 });
    units.push({ unit: "kg", label: "Kilograms (kg)", factorToGrams: 1000 });
    return units;
  }

  // Include food.allowedUnits if present
  if (food.allowedUnits && food.allowedUnits.length > 0) {
    for (const u of food.allowedUnits) {
      if (!units.some((existing) => existing.unit === u.unit)) {
        units.push(u);
      }
    }
  }

  // Common fallbacks
  if (food.servingUnit && !units.some((u) => u.unit === food.servingUnit)) {
    units.push({
      unit: food.servingUnit,
      label: `${food.servingSize || 1} ${food.servingUnit} (${food.servingWeightGrams || food.servingSize || 100}g)`,
      factorToGrams: food.servingWeightGrams || food.servingSize || 100,
    });
  }

  const standardUnitsToAdd = ["tbsp", "tsp", "katori", "cup", "piece", "serving"];
  for (const std of standardUnitsToAdd) {
    if (!units.some((u) => u.unit === std)) {
      const match = COMMON_INDIAN_UNITS.find((c) => c.unit === std);
      if (match) units.push(match);
    }
  }

  return units;
}
