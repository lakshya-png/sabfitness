export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type FoodSourceType =
  | "verified_ifct"
  | "verified_nin"
  | "curated_recipe"
  | "user_created"
  | "custom_user"
  | "custom_recipe"
  | "online_api"
  | "open_food_facts"
  | "packaged_food"
  | "manual";

export type FoodCategory =
  | "breads_rotis"
  | "rice_biryani"
  | "rice_khichdi_biryani"
  | "dal_pulses"
  | "dals_lentils_curries"
  | "sabzi_curry"
  | "non_veg"
  | "seafood"
  | "eggs"
  | "dairy_paneer"
  | "dairy_beverages"
  | "breakfast_tiffin"
  | "breakfast_staples"
  | "snacks_street_food"
  | "sweets_desserts"
  | "beverages"
  | "chutneys_pickles"
  | "cooking_fats_spices"
  | "fruits_nuts_seeds"
  | "raw_staples"
  | "fruits_vegetables"
  | "packaged_food"
  | "other";

export type IndianRegion =
  | "North Indian"
  | "South Indian"
  | "Punjabi"
  | "Gujarati"
  | "Bengali"
  | "Maharashtrian"
  | "Rajasthani"
  | "Kerala"
  | "Andhra / Telangana"
  | "Andhra / Telugu"
  | "Tamil"
  | "Karnataka"
  | "Kashmiri"
  | "Goan"
  | "Mughlai"
  | "Indo-Chinese"
  | "Odia"
  | "Pan-Indian"
  | "Continental";

export interface ServingUnitOption {
  unit: string;
  label: string;
  factorToGrams: number; // 1 unit = X grams (or ml)
}

export interface MacroNutrients {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  saturatedFatGrams?: number;
  fiberGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
}

export interface FoodItemDefinition {
  id: string;
  name: string;
  regionalName?: string;
  brand?: string;
  barcode?: string;
  category?: FoodCategory;
  cuisineRegion?: IndianRegion;
  servingSize: number; // e.g. 100
  servingUnit: string; // e.g. "g" or "piece" or "katori"
  servingWeightGrams?: number; // Standard weight in grams for this base serving
  allowedUnits?: ServingUnitOption[]; // Additional selectable units with conversions
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  saturatedFatGrams?: number;
  fiberGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
  source?: FoodSourceType;
  prepMethod?: string; // "boiled", "shallow_fried", "deep_fried", "roasted", "raw", "steamed", "cooked", "rich_gravy", "low_fat"
  tags?: string[];
  isCustom?: boolean;
  userId?: string; // for user-created custom foods
  createdAt?: string;
}

export interface RecipeIngredient {
  id: string;
  foodId?: string;
  foodItemId?: string;
  foodName?: string;
  foodItem?: FoodItemDefinition;
  quantity: number; // e.g. 50, 1.5
  unit: string; // "g", "ml", "piece", "katori", "tbsp"
  weightGrams: number; // calculated total weight
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  saturatedFatGrams?: number;
  fiberGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
}

export interface RecipeDefinition {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  category?: string;
  servings: number; // total servings made, e.g. 2 or 4
  cookedWeightGrams?: number; // final weighed cooked batch mass (e.g. 350g)
  rawWeightGrams?: number; // sum of raw ingredient weights
  yieldType?: "servings" | "cooked_weight";
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  instructions?: string[];
  notes?: string;
  ingredients: RecipeIngredient[];
  totalCalories?: number;
  totalProteinGrams?: number;
  totalCarbsGrams?: number;
  totalFatGrams?: number;
  totalFiberGrams?: number;
  totalSaturatedFatGrams?: number;
  caloriesPerServing?: number;
  proteinPerServing?: number;
  carbsPerServing?: number;
  fatPerServing?: number;
  fiberPerServing?: number;
  caloriesPer100gCooked?: number;
  proteinPer100gCooked?: number;
  carbsPer100gCooked?: number;
  fatPer100gCooked?: number;
  fiberPer100gCooked?: number;
  totalMacros?: MacroNutrients;
  perServingMacros?: MacroNutrients;
  per100gCookedMacros?: MacroNutrients;
  createdAt: string;
  updatedAt: string;
}

export interface SavedMealTemplate {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  defaultMealType?: MealType;
  mealType?: MealType;
  items: LoggedFoodItem[];
  createdAt: string;
}

export interface LoggedFoodItem {
  id: string;
  foodId?: string;
  foodName: string;
  name?: string;
  brand?: string;
  mealType: MealType;
  servingAmount: number; // multiplier, e.g. 150g or 2 pieces
  servingSize?: number;
  servingUnit: string;
  servingWeightGrams?: number;
  quantity?: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  saturatedFatGrams?: number;
  fiberGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
  source?: FoodSourceType;
  isRecipe?: boolean;
  recipeId?: string;
  loggedAt: string;
}

export interface DailyNutritionLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  items: LoggedFoodItem[];
  totals: MacroNutrients;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
}

export interface OnlineSearchResult {
  id: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  sugarGrams?: number;
  source: "openfoodfacts" | "usda";
  imageUrl?: string;
}

export interface AIRecipeClarifyingQuestion {
  id: string;
  question: string;
  options: string[];
  selectedOption?: string;
  affectedField: "ingredient_choice" | "quantity" | "unit" | "servings" | "oil" | "general";
  rationale?: string;
}

export interface AIRecipeDraftIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isProposedDefault?: boolean;
  matchedFoodId?: string;
  matchedFoodName?: string;
  matchStatus: "verified" | "estimated" | "unmatched" | "custom";
  weightGrams: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  saturatedFatGrams?: number;
  fiberGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
  notes?: string;
}

export interface AIRecipeDraft {
  id?: string;
  recipeName: string;
  description: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  cookedWeightGrams?: number;
  rawWeightGrams?: number;
  ingredients: AIRecipeDraftIngredient[];
  instructions: string[];
  clarifyingQuestions?: AIRecipeClarifyingQuestion[];
  dietaryTags?: string[];
  suggestedTweaks?: string[];
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalFiberGrams?: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  fiberPerServing?: number;
  caloriesPer100gCooked?: number;
  proteinPer100gCooked?: number;
  carbsPer100gCooked?: number;
  fatPer100gCooked?: number;
  isAiGenerated?: boolean;
  aiProvider?: string;
  requiresClarification?: boolean;
}

export interface AIRecipeRequest {
  prompt: string;
  currentDraft?: AIRecipeDraft;
  userDietaryPreference?: string;
  answeredQuestions?: Record<string, string>;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
}

export interface AIRecipeResponse {
  draft: AIRecipeDraft;
  message: string;
  clarifyingQuestions: AIRecipeClarifyingQuestion[];
  isOnlineAI: boolean;
  provider: string;
  warning?: string;
}
